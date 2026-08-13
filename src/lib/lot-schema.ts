import { z } from "zod";

const num = z.coerce.number();

export const lotCardSchema = z.object({
  name: z.string().default("Unknown card"),
  set: z.string().default("Unknown"),
  year: z.coerce.string().default(""),
  category: z.string().default("Sports"),
  /** Visible condition guess for raw pricing. */
  condition: z
    .enum(["NM", "LP", "MP", "HP", "Damaged"])
    .catch("NM")
    .default("NM"),
  /** 0–100 identification confidence. */
  confidence: num.min(0).max(100).catch(50),
  /** AI raw estimate before live comps. */
  rawEstimate: num.min(0).catch(0),
  psa8Estimate: num.min(0).optional().catch(0).default(0),
  psa9Estimate: num.min(0).optional().catch(0).default(0),
  psa10Estimate: num.min(0).optional().catch(0).default(0),
  notes: z.string().optional().catch("").default(""),
});

export const aiLotPayloadSchema = z.object({
  title: z.string().optional().catch("Card lot").default("Card lot"),
  summary: z.string().catch("Identified cards from your lot photos."),
  cards: z.array(lotCardSchema).max(60).catch([]),
  unclearCount: num.min(0).optional().catch(0).default(0),
  tips: z.string().optional().catch("").default(""),
});

export type AiLotPayload = z.infer<typeof aiLotPayloadSchema>;
export type AiLotCard = z.infer<typeof lotCardSchema>;

export const lotRequestSchema = z.object({
  images: z.array(z.string().min(32)).min(1).max(6),
});

export const LOT_PRICING_SYSTEM_PROMPT = `You are GemMint Lot Pricer, a trading-card lot analyst for sellers.

You receive 1–6 photos of a CARD LOT (table spread, binder page, stack fanned out, etc.). Identify every distinct card you can reasonably read.

Return ONLY a single valid JSON object (no markdown, no code fences, no commentary):
{
  "title": "short lot title",
  "summary": "1-2 sentences about the lot composition",
  "cards": [
    {
      "name": "player or card name",
      "set": "set / product",
      "year": "year as string",
      "category": "Sports | Pokémon | Magic | Yu-Gi-Oh | One Piece | Disney Lorcana | Other",
      "condition": "NM",
      "confidence": 80,
      "rawEstimate": 5,
      "psa8Estimate": 0,
      "psa9Estimate": 0,
      "psa10Estimate": 0,
      "notes": ""
    }
  ],
  "unclearCount": 0,
  "tips": "one short tip to improve the next photo set"
}

Rules:
- Prefer distinct cards; do not duplicate the same card unless clearly multiple copies.
- Cap at the cards you can actually identify — never invent filler cards. Max 30 cards.
- Leave notes empty unless a card is ambiguous — keep the JSON short and complete.
- Prices are US secondary-market sold comps (eBay sold / PriceCharting style), not asking prices.
- rawEstimate is for the stated condition (scale NM down for LP/MP/HP).
- Include graded estimates when the card is a known collectible; otherwise 0.
- For bulk commons/junk wax, rawEstimate may be 0.1–2 — be honest.
- NEVER invent flat 100 for every card.
- Numbers must be JSON numbers (not strings).
- Output the JSON object only — nothing before or after it.`;
