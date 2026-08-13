import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { fulfillCheckoutSession } from "@/lib/firebase-admin";
import {
  getStripe,
  isStripeConfigured,
  resolvePackFromCheckoutSession,
} from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature." }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      await fulfillFromSession(session);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 }
    );
  }
}

async function fulfillFromSession(session: Stripe.Checkout.Session) {
  if (
    session.payment_status !== "paid" &&
    session.payment_status !== "no_payment_required"
  ) {
    if (session.payment_status === "unpaid") return;
  }

  const uid =
    session.client_reference_id || session.metadata?.firebaseUid || "";
  if (!uid) {
    console.error("Checkout session missing uid:", session.id);
    throw new Error("Missing fulfillment uid.");
  }

  const pack = await resolvePackFromCheckoutSession(session);

  // Guard: metadata credits must match catalog if present
  const metaCredits = Number(session.metadata?.credits);
  if (
    Number.isFinite(metaCredits) &&
    metaCredits > 0 &&
    metaCredits !== pack.credits
  ) {
    console.warn(
      `Checkout ${session.id}: metadata credits (${metaCredits}) ≠ pack ${pack.id} credits (${pack.credits}). Using catalog amount.`
    );
  }

  const result = await fulfillCheckoutSession({
    sessionId: session.id,
    uid,
    packId: pack.id,
    amountTotalCents: session.amount_total,
    customerEmail:
      typeof session.customer_details?.email === "string"
        ? session.customer_details.email
        : session.customer_email,
  });

  console.info(
    result.alreadyFulfilled
      ? `Stripe session already fulfilled: ${session.id}`
      : `Fulfilled Stripe session ${session.id} → +${result.credits} ${result.creditKind} credit(s) (${pack.name}) for ${uid}`
  );
}
