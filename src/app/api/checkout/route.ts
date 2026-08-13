import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import {
  getStripe,
  isStripeConfigured,
  isValidEmail,
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
    const successUrl = `${origin}/dashboard?billing=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/dashboard?billing=cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: uid,
      ...(isValidEmail(email) ? { customer_email: email.trim() } : {}),
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
    let message =
      error instanceof Error ? error.message : "Could not start checkout.";

    // Stripe SDK errors often nest the useful text.
    if (error && typeof error === "object" && "raw" in error) {
      const raw = (error as { raw?: { message?: string } }).raw;
      if (raw?.message) message = raw.message;
    }
    if (message === "The string did not match the expected pattern.") {
      message =
        "Checkout rejected a URL, email, or Price ID format. Confirm NEXT_PUBLIC_SITE_URL is https://gem-mint-teal.vercel.app (no quotes) and each STRIPE_PRICE_* value is a price_… ID from the same mode as STRIPE_SECRET_KEY, then redeploy.";
    }

    const status =
      message.includes("Price ID") ||
      message.includes("No such price") ||
      message.includes("NEXT_PUBLIC_SITE_URL")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
