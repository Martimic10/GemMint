import { NextResponse } from "next/server";
import {
  cleanEnv,
  isStripeConfigured,
  PRICE_ENV_BY_PACK,
  resolveStripePriceId,
  siteUrl,
  stripeSecretMode,
} from "@/lib/stripe";
import { ALL_PURCHASE_OPTIONS } from "@/lib/scan-packs";

export const runtime = "nodejs";

/** Safe, secret-free diagnostics for production Stripe setup. */
export async function GET() {
  const mode = stripeSecretMode();
  let resolvedSiteUrl = "";
  let siteUrlError = "";
  try {
    resolvedSiteUrl = siteUrl();
  } catch (error) {
    siteUrlError = error instanceof Error ? error.message : "invalid site url";
  }

  const prices = Object.fromEntries(
    ALL_PURCHASE_OPTIONS.map((pack) => {
      const envName = PRICE_ENV_BY_PACK[pack.id];
      const raw = cleanEnv(process.env[envName]);
      const resolved = resolveStripePriceId(pack);
      return [
        pack.id,
        {
          env: envName,
          present: Boolean(raw),
          looksLikePriceId: Boolean(resolved && /^price_/.test(resolved)),
          prefix: resolved ? resolved.slice(0, 12) : null,
        },
      ];
    })
  );

  const admin = {
    projectId: Boolean(
      cleanEnv(process.env.FIREBASE_ADMIN_PROJECT_ID) ||
        cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
    ),
    clientEmail: Boolean(cleanEnv(process.env.FIREBASE_ADMIN_CLIENT_EMAIL)),
    privateKey: Boolean(cleanEnv(process.env.FIREBASE_ADMIN_PRIVATE_KEY)),
  };

  return NextResponse.json({
    stripeConfigured: isStripeConfigured(),
    mode,
    siteUrl: resolvedSiteUrl || null,
    siteUrlError: siteUrlError || null,
    siteUrlLooksLocal: /localhost|127\.0\.0\.1/i.test(resolvedSiteUrl),
    envSiteUrlSet: Boolean(cleanEnv(process.env.NEXT_PUBLIC_SITE_URL)),
    prices,
    firebaseAdmin: admin,
    hint:
      mode === "live" && /localhost|127\.0\.0\.1/i.test(resolvedSiteUrl)
        ? "NEXT_PUBLIC_SITE_URL is localhost while using live Stripe keys — set it to https://gem-mint-teal.vercel.app"
        : "Open this while signed out is fine. If mode is test, use test Price IDs; if live, use live Price IDs.",
  });
}
