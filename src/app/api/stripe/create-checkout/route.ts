import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
  });
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    const {
      projectId,
      projectTitle,
      rewardId,
      rewardTitle,
      amount,
      feeAmount,
      totalAmount,
      guestEmail,
      guestNickname,
      message,
      isAnonymous,
      needsAddress,
      successUrl,
      cancelUrl,
    } = await req.json();

    if (!amount || !guestEmail || !projectId) {
      return NextResponse.json({ error: "必須パラメータが不足しています" }, { status: 400 });
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: "jpy",
          product_data: {
            name: rewardTitle || `${projectTitle}への応援`,
            description: rewardId
              ? `プロジェクト: ${projectTitle} / リターン: ${rewardTitle}`
              : `プロジェクト: ${projectTitle} への直接応援`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ];

    if (feeAmount > 0) {
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
    }

    const paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = [
      "card",
      "link",
    ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes,
      payment_method_options: {
        card: {
          request_three_d_secure: "automatic",
        },
      },
      line_items: lineItems,
      mode: "payment",
      customer_email: guestEmail,
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/back/${projectId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/back/${projectId}`,
      metadata: {
        project_id: projectId,
        reward_id: rewardId || "",
        guest_email: guestEmail,
        guest_nickname: guestNickname || "",
        message: message || "",
        is_anonymous: String(isAnonymous),
        needs_address: String(needsAddress),
        amount: String(amount),
        fee_amount: String(feeAmount),
        total_amount: String(totalAmount),
      },
      billing_address_collection: needsAddress ? "required" : "auto",
      shipping_address_collection: needsAddress
        ? { allowed_countries: ["JP", "US", "GB", "CA", "AU", "FR", "DE", "KR", "TW"] }
        : undefined,
      locale: "ja",
      payment_intent_data: {
        metadata: {
          project_id: projectId,
          reward_id: rewardId || "",
        },
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: unknown) {
    console.error("Stripe checkout error:", error);
    const message = error instanceof Error ? error.message : "決済の作成に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
