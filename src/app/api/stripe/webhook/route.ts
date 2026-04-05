import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
  });
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailed(pi);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = getSupabase();
  const metadata = session.metadata || {};

  const shippingAddress = session.shipping_details?.address;
  const guestAddress = shippingAddress
    ? {
        postal_code: shippingAddress.postal_code || "",
        prefecture: shippingAddress.state || "",
        city: shippingAddress.city || "",
        address_line1: shippingAddress.line1 || "",
        address_line2: shippingAddress.line2 || "",
        country: shippingAddress.country || "JP",
      }
    : null;

  const { error } = await supabase.from("backers").insert({
    project_id: metadata.project_id,
    reward_id: metadata.reward_id || null,
    guest_email: metadata.guest_email,
    guest_nickname: metadata.guest_nickname || null,
    guest_address: guestAddress,
    amount: parseInt(metadata.amount),
    fee_amount: parseInt(metadata.fee_amount),
    total_amount: parseInt(metadata.total_amount),
    message: metadata.message || null,
    is_anonymous: metadata.is_anonymous === "true",
    stripe_payment_intent_id: session.payment_intent as string,
    stripe_session_id: session.id,
    payment_method: "card",
    status: "paid",
    currency: "JPY",
  });

  if (error) {
    console.error("Error saving backer:", error);
  }
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("backers")
    .update({ status: "cancelled" })
    .eq("stripe_payment_intent_id", pi.id);

  if (error) {
    console.error("Error updating failed payment:", error);
  }
}
