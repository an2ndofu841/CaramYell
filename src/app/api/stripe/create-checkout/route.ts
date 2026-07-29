import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { missingAddressFields } from "@/lib/data/countries";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
  });
}

const FEE_RATE = 0.1;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_")) {
      return NextResponse.json(
        { error: "決済が未設定です。STRIPE_SECRET_KEY を設定してください。" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const {
      projectId,
      items, // [{ rewardId, quantity }]
      freeAmount, // 追加の自由応援額（円）
      guestEmail,
      guestNickname,
      message,
      isAnonymous,
      guestAddress,
    } = body as {
      projectId?: string;
      items?: { rewardId: string; quantity: number }[];
      freeAmount?: number;
      guestEmail?: string;
      guestNickname?: string;
      message?: string;
      isAnonymous?: boolean;
      guestAddress?: {
        country?: string;
        recipient_name?: string;
        postal_code?: string;
        prefecture?: string;
        city?: string;
        address_line1?: string;
        address_line2?: string;
      } | null;
    };

    if (!projectId || !guestEmail) {
      return NextResponse.json(
        { error: "必須パラメータが不足しています" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // プロジェクトは掲載中(active)のみ支援可能
    const { data: project } = await supabase
      .from("projects")
      .select("id, title, status, allow_free_amount")
      .eq("id", projectId)
      .maybeSingle();

    if (!project) {
      return NextResponse.json(
        { error: "プロジェクトが見つかりません" },
        { status: 404 }
      );
    }
    if (project.status !== "active") {
      return NextResponse.json(
        { error: "このプロジェクトは現在支援を受け付けていません" },
        { status: 400 }
      );
    }

    // 金額はサーバー側でDBのリターン価格から再計算（クライアントの申告額は信用しない）
    const cart = Array.isArray(items) ? items : [];
    const rewardIds = cart.map((c) => c.rewardId).filter(Boolean);

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let rewardsTotal = 0;
    let needsAddress = false;
    let singleRewardId = "";

    if (rewardIds.length > 0) {
      const { data: rewards } = await supabase
        .from("rewards")
        .select("id, title, amount, needs_address, quantity_total, quantity_claimed, project_id")
        .eq("project_id", projectId)
        .in("id", rewardIds);

      const rewardMap = new Map((rewards || []).map((r) => [r.id, r]));

      for (const c of cart) {
        const r = rewardMap.get(c.rewardId);
        if (!r) continue;
        const qty = Math.max(1, Math.floor(Number(c.quantity) || 0));
        if (qty <= 0) continue;
        // 在庫チェック
        if (r.quantity_total != null) {
          const remaining = r.quantity_total - (r.quantity_claimed || 0);
          if (qty > remaining) {
            return NextResponse.json(
              { error: `「${r.title}」の在庫が不足しています` },
              { status: 400 }
            );
          }
        }
        rewardsTotal += r.amount * qty;
        if (r.needs_address) needsAddress = true;
        lineItems.push({
          price_data: {
            currency: "jpy",
            product_data: { name: r.title },
            unit_amount: r.amount,
          },
          quantity: qty,
        });
      }
      if (cart.length === 1 && rewardMap.has(cart[0].rewardId)) {
        singleRewardId = cart[0].rewardId;
      }
    }

    // 自由応援額（掲載者が許可している場合のみ）
    const free =
      project.allow_free_amount !== false && Number(freeAmount) > 0
        ? Math.floor(Number(freeAmount))
        : 0;
    if (free > 0) {
      singleRewardId = ""; // リターン単体ではない
      lineItems.push({
        price_data: {
          currency: "jpy",
          product_data: { name: `${project.title} への応援` },
          unit_amount: free,
        },
        quantity: 1,
      });
    }

    const amount = rewardsTotal + free;
    if (amount < 100) {
      return NextResponse.json(
        { error: "応援金額は100円以上で指定してください" },
        { status: 400 }
      );
    }

    // 配送先が必要なリターンを含む場合はアプリ側で入力済みの住所を必須にする
    // （Stripe 側で再入力させないため）。必須項目は国ごとに異なる。
    const addressMeta: Record<string, string> = {};
    if (needsAddress) {
      const a = guestAddress;
      if (!a?.recipient_name?.trim()) {
        return NextResponse.json(
          { error: "お届け先氏名を入力してください" },
          { status: 400 }
        );
      }
      const missing = missingAddressFields(a?.country, a);
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `配送先住所を入力してください（${missing.join("・")}）` },
          { status: 400 }
        );
      }
      // metadata は 1 値 500 文字までのため、項目ごとに分けて保存する
      addressMeta.addr_country = String(a?.country || "JP").slice(0, 500);
      addressMeta.addr_recipient_name = String(a?.recipient_name || "").slice(0, 500);
      addressMeta.addr_postal_code = String(a?.postal_code || "").slice(0, 500);
      addressMeta.addr_prefecture = String(a?.prefecture || "").slice(0, 500);
      addressMeta.addr_city = String(a?.city || "").slice(0, 500);
      addressMeta.addr_line1 = String(a?.address_line1 || "").slice(0, 500);
      addressMeta.addr_line2 = String(a?.address_line2 || "").slice(0, 500);
    }

    const feeAmount = Math.round(amount * FEE_RATE);
    const totalAmount = amount + feeAmount;

    lineItems.push({
      price_data: {
        currency: "jpy",
        product_data: {
          name: "サービス手数料",
          description: "CaramYell サービス手数料 (10%)",
        },
        unit_amount: feeAmount,
      },
      quantity: 1,
    });

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      // payment_method_types は指定しない：Stripe ダッシュボードで有効化した
      // 決済手段（カード / Apple Pay / Link など）が自動で表示される
      line_items: lineItems,
      mode: "payment",
      customer_email: guestEmail,
      success_url: `${appUrl}/back/${projectId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/back/${projectId}`,
      metadata: {
        project_id: projectId,
        reward_id: singleRewardId,
        guest_email: guestEmail,
        guest_nickname: guestNickname || "",
        message: message || "",
        is_anonymous: String(!!isAnonymous),
        needs_address: String(needsAddress),
        amount: String(amount),
        fee_amount: String(feeAmount),
        total_amount: String(totalAmount),
        ...addressMeta,
      },
      // 住所はアプリ側で取得済みのため Stripe では再入力させない
      billing_address_collection: "auto",
      locale: "ja",
      payment_intent_data: {
        metadata: { project_id: projectId, reward_id: singleRewardId },
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: unknown) {
    console.error("Stripe checkout error:", error);
    const message =
      error instanceof Error ? error.message : "決済の作成に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
