import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { missingAddressFields } from "@/lib/data/countries";
import { SITE_URL } from "@/lib/config/site";
import { checkStripeKey } from "@/lib/stripe/mode";
import { BACKER_FEE_PERCENT, calcBackerFee } from "@/lib/config/fees";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
  });
}

/** 1リターンあたりの購入個数の上限 */
const MAX_QUANTITY_PER_REWARD = 99;
/** 1回の支援額の上限（桁の打ち間違いと、極端なセッションの作成を防ぐ） */
const MAX_AMOUNT = 9_999_999;
/** 同一IPからのセッション作成回数（10分あたり） */
const CHECKOUT_LIMIT = 10;

/**
 * 決済後の戻り先。
 *
 * 以前は Origin / Host ヘッダーをそのまま使っていたが、これらは
 * リクエスト元が自由に名乗れる。偽の Origin でセッションを作って
 * その URL を支援者に踏ませると、決済完了後に攻撃者のドメインへ
 * 誘導できてしまうため、こちらが知っている宛先だけを許可する。
 */
function resolveReturnOrigin(req: NextRequest): string {
  const origin = req.headers.get("origin");
  if (!origin || origin === SITE_URL) return SITE_URL;

  if (
    process.env.NODE_ENV !== "production" &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  ) {
    return origin;
  }
  // Vercel のプレビュー環境は毎回ドメインが変わる
  if (
    process.env.VERCEL_ENV &&
    process.env.VERCEL_ENV !== "production" &&
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)
  ) {
    return origin;
  }

  return SITE_URL;
}

export async function POST(req: NextRequest) {
  try {
    const keyCheck = checkStripeKey();
    if (!keyCheck.ok) {
      console.error(`Stripe key rejected: ${keyCheck.reason}`);
      return NextResponse.json({ error: keyCheck.reason }, { status: 503 });
    }

    // 未認証でも支援できる導線なので、連打で Stripe セッションを
    // 大量生成されないよう IP 単位で頭を押さえる
    const limit = rateLimit(
      clientKey(req, "checkout"),
      CHECKOUT_LIMIT,
      10 * 60 * 1000
    );
    if (!limit.ok) {
      return tooManyRequests(limit.retryAfter);
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

    // ログイン中なら支援をアカウントに紐付ける。未ログインならゲスト支援のまま
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // プロジェクトは掲載中(active)かつ募集期間内のみ支援可能
    const { data: project } = await supabase
      .from("projects")
      .select("id, title, status, allow_free_amount, end_date")
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
    // status の切り替えが遅れても、締切を過ぎた決済は受け付けない
    if (project.end_date && new Date(project.end_date).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "このプロジェクトの募集期間は終了しています" },
        { status: 400 }
      );
    }

    // 金額はサーバー側でDBのリターン価格から再計算（クライアントの申告額は信用しない）
    // 同じリターンが複数行で届くと在庫チェックを行ごとにすり抜けられるため、
    // ここで rewardId 単位に合算してから数える。
    const mergedCart = new Map<string, number>();
    for (const c of Array.isArray(items) ? items : []) {
      if (!c?.rewardId || typeof c.rewardId !== "string") continue;
      const qty = Math.floor(Number(c.quantity));
      if (!Number.isFinite(qty) || qty <= 0) continue;
      mergedCart.set(c.rewardId, (mergedCart.get(c.rewardId) || 0) + qty);
    }
    const cart = [...mergedCart].map(([rewardId, quantity]) => ({
      rewardId,
      quantity,
    }));
    const rewardIds = cart.map((c) => c.rewardId);

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let rewardsTotal = 0;
    let needsAddress = false;
    let singleRewardId = "";
    // 発送管理用に「どのリターンを何個」を記録する（webhook で明細化）
    const cartMeta: { i: string; q: number }[] = [];

    if (rewardIds.length > 0) {
      const { data: rewards } = await supabase
        .from("rewards")
        .select("id, title, amount, needs_address, quantity_total, quantity_claimed, project_id")
        .eq("project_id", projectId)
        .in("id", rewardIds);

      const rewardMap = new Map((rewards || []).map((r) => [r.id, r]));

      for (const c of cart) {
        const r = rewardMap.get(c.rewardId);
        if (!r) {
          return NextResponse.json(
            { error: "選択されたリターンが見つかりません" },
            { status: 400 }
          );
        }
        const qty = c.quantity;
        if (qty > MAX_QUANTITY_PER_REWARD) {
          return NextResponse.json(
            { error: `「${r.title}」は一度に${MAX_QUANTITY_PER_REWARD}個まで購入できます` },
            { status: 400 }
          );
        }
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
        cartMeta.push({ i: r.id, q: qty });
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
    const requestedFree = Math.floor(Number(freeAmount));
    const free =
      project.allow_free_amount !== false && Number.isFinite(requestedFree) && requestedFree > 0
        ? requestedFree
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
    if (amount > MAX_AMOUNT) {
      return NextResponse.json(
        { error: `1回の支援は${MAX_AMOUNT.toLocaleString("ja-JP")}円までです` },
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

    const feeAmount = calcBackerFee(amount);
    const totalAmount = amount + feeAmount;

    lineItems.push({
      price_data: {
        currency: "jpy",
        product_data: {
          name: "サービス手数料",
          description: `CaramYell サービス手数料 (${BACKER_FEE_PERCENT}%)`,
        },
        unit_amount: feeAmount,
      },
      quantity: 1,
    });

    const stripe = getStripe();
    const appUrl = resolveReturnOrigin(req);

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
        user_id: user?.id || "",
        guest_email: guestEmail,
        guest_nickname: guestNickname || "",
        message: message || "",
        is_anonymous: String(!!isAnonymous),
        needs_address: String(needsAddress),
        amount: String(amount),
        fee_amount: String(feeAmount),
        total_amount: String(totalAmount),
        // metadata は1値500文字まで。多すぎる場合は明細を諦めて決済は通す
        cart_items:
          JSON.stringify(cartMeta).length <= 500 ? JSON.stringify(cartMeta) : "",
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
    // 内部エラーの文面をそのまま返すと構成の手掛かりを与えるのでログだけに残す
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "決済の作成に失敗しました。時間をおいて再度お試しください" },
      { status: 500 }
    );
  }
}
