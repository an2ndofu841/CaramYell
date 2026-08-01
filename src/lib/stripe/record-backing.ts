import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  sendBackingConfirmation,
  type BackingConfirmationItem,
} from "@/lib/email/backing-confirmation";

export type RecordBackingResult =
  | { status: "created" }
  | { status: "duplicate" }
  | { status: "not_paid" }
  | { status: "error"; message: string };

export function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
  });
}

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function resolveGuestAddress(
  session: Stripe.Checkout.Session
): Record<string, string> | null {
  const metadata = session.metadata || {};

  if (metadata.addr_line1 || metadata.addr_postal_code) {
    return {
      country: metadata.addr_country || "JP",
      recipient_name: metadata.addr_recipient_name || "",
      postal_code: metadata.addr_postal_code || "",
      prefecture: metadata.addr_prefecture || "",
      city: metadata.addr_city || "",
      address_line1: metadata.addr_line1 || "",
      address_line2: metadata.addr_line2 || "",
    };
  }

  // 旧形式（metadata に JSON 1本で保存していたセッション）
  if (metadata.guest_address) {
    try {
      return JSON.parse(metadata.guest_address);
    } catch {
      // 壊れた JSON は無視して Stripe 側の配送先にフォールバックする
    }
  }

  const shippingAddress = session.shipping_details?.address;
  if (!shippingAddress) return null;
  return {
    postal_code: shippingAddress.postal_code || "",
    prefecture: shippingAddress.state || "",
    city: shippingAddress.city || "",
    address_line1: shippingAddress.line1 || "",
    address_line2: shippingAddress.line2 || "",
    country: shippingAddress.country || "JP",
  };
}

function parseAmount(value: string | undefined): number | null {
  const n = parseInt(value ?? "", 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * 支払い済みの Checkout セッションを backers に記録する。
 *
 * webhook と成功ページの両方から呼ばれ、どちらが先に走っても、
 * また同じセッションが何度渡されても結果が変わらないようにしてある
 * （冪等性は backers.stripe_session_id の UNIQUE 制約に依存）。
 */
export async function recordBackingFromSession(
  session: Stripe.Checkout.Session
): Promise<RecordBackingResult> {
  if (session.payment_status !== "paid") {
    return { status: "not_paid" };
  }

  const metadata = session.metadata || {};
  const projectId = metadata.project_id;
  const amount = parseAmount(metadata.amount);
  const feeAmount = parseAmount(metadata.fee_amount);
  const totalAmount = parseAmount(metadata.total_amount) ?? session.amount_total;
  const guestEmail =
    metadata.guest_email ||
    session.customer_details?.email ||
    session.customer_email;

  if (!projectId || amount == null || feeAmount == null || totalAmount == null || !guestEmail) {
    return {
      status: "error",
      message: `セッション ${session.id} の metadata が不足しています`,
    };
  }

  const supabase = getServiceSupabase();
  const guestAddress = resolveGuestAddress(session);

  const { data: inserted, error } = await supabase
    .from("backers")
    .upsert(
      {
        project_id: projectId,
        reward_id: metadata.reward_id || null,
        user_id: metadata.user_id || null,
        guest_email: guestEmail,
        guest_nickname: metadata.guest_nickname || null,
        guest_address: guestAddress,
        amount,
        fee_amount: feeAmount,
        total_amount: totalAmount,
        message: metadata.message || null,
        is_anonymous: metadata.is_anonymous === "true",
        stripe_payment_intent_id: (session.payment_intent as string) || null,
        stripe_session_id: session.id,
        payment_method: "card",
        status: "paid",
        currency: "JPY",
      },
      { onConflict: "stripe_session_id", ignoreDuplicates: true }
    )
    .select("id")
    .maybeSingle();

  if (error) {
    return { status: "error", message: error.message };
  }

  // ignoreDuplicates の場合、既に記録済みなら行が返らない
  if (!inserted?.id) {
    return { status: "duplicate" };
  }

  const items = await saveBackerItems(supabase, inserted.id, session, projectId);

  const { data: project } = await supabase
    .from("projects")
    .select("title, slug")
    .eq("id", projectId)
    .maybeSingle();

  await sendBackingConfirmation({
    backerId: inserted.id,
    to: guestEmail,
    nickname: metadata.guest_nickname,
    projectTitle: project?.title || "プロジェクト",
    projectPath: `/projects/${project?.slug || projectId}`,
    amount,
    feeAmount,
    totalAmount,
    items,
    address: guestAddress,
  });

  return { status: "created" };
}

type RewardRow = {
  id: string;
  title: string;
  amount: number;
  needs_address: boolean;
};

function parseCartMetadata(
  cartItems: string | undefined
): { i: string; q: number }[] | null {
  if (!cartItems) return null;
  try {
    const cart = JSON.parse(cartItems);
    return Array.isArray(cart) && cart.length > 0 ? cart : null;
  } catch (e) {
    console.error("Error parsing cart_items:", e);
    return null;
  }
}

/**
 * Stripe の明細行からリターンを復元する。
 * metadata の cart_items は 500 文字を超えると保存を諦めるため、
 * 品目数が多い支援でも発送内容が分かるようにこちらを使う。
 * 手数料行や自由応援額の行はリターンと一致しないので自然に除外される。
 */
async function deriveCartFromLineItems(
  session: Stripe.Checkout.Session,
  rewards: RewardRow[]
): Promise<{ i: string; q: number }[]> {
  try {
    const lineItems = await getStripeClient().checkout.sessions.listLineItems(
      session.id,
      { limit: 100 }
    );
    return lineItems.data.flatMap((li) => {
      const reward = rewards.find(
        (r) => r.title === li.description && r.amount === li.price?.unit_amount
      );
      if (!reward) return [];
      return [{ i: reward.id, q: li.quantity ?? 1 }];
    });
  } catch (e) {
    console.error("Error deriving cart from line items:", e);
    return [];
  }
}

/** 発送作業用に「どのリターンを何個」を明細として保存し、確認メール用に返す */
async function saveBackerItems(
  supabase: ReturnType<typeof getServiceSupabase>,
  backerId: string,
  session: Stripe.Checkout.Session,
  projectId: string
): Promise<BackingConfirmationItem[]> {
  const { data: rewards } = await supabase
    .from("rewards")
    .select("id, title, amount, needs_address")
    .eq("project_id", projectId);
  if (!rewards || rewards.length === 0) return [];

  const cart =
    parseCartMetadata(session.metadata?.cart_items) ??
    (await deriveCartFromLineItems(session, rewards));
  if (cart.length === 0) return [];

  const rewardMap = new Map(rewards.map((r) => [r.id, r]));
  const rows = cart.flatMap((c) => {
    const r = rewardMap.get(c.i);
    if (!r) return [];
    return [
      {
        backer_id: backerId,
        reward_id: r.id,
        reward_title: r.title,
        unit_amount: r.amount,
        quantity: c.q,
        needs_address: r.needs_address,
      },
    ];
  });
  if (rows.length === 0) return [];

  const { error } = await supabase.from("backer_items").insert(rows);
  if (error) {
    console.error("Error saving backer items:", error);
  }
  return rows.map(({ reward_title, unit_amount, quantity }) => ({
    reward_title,
    unit_amount,
    quantity,
  }));
}

/** session_id から支払い状況を取得して backers に記録する（成功ページ用のフォールバック） */
export async function recordBackingFromSessionId(
  sessionId: string
): Promise<RecordBackingResult> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { status: "error", message: "STRIPE_SECRET_KEY が未設定です" };
  }
  try {
    const session = await getStripeClient().checkout.sessions.retrieve(sessionId);
    return await recordBackingFromSession(session);
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : String(e),
    };
  }
}
