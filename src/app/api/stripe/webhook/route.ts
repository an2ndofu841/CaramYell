import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  getStripeClient,
  recordBackingFromSession,
} from "@/lib/stripe/record-backing";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // 遅延決済（コンビニ・銀行振込など）は completed 時点では未払いのため、
      // 入金確定イベントも同じ処理に通す
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const result = await recordBackingFromSession(session);
        if (result.status === "error") {
          // 200 を返すと Stripe が再送しないため、決済成功なのに
          // DB に残らない取りこぼしが確定してしまう
          console.error("Error saving backer:", result.message);
          return NextResponse.json(
            { error: "Failed to record backing" },
            { status: 500 }
          );
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(pi);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }
      // チャージバック。資金は Stripe に引き上げられるので、
      // 集計と発送リストから外すために返金と同じ扱いにする
      case "charge.dispute.created":
      case "charge.dispute.closed": {
        const dispute = event.data.object as Stripe.Dispute;
        await handleDispute(dispute);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("backers")
    .update({ status: "cancelled" })
    .eq("stripe_payment_intent_id", pi.id);

  if (error) {
    console.error("Error updating failed payment:", error);
    throw new Error(error.message);
  }
}

/**
 * Stripe 側で返金したら支援も返金済みにする。
 *
 * プロジェクトの集計金額と応援人数は backers の paid → refunded を
 * トリガーが拾って戻す仕組みなので、ここで status を動かさないと
 * 返金したぶんだけ集計が多いまま残ってしまう。
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  // 一部返金は「支援としては有効だが金額だけ減った」のか「取り消し」なのか
  // 判断できないので、自動では動かさず記録だけ残して人の判断に委ねる
  if (charge.amount_refunded < charge.amount) {
    console.warn(
      `Partial refund on ${paymentIntentId} (${charge.amount_refunded}/${charge.amount}). Left as paid for manual review.`
    );
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("backers")
    .update({ status: "refunded" })
    // 既に返金済みの行を再度更新しないことで、再送されても集計が二重に減らない
    .eq("stripe_payment_intent_id", paymentIntentId)
    .eq("status", "paid");

  if (error) {
    console.error("Error marking backing refunded:", error);
    throw new Error(error.message);
  }
}

/**
 * チャージバック（不服申立）。
 *
 * 申立が起きた時点で入金は保留・引き上げになるため、集計に載せたままだと
 * 掲載者が実際には受け取れない金額を見て発送してしまう。
 * 掲載者に有利な裁定で終わった場合だけ paid に戻す。
 */
async function handleDispute(dispute: Stripe.Dispute) {
  const paymentIntentId =
    typeof dispute.payment_intent === "string"
      ? dispute.payment_intent
      : dispute.payment_intent?.id;
  if (!paymentIntentId) return;

  const won = dispute.status === "won";
  const supabase = getSupabase();
  const { error } = await supabase
    .from("backers")
    .update({ status: won ? "paid" : "refunded" })
    .eq("stripe_payment_intent_id", paymentIntentId)
    .eq("status", won ? "refunded" : "paid");

  if (error) {
    console.error("Error updating disputed backing:", error);
    throw new Error(error.message);
  }

  console.warn(
    `Dispute ${dispute.id} (${dispute.status}) on ${paymentIntentId}: marked as ${won ? "paid" : "refunded"}`
  );
}
