import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import {
  getStripe,
  isStripeConfigured,
  requirePackWithPrice,
  siteUrl,
} from "@/lib/stripe";

export const runtime = "nodejs";

const bodySchema = z.object({
  packId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error:
            "Stripe is not configured on the server. Add STRIPE_SECRET_KEY (and Price IDs) in Vercel env, then redeploy.",
        },
        { status: 503 }
      );
    }

    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";
    if (!token) {
      return NextResponse.json(
        { error: "Sign in required to purchase credits." },
        { status: 401 }
      );
    }

    let uid: string;
    let email: string | undefined;
    try {
      const decoded = await verifyFirebaseIdToken(token);
      uid = decoded.uid;
      email = decoded.email;
    } catch (authError) {
      console.error("Checkout auth failed:", authError);
      return NextResponse.json(
        {
          error:
            "Could not verify your login with Firebase Admin. Check FIREBASE_ADMIN_PRIVATE_KEY / CLIENT_EMAIL on Vercel (no extra quotes; keep \\n in the private key), then redeploy.",
        },
        { status: 401 }
      );
    }

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid pack selection." }, { status: 400 });
    }

    const { pack, priceId } = requirePackWithPrice(parsed.data.packId);
    const origin = siteUrl();
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?billing=cancelled`,
      client_reference_id: uid,
      customer_email: email,
      metadata: {
        firebaseUid: uid,
        packId: pack.id,
        creditKind: pack.creditKind,
        credits: String(pack.credits),
      },
      payment_intent_data: {
        metadata: {
          firebaseUid: uid,
          packId: pack.id,
        },
      },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a Checkout URL." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    const message =
      error instanceof Error ? error.message : "Could not start checkout.";
    // Stripe often returns "No such price: 'price_xxx'" for test/live mismatches.
    const status =
      message.includes("Price ID") || message.includes("No such price")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
