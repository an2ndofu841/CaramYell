import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { blankToNull } from "@/lib/api/text";
import { createClient } from "@/lib/supabase/server";
import { sendBackingConfirmation } from "@/lib/email/backing-confirmation";
import type { GuestAddress } from "@/types";

/**
 * 現地（会場）で現金を受け取った支援を、掲載者が記録する。
 *
 * Stripe を通らないので webhook が無く、ここで backers に直接書く。
 * 掲載者の INSERT ポリシーは 020 で外してあるため service_role で書き込み、
 * その代わり「自分のプロジェクトか」「受付中か」をこの API で必ず確かめる。
 * 集計（支援総額・人数・リターン残数）は既存トリガーが拾うので触らない。
 *
 * 手数料は取らない（現金は掲載者が直接受け取り、運営を経由しないため）。
 * fee_amount = 0、total_amount = amount で記録する。
 */

const MAX_QUANTITY_PER_REWARD = 20;
const MAX_AMOUNT = 10_000_000;
const MAX_NICKNAME = 50;
const MAX_MESSAGE = 500;
const MAX_NOTE = 500;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 現地支援を受け付けられる掲載ステータス。終了・下書きには足せない */
const ACCEPTING_STATUSES = ["active", "funded"];

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false } });
}

async function loadOwnedProject(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, project: null };

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, slug, status, end_date")
    .eq("id", id)
    .eq("creator_id", user.id)
    .maybeSingle();

  return { user, project };
}

type ItemInput = { rewardId: string; quantity: number };

function parseItems(raw: unknown): ItemInput[] {
  // 同じリターンが複数行で届くと在庫チェックを行ごとにすり抜けられるため、
  // rewardId 単位に合算する（Stripe 経路と同じ扱い）
  const merged = new Map<string, number>();
  for (const c of Array.isArray(raw) ? raw : []) {
    if (!c?.rewardId || typeof c.rewardId !== "string") continue;
    const qty = Math.floor(Number(c.quantity));
    if (!Number.isFinite(qty) || qty <= 0) continue;
    merged.set(c.rewardId, (merged.get(c.rewardId) || 0) + qty);
  }
  return [...merged].map(([rewardId, quantity]) => ({ rewardId, quantity }));
}

function parseAddress(raw: unknown): GuestAddress | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  const pick = (k: string) => blankToNull(a[k]) ?? undefined;
  const address: GuestAddress = {
    country: pick("country") ?? "JP",
    recipient_name: pick("recipient_name"),
    postal_code: pick("postal_code"),
    prefecture: pick("prefecture"),
    city: pick("city"),
    address_line1: pick("address_line1"),
    address_line2: pick("address_line2"),
  };
  // 国以外が全部空なら「住所なし」とみなす
  const filled = Object.entries(address).some(
    ([k, v]) => k !== "country" && v
  );
  return filled ? address : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, project } = await loadOwnedProject(id);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  if (!project) {
    return NextResponse.json(
      { error: "プロジェクトが見つかりません" },
      { status: 404 }
    );
  }
  if (!ACCEPTING_STATUSES.includes(project.status)) {
    return NextResponse.json(
      { error: "支援を受け付けているプロジェクトにのみ記録できます" },
      { status: 400 }
    );
  }

  const service = getServiceSupabase();
  if (!service) {
    return NextResponse.json(
      { error: "サーバーの設定が不足しています" },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const nickname = blankToNull(body.nickname);
  const email = blankToNull(body.email)?.toLowerCase() ?? null;
  const message = blankToNull(body.message);
  const note = blankToNull(body.note);
  const isAnonymous = body.isAnonymous === true;
  const freeAmount = Math.floor(Number(body.freeAmount ?? 0));
  const items = parseItems(body.items);
  const address = parseAddress(body.address);

  if (nickname && nickname.length > MAX_NICKNAME) {
    return NextResponse.json(
      { error: `お名前は${MAX_NICKNAME}文字以内で入力してください` },
      { status: 400 }
    );
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "メールアドレスの形式が正しくありません" },
      { status: 400 }
    );
  }
  if (message && message.length > MAX_MESSAGE) {
    return NextResponse.json(
      { error: `メッセージは${MAX_MESSAGE}文字以内で入力してください` },
      { status: 400 }
    );
  }
  if (note && note.length > MAX_NOTE) {
    return NextResponse.json(
      { error: `メモは${MAX_NOTE}文字以内で入力してください` },
      { status: 400 }
    );
  }
  if (!Number.isFinite(freeAmount) || freeAmount < 0) {
    return NextResponse.json(
      { error: "応援金額が正しくありません" },
      { status: 400 }
    );
  }

  // 金額はクライアントの申告ではなく DB のリターン価格から組み立てる
  let rewardsTotal = 0;
  const itemRows: {
    reward_id: string;
    reward_title: string;
    unit_amount: number;
    quantity: number;
    needs_address: boolean;
  }[] = [];

  if (items.length > 0) {
    const { data: rewards } = await service
      .from("rewards")
      .select("id, title, amount, needs_address, quantity_total, quantity_claimed")
      .eq("project_id", id)
      .in(
        "id",
        items.map((c) => c.rewardId)
      );
    const rewardMap = new Map((rewards || []).map((r) => [r.id, r]));

    for (const c of items) {
      const r = rewardMap.get(c.rewardId);
      if (!r) {
        return NextResponse.json(
          { error: "選択されたリターンが見つかりません" },
          { status: 400 }
        );
      }
      if (c.quantity > MAX_QUANTITY_PER_REWARD) {
        return NextResponse.json(
          {
            error: `「${r.title}」は一度に${MAX_QUANTITY_PER_REWARD}個まで記録できます`,
          },
          { status: 400 }
        );
      }
      if (r.quantity_total != null) {
        const remaining = r.quantity_total - (r.quantity_claimed || 0);
        if (c.quantity > remaining) {
          return NextResponse.json(
            { error: `「${r.title}」の残数が不足しています（残り${Math.max(remaining, 0)}）` },
            { status: 400 }
          );
        }
      }
      rewardsTotal += r.amount * c.quantity;
      itemRows.push({
        reward_id: r.id,
        reward_title: r.title,
        unit_amount: r.amount,
        quantity: c.quantity,
        needs_address: r.needs_address ?? false,
      });
    }
  }

  const amount = rewardsTotal + freeAmount;
  if (amount <= 0) {
    return NextResponse.json(
      { error: "リターンを選ぶか、応援金額を入力してください" },
      { status: 400 }
    );
  }
  if (amount > MAX_AMOUNT) {
    return NextResponse.json(
      { error: `1件の支援は${MAX_AMOUNT.toLocaleString()}円までです` },
      { status: 400 }
    );
  }

  const { data: inserted, error } = await service
    .from("backers")
    .insert({
      project_id: id,
      // 単品のときだけ旧来の reward_id も埋める（複数なら明細で分かる）
      reward_id: itemRows.length === 1 ? itemRows[0].reward_id : null,
      user_id: null,
      guest_email: email,
      guest_nickname: nickname,
      guest_address: address,
      amount,
      fee_amount: 0,
      total_amount: amount,
      currency: "JPY",
      message,
      is_anonymous: isAnonymous,
      payment_method: "cash",
      status: "paid",
      fulfillment_note: note,
      recorded_by: user.id,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    console.error("[offline-backing] insert failed", error);
    return NextResponse.json(
      { error: "支援の記録に失敗しました。時間をおいて再度お試しください" },
      { status: 500 }
    );
  }

  if (itemRows.length > 0) {
    const { error: itemsError } = await service
      .from("backer_items")
      .insert(itemRows.map((row) => ({ ...row, backer_id: inserted.id })));
    if (itemsError) {
      // 明細が無くても支援そのものは成立しているので、記録は残す
      console.error("[offline-backing] items insert failed", itemsError);
    }
  }

  if (email) {
    await sendBackingConfirmation({
      backerId: inserted.id,
      to: email,
      nickname,
      projectTitle: project.title || "プロジェクト",
      projectPath: `/projects/${project.slug || project.id}`,
      amount,
      feeAmount: 0,
      totalAmount: amount,
      items: itemRows.map(({ reward_title, unit_amount, quantity }) => ({
        reward_title,
        unit_amount,
        quantity,
      })),
      address: address as Record<string, string> | null,
      paymentNote: "会場にて現金でお支払い（お支払い済み）",
    });
  }

  const { data: backer } = await service
    .from("backers")
    .select(
      `
      *,
      rewards(id, title, reward_type),
      backer_items(id, reward_id, reward_title, unit_amount, quantity, needs_address)
    `
    )
    .eq("id", inserted.id)
    .maybeSingle();

  return NextResponse.json({ backer }, { status: 201 });
}

/**
 * 現地支援の記録を取り消す（入力ミス・返金）。
 * 現金の記録だけが対象で、Stripe 経由の支援は Stripe 側の返金 → webhook で動く。
 * 行は消さず status を refunded にして、集計トリガーに引き戻させる。
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, project } = await loadOwnedProject(id);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  if (!project) {
    return NextResponse.json(
      { error: "プロジェクトが見つかりません" },
      { status: 404 }
    );
  }

  const service = getServiceSupabase();
  if (!service) {
    return NextResponse.json(
      { error: "サーバーの設定が不足しています" },
      { status: 503 }
    );
  }

  const backerId = new URL(req.url).searchParams.get("backerId");
  if (!backerId) {
    return NextResponse.json(
      { error: "取り消す支援を指定してください" },
      { status: 400 }
    );
  }

  const { data: updated, error } = await service
    .from("backers")
    .update({ status: "refunded" })
    .eq("id", backerId)
    .eq("project_id", id)
    .eq("payment_method", "cash")
    .eq("status", "paid")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[offline-backing] cancel failed", error);
    return NextResponse.json(
      { error: "取り消しに失敗しました。時間をおいて再度お試しください" },
      { status: 500 }
    );
  }
  if (!updated) {
    return NextResponse.json(
      { error: "取り消せる現地支援が見つかりません" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
