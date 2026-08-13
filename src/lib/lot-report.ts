import type { AiLotCard } from "@/lib/lot-schema";

export interface LotCardPrice {
  name: string;
  set: string;
  year: string;
  category: string;
  condition: AiLotCard["condition"];
  confidence: number;
  notes: string;
  /** Final raw estimate used for lot totals. */
  raw: number;
  psa8: number;
  psa9: number;
  psa10: number;
  /** Where the ladder came from. */
  priceSource: "pricecharting" | "web" | "estimate";
}

export interface LotPriceReport {
  id: string;
  title: string;
  summary: string;
  date: string;
  imageUrls: string[];
  cards: LotCardPrice[];
  unclearCount: number;
  tips: string;
  /** Sum of raw estimates. */
  rawTotal: number;
  /** Sum of PSA 8 estimates (0s ignored in average but included as 0 in sum). */
  psa8Total: number;
  psa9Total: number;
  psa10Total: number;
  /**
   * Suggested asking price for selling as a lot
   * (bulk discount vs summing singles).
   */
  suggestedListPrice: number;
  cardCount: number;
  creditUsed: number;
}

/** Typical bulk-lot ask vs summing individual raw comps. */
export const LOT_BULK_DISCOUNT = 0.82;

export function buildLotReport(
  input: {
    title: string;
    summary: string;
    tips: string;
    unclearCount: number;
    cards: LotCardPrice[];
    imageUrls: string[];
  }
): LotPriceReport {
  const id = `lot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const date = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const rawTotal = Math.round(
    input.cards.reduce((sum, c) => sum + Math.max(0, c.raw), 0)
  );
  const psa8Total = Math.round(
    input.cards.reduce((sum, c) => sum + Math.max(0, c.psa8), 0)
  );
  const psa9Total = Math.round(
    input.cards.reduce((sum, c) => sum + Math.max(0, c.psa9), 0)
  );
  const psa10Total = Math.round(
    input.cards.reduce((sum, c) => sum + Math.max(0, c.psa10), 0)
  );

  const suggestedListPrice = Math.max(
    1,
    Math.round(rawTotal * LOT_BULK_DISCOUNT)
  );

  return {
    id,
    title: input.title || "Card lot",
    summary: input.summary,
    date,
    imageUrls: input.imageUrls,
    cards: input.cards,
    unclearCount: input.unclearCount,
    tips: input.tips,
    rawTotal,
    psa8Total,
    psa9Total,
    psa10Total,
    suggestedListPrice,
    cardCount: input.cards.length,
    creditUsed: 1,
  };
}
