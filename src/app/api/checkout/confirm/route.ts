import { NextResponse } from "next/server";
import { fulfillCheckoutSession, verifyFirebaseIdToken } from "@/lib/firebase-admin";
import {
  getStripe,
  isStripeConfigured,
  resolvePackFromCheckoutSession,
} from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Confirm a Checkout Session after redirect (covers local/dev when webhooks lag).
 * Idempotent with the webhook fulfiller.
 */
export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe not configured." }, { status: 503 });
    }

    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";
    if (!token) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const decoded = await verifyFirebaseIdToken(token);
    const body = (await request.json().catch(() => null)) as {
      sessionId?: string;
    } | null;
    const sessionId = body?.sessionId?.trim();
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId." }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price"],
    });

    const uid =
      session.client_reference_id || session.metadata?.firebaseUid || "";
    if (!uid || uid !== decoded.uid) {
      return NextResponse.json(
        { error: "Session does not match user." },
        { status: 403 }
      );
    }

    if (session.status !== "complete") {
      return NextResponse.json(
        { error: "Checkout is not complete yet.", status: session.status },
        { status: 409 }
      );
    }

    if (
      session.payment_status !== "paid" &&
      session.payment_status !== "no_payment_required"
    ) {
      return NextResponse.json(
        {
          error: "Payment not completed.",
          paymentStatus: session.payment_status,
        },
        { status: 409 }
      );
    }

    const pack = await resolvePackFromCheckoutSession(session);

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

    return NextResponse.json({
      ok: true,
      alreadyFulfilled: result.alreadyFulfilled,
      packId: result.packId,
      credits: result.credits,
      creditKind: result.creditKind,
      packName: pack.name,
    });
  } catch (error) {
    console.error("Confirm checkout error:", error);
    const message =
      error instanceof Error ? error.message : "Could not confirm checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
