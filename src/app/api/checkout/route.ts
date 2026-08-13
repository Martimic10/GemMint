import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import {
  checkoutOrigin,
  getStripe,
  isStripeConfigured,
  isValidEmail,
  requirePackWithPrice,
  stripeSecretMode,
} from "@/lib/stripe";

export const runtime = "nodejs";

const bodySchema = z.object({
  packId: z.string().min(1),
});

export async function POST(request: Request) {
  let debugOrigin = "";
  let debugPriceId = "";
  let debugMode: string = stripeSecretMode();

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
    debugPriceId = priceId;
    const origin = checkoutOrigin(request);
    debugOrigin = origin;
    debugMode = stripeSecretMode();

    if (debugMode === "live" && /localhost|127\.0\.0\.1/i.test(origin)) {
      return NextResponse.json(
        {
          error:
            "Live Stripe keys cannot use localhost return URLs. Set NEXT_PUBLIC_SITE_URL=https://gem-mint-teal.vercel.app in Vercel Production, then redeploy.",
          debug: { origin, mode: debugMode },
        },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const successUrl = `${origin}/dashboard?billing=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/dashboard?billing=cancelled`;

    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: uid,
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
    };

    if (isValidEmail(email)) {
      sessionParams.customer_email = email.trim();
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

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
    let stripeType: string | undefined;
    let stripeCode: string | undefined;
    let stripeParam: string | undefined;

    if (error && typeof error === "object") {
      const err = error as {
        raw?: { message?: string; type?: string; code?: string; param?: string };
        type?: string;
        code?: string;
        param?: string;
      };
      if (err.raw?.message) message = err.raw.message;
      stripeType = err.raw?.type ?? err.type;
      stripeCode = err.raw?.code ?? err.code;
      stripeParam = err.raw?.param ?? err.param;
    }

    if (
      message === "The string did not match the expected pattern." ||
      /did not match the expected pattern/i.test(message)
    ) {
      message = [
        "Stripe rejected a checkout field format.",
        `Return URL in use: ${debugOrigin || "(unknown)"}.`,
        `Secret key mode: ${debugMode}.`,
        `Price: ${debugPriceId ? `${debugPriceId.slice(0, 14)}…` : "(unknown)"}.`,
        "Fix: set NEXT_PUBLIC_SITE_URL=https://gem-mint-teal.vercel.app in Vercel (Production), make sure Price IDs are from the same test/live mode as STRIPE_SECRET_KEY, redeploy, then try again.",
      ].join(" ");
    }

    const status =
      message.includes("Price ID") ||
      message.includes("No such price") ||
      message.includes("NEXT_PUBLIC_SITE_URL") ||
      message.includes("localhost")
        ? 400
        : 500;

    return NextResponse.json(
      {
        error: message,
        debug: {
          origin: debugOrigin || undefined,
          mode: debugMode,
          pricePrefix: debugPriceId ? debugPriceId.slice(0, 14) : undefined,
          stripeType,
          stripeCode,
          stripeParam,
        },
      },
      { status }
    );
  }
}
