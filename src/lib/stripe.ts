import "server-only";
import Stripe from "stripe";
import type { ScanPack, ScanPackId } from "@/lib/scan-packs";
import { ALL_PURCHASE_OPTIONS, getScanPack } from "@/lib/scan-packs";

let stripeSingleton: Stripe | null = null;

function cleanEnv(value: string | undefined | null): string {
  if (!value) return "";
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

export function isStripeConfigured(): boolean {
  return Boolean(cleanEnv(process.env.STRIPE_SECRET_KEY));
}

export function getStripe(): Stripe {
  const key = cleanEnv(process.env.STRIPE_SECRET_KEY);
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
  const fromEnv = envName ? cleanEnv(process.env[envName]) : "";
  if (fromEnv) return fromEnv;
  return cleanEnv(pack.stripePriceId) || null;
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
      `Stripe Price ID missing for “${pack.name}”. Set ${PRICE_ENV_BY_PACK[pack.id]} in Vercel env, then redeploy.`
    );
  }
  if (!/^price_[A-Za-z0-9_]+$/.test(priceId)) {
    throw new Error(
      `Invalid Stripe Price ID for “${pack.name}” (${priceId.slice(0, 24)}…). Use the Price ID that starts with price_ (not prod_), with no quotes.`
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
    cleanEnv(process.env.NEXT_PUBLIC_SITE_URL) ||
    cleanEnv(process.env.VERCEL_URL) ||
    "http://localhost:3000";

  const withProtocol =
    raw.startsWith("http://") || raw.startsWith("https://")
      ? raw
      : `https://${raw}`;
  const normalized = withProtocol.replace(/\/$/, "");

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("bad protocol");
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL is invalid (“${raw}”). Set it to https://gem-mint-teal.vercel.app with no quotes, then redeploy.`
    );
  }
}

export function isValidEmail(value: string | undefined | null): value is string {
  if (!value) return false;
  const email = value.trim();
  // Practical email check — empty/garbage emails make Stripe throw pattern errors.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
