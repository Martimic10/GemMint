import "server-only";
import Stripe from "stripe";
import type { ScanPack, ScanPackId } from "@/lib/scan-packs";
import { ALL_PURCHASE_OPTIONS, getScanPack } from "@/lib/scan-packs";

let stripeSingleton: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY. Add it to .env.local to enable Checkout."
    );
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, {
      apiVersion: "2026-07-29.dahlia",
      typescript: true,
    });
  }
  return stripeSingleton;
}

const PRICE_ENV_BY_PACK: Record<ScanPackId, string> = {
  "lot-price": "STRIPE_PRICE_LOT_PRICE",
  professional: "STRIPE_PRICE_PROFESSIONAL",
  starter: "STRIPE_PRICE_STARTER",
  collector: "STRIPE_PRICE_COLLECTOR",
  dealer: "STRIPE_PRICE_DEALER",
};

/** Resolve Stripe Price ID from env (preferred) or pack.stripePriceId. */
export function resolveStripePriceId(pack: ScanPack): string | null {
  const envName = PRICE_ENV_BY_PACK[pack.id];
  const fromEnv = envName ? process.env[envName]?.trim() : "";
  if (fromEnv) return fromEnv;
  return pack.stripePriceId?.trim() || null;
}

export function getPackForStripePriceId(priceId: string): ScanPack | undefined {
  return ALL_PURCHASE_OPTIONS.find((pack) => {
    const resolved = resolveStripePriceId(pack);
    return resolved === priceId || pack.stripePriceId === priceId;
  });
}

export function requirePackWithPrice(packId: string): {
  pack: ScanPack;
  priceId: string;
} {
  const pack = getScanPack(packId);
  if (!pack) {
    throw new Error("Unknown pack.");
  }
  const priceId = resolveStripePriceId(pack);
  if (!priceId) {
    throw new Error(
      `Stripe Price ID missing for “${pack.name}”. Set ${PRICE_ENV_BY_PACK[pack.id]} in .env.local.`
    );
  }
  return { pack, priceId };
}

/**
 * Resolve which GemMint pack was purchased from a Checkout Session.
 * Prefers the Stripe Price on the paid line item (authoritative), then metadata.
 */
export async function resolvePackFromCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<ScanPack> {
  const stripe = getStripe();

  // 1) Paid line item price → env Price ID map (what the customer actually bought)
  let lineItems = session.line_items?.data;
  if (!lineItems) {
    const full = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items.data.price"],
    });
    lineItems = full.line_items?.data;
  }

  for (const item of lineItems ?? []) {
    const price = item.price;
    const priceId = typeof price === "string" ? price : price?.id;
    if (!priceId) continue;
    const fromPrice = getPackForStripePriceId(priceId);
    if (fromPrice) return fromPrice;
  }

  // 2) Session metadata set at Checkout creation
  const metaPackId = session.metadata?.packId?.trim();
  if (metaPackId) {
    const fromMeta = getScanPack(metaPackId);
    if (fromMeta) return fromMeta;
  }

  throw new Error(
    `Could not resolve pack for Checkout session ${session.id}. Check STRIPE_PRICE_* env mapping.`
  );
}

export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "http://localhost:3000";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw.replace(/\/$/, "");
  return `https://${raw.replace(/\/$/, "")}`;
}
