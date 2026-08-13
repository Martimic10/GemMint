/**
 * Scan / lot credit products — single source of truth for pricing.
 * Stripe Price IDs: set env vars STRIPE_PRICE_* (see .env.example) or
 * optionally fill `stripePriceId` below.
 */

export const FREE_SCAN_CREDITS = 1;

/** Warn when remaining grade credits fall to this level or below. */
export const LOW_CREDITS_THRESHOLD = 5;

export type ScanPackId =
  | "professional"
  | "starter"
  | "collector"
  | "dealer"
  | "lot-price";

export interface ScanPack {
  id: ScanPackId;
  name: string;
  credits: number;
  price: number;
  /** Stripe Price ID — wire when Checkout is connected */
  stripePriceId: string | null;
  description: string;
  highlighted: boolean;
  badge?: string;
  cta: string;
  features: readonly string[];
  /** single = one-time report; pack = multi-credit bundle */
  type: "single" | "pack";
  /** grade = PSA/Beckett scans; lot = multi-card lot pricing */
  creditKind: "grade" | "lot";
}

/** One-time single AI grading report for collectors who don't need a pack. */
export const PROFESSIONAL_REPORT: ScanPack = {
  id: "professional",
  name: "Pro Single",
  credits: 1,
  price: 7.99,
  stripePriceId: null,
  description:
    "One full AI grading report for collectors who only need a single scan — no pack required.",
  highlighted: false,
  badge: "One-time",
  cta: "Buy Pro Single",
  type: "single",
  creditKind: "grade",
  features: [
    "PSA Grade Prediction",
    "Beckett Subgrades",
    "Centering Analysis",
    "Corner Analysis",
    "Edge Analysis",
    "Surface Analysis",
    "AI Defect Detection & Heatmaps",
    "Market Value Estimate",
    "ROI Recommendation",
    "Downloadable Professional Report (PDF)",
  ],
};

/** Flat-price lot valuation — one photo set → full lot priceout. */
export const LOT_PRICE_REPORT: ScanPack = {
  id: "lot-price",
  name: "Lot Plan",
  credits: 1,
  price: 4.99,
  stripePriceId: null,
  description:
    "Upload photos of a card lot and get AI identification with raw and graded market estimates for selling.",
  highlighted: true,
  badge: "New",
  cta: "Buy Lot Plan",
  type: "single",
  creditKind: "lot",
  features: [
    "Multi-card lot identification",
    "Raw NM market estimates",
    "PSA 8 / 9 / 10 graded comps when available",
    "Lot total + suggested list price",
    "Up to 6 lot photos per scan",
    "Saved lot reports in your account",
  ],
};

/** Multi-credit packs (excludes one-time reports). */
export const SCAN_PACKS: readonly ScanPack[] = [
  {
    id: "starter",
    name: "Starter Plan",
    credits: 10,
    price: 29.99,
    stripePriceId: null,
    description: "Ideal for collectors grading a shortlist of cards.",
    highlighted: false,
    cta: "Get Starter Plan",
    type: "pack",
    creditKind: "grade",
    features: [
      "10 professional AI grading reports",
      "PSA & Beckett predictions",
      "Centering, corners, edges, surface",
      "Credits never expire",
    ],
  },
  {
    id: "collector",
    name: "Collector Plan",
    credits: 25,
    price: 49.99,
    stripePriceId: null,
    description: "Best value for active collectors and small shops.",
    highlighted: true,
    badge: "Most Popular",
    cta: "Get Collector Plan",
    type: "pack",
    creditKind: "grade",
    features: [
      "25 professional AI grading reports",
      "Lowest cost per scan",
      "Full visual heatmaps & measurements",
      "PDF export ready",
      "Credits never expire",
    ],
  },
  {
    id: "dealer",
    name: "Dealer Plan",
    credits: 100,
    price: 199.99,
    stripePriceId: null,
    description: "Volume pricing for dealers and high-volume graders.",
    highlighted: false,
    cta: "Get Dealer Plan",
    type: "pack",
    creditKind: "grade",
    features: [
      "100 professional AI grading reports",
      "Best volume pricing",
      "Priority-ready for inventory",
      "Shared across your account",
      "Credits never expire",
    ],
  },
] as const;

/** All purchasable options — one-time reports first, then packs. */
export const ALL_PURCHASE_OPTIONS: readonly ScanPack[] = [
  LOT_PRICE_REPORT,
  PROFESSIONAL_REPORT,
  ...SCAN_PACKS,
];

export function getScanPack(id: string): ScanPack | undefined {
  return ALL_PURCHASE_OPTIONS.find((pack) => pack.id === id);
}

export function isLotPack(pack: ScanPack): boolean {
  return pack.creditKind === "lot";
}

export function costPerScan(pack: ScanPack): number {
  return pack.price / pack.credits;
}

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function isOneTimePurchase(pack: ScanPack): boolean {
  return pack.type === "single";
}
