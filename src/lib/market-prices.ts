/**
 * Live market comps:
 * 1) PriceCharting / SportsCardsPro API (best when token is set)
 * 2) OpenRouter web search grounded comps (works without PriceCharting)
 *
 * PriceCharting card grade mapping (prices in pennies):
 *   loose-price        → ungraded / raw
 *   cib-price          → graded 7 / 7.5
 *   new-price          → graded 8 / 8.5
 *   graded-price       → graded 9
 *   box-only-price     → graded 9.5
 *   manual-only-price  → PSA 10
 *   bgs-10-price       → BGS 10
 */

import { z } from "zod";
import type { MarketLadder } from "@/lib/market-economics";

function getOpenRouterKeyAndModel(): { apiKey: string; model: string } {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY.");
  }
  return {
    apiKey,
    model: process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash",
  };
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Model response was not valid JSON.");
  }
}

const API_BASES = [
  process.env.PRICECHARTING_API_BASE?.replace(/\/$/, ""),
  "https://www.sportscardspro.com",
  "https://www.pricecharting.com",
].filter((v, i, a): v is string => Boolean(v) && a.indexOf(v) === i);

export type MarketPriceSource = "pricecharting" | "web" | "estimate";

export interface LiveMarketComps {
  source: MarketPriceSource;
  productId: string | null;
  productName: string | null;
  setName: string | null;
  market: MarketLadder;
  /** Optional extra tiers when available */
  psa7: number | null;
  psa95: number | null;
  bgs10: number | null;
  url: string | null;
}

const webMarketSchema = z.object({
  raw: z.number().min(0),
  psa8: z.number().min(0),
  psa9: z.number().min(0),
  psa10: z.number().min(0),
  productName: z.string().optional(),
  setName: z.string().optional(),
  notes: z.string().optional(),
});

function getToken(): string | null {
  const token =
    process.env.PRICECHARTING_API_TOKEN?.trim() ||
    process.env.SPORTSCARDSPRO_API_TOKEN?.trim() ||
    "";
  return token || null;
}

function penniesToUsd(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n) / 100;
}

function cleanQueryPart(s: string): string {
  return s
    .replace(/[^\w\s#.\-']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fix common vision misreads that wreck market lookups. */
export function correctCardIdentity(input: {
  name: string;
  set: string;
  year: string;
}): { name: string; set: string; year: string } {
  const name = input.name.trim();
  const set = input.set.trim();
  let year = input.year.trim();
  const key = `${name} ${set} ${year}`.toLowerCase();

  // Kobe's NBA rookies are 1996 — models often invent 1986 (Jordan era).
  if (
    key.includes("kobe") &&
    (year === "1986" ||
      year === "1987" ||
      year === "1988" ||
      year === "1989" ||
      year === "1990")
  ) {
    year = "1996";
  }

  return { name, set, year };
}

export function buildMarketSearchQueries(input: {
  name: string;
  set: string;
  year: string;
}): string[] {
  const fixed = correctCardIdentity(input);
  const name = cleanQueryPart(fixed.name);
  const set = cleanQueryPart(fixed.set);
  const year = cleanQueryPart(fixed.year);
  const queries = [
    [year, set, name].filter(Boolean).join(" "),
    [name, year, "PSA 8"].filter(Boolean).join(" "),
    [name, set, year].filter(Boolean).join(" "),
    [name, set].filter(Boolean).join(" "),
    [year, name].filter(Boolean).join(" "),
    name,
  ].filter((q) => q.length >= 3);

  return Array.from(new Set(queries));
}

function scoreProductMatch(
  query: string,
  productName: string,
  consoleName: string
): number {
  const q = query.toLowerCase();
  const hay = `${productName} ${consoleName}`.toLowerCase();
  const tokens = q.split(/\s+/).filter((t) => t.length > 1);
  if (tokens.length === 0) return 0;
  let hits = 0;
  for (const t of tokens) {
    if (hay.includes(t)) hits += 1;
  }
  // Penalize wrong-decade mismatches for famous names
  if (q.includes("kobe") && /198[0-9]/.test(hay) && !/1996/.test(hay)) {
    return hits / tokens.length * 0.2;
  }
  return hits / tokens.length;
}

type PriceChartingProduct = Record<string, unknown> & {
  status?: string;
  id?: string;
  "product-name"?: string;
  "console-name"?: string;
  products?: Array<Record<string, unknown>>;
};

async function fetchJson(url: string): Promise<PriceChartingProduct | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as PriceChartingProduct;
  } catch (error) {
    console.warn("PriceCharting fetch failed:", error);
    return null;
  }
}

function hasPriceFields(data: Record<string, unknown>): boolean {
  return (
    penniesToUsd(data["loose-price"]) !== null ||
    penniesToUsd(data["new-price"]) !== null ||
    penniesToUsd(data["graded-price"]) !== null ||
    penniesToUsd(data["manual-only-price"]) !== null
  );
}

function productToComps(
  data: Record<string, unknown>,
  source: MarketPriceSource = "pricecharting"
): LiveMarketComps | null {
  if (!hasPriceFields(data)) return null;

  const raw = penniesToUsd(data["loose-price"]) ?? 0;
  const psa7 = penniesToUsd(data["cib-price"]);
  const psa8 = penniesToUsd(data["new-price"]) ?? 0;
  const psa9 = penniesToUsd(data["graded-price"]) ?? 0;
  const psa95 = penniesToUsd(data["box-only-price"]);
  const psa10 = penniesToUsd(data["manual-only-price"]) ?? 0;
  const bgs10 = penniesToUsd(data["bgs-10-price"]);

  const id = data.id ? String(data.id) : null;
  const productName = data["product-name"]
    ? String(data["product-name"])
    : null;
  const setName = data["console-name"] ? String(data["console-name"]) : null;

  const url =
    id && productName && setName
      ? `https://www.sportscardspro.com/game/${slugify(setName)}/${slugify(productName)}`
      : id
        ? `https://www.sportscardspro.com/app/product/${id}`
        : null;

  return {
    source,
    productId: id,
    productName,
    setName,
    market: {
      raw: Math.round(raw),
      psa8: Math.round(psa8),
      psa9: Math.round(psa9),
      psa10: Math.round(psa10),
    },
    psa7: psa7 !== null ? Math.round(psa7) : null,
    psa95: psa95 !== null ? Math.round(psa95) : null,
    bgs10: bgs10 !== null ? Math.round(bgs10) : null,
    url,
  };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchProductById(
  token: string,
  id: string,
  base: string
): Promise<LiveMarketComps | null> {
  const url = `${base}/api/product?t=${encodeURIComponent(token)}&id=${encodeURIComponent(id)}`;
  const data = await fetchJson(url);
  if (!data || data.status === "error") return null;
  return productToComps(data);
}

async function searchProducts(
  token: string,
  query: string,
  base: string
): Promise<Array<{ id: string; productName: string; consoleName: string }>> {
  const url = `${base}/api/products?t=${encodeURIComponent(token)}&q=${encodeURIComponent(query)}`;
  const data = await fetchJson(url);
  if (!data || data.status === "error") {
    const singleUrl = `${base}/api/product?t=${encodeURIComponent(token)}&q=${encodeURIComponent(query)}`;
    const single = await fetchJson(singleUrl);
    if (!single || single.status === "error" || !single.id) return [];
    return [
      {
        id: String(single.id),
        productName: String(single["product-name"] ?? ""),
        consoleName: String(single["console-name"] ?? ""),
      },
    ];
  }

  const list = Array.isArray(data.products) ? data.products : [];
  return list
    .map((p) => ({
      id: String(p.id ?? ""),
      productName: String(p["product-name"] ?? ""),
      consoleName: String(p["console-name"] ?? ""),
    }))
    .filter((p) => p.id);
}

async function lookupPriceChartingComps(
  input: {
    name: string;
    set: string;
    year: string;
  },
  options?: { fast?: boolean }
): Promise<LiveMarketComps | null> {
  const token = getToken();
  if (!token) return null;

  const fast = options?.fast === true;
  const queries = buildMarketSearchQueries(input);
  const queryLimit = fast ? 1 : 3;
  const bases = fast ? API_BASES.slice(0, 1) : API_BASES;
  let best: {
    id: string;
    score: number;
    productName: string;
    consoleName: string;
    base: string;
  } | null = null;

  for (const base of bases) {
    for (const query of queries.slice(0, queryLimit)) {
      const matches = await searchProducts(token, query, base);
      for (const m of matches) {
        const score = scoreProductMatch(query, m.productName, m.consoleName);
        if (!best || score > best.score) {
          best = {
            id: m.id,
            score,
            productName: m.productName,
            consoleName: m.consoleName,
            base,
          };
        }
      }
      if (best && best.score >= 0.75) break;
    }
    if (best && best.score >= 0.75) break;
  }

  if (!best || best.score < 0.4) return null;

  // Single-card grading spaces requests; lot enrichment runs many in parallel.
  if (!fast) {
    await new Promise((r) => setTimeout(r, 1100));
  }
  const comps = await fetchProductById(token, best.id, best.base);
  if (!comps) {
    console.warn(
      "PriceCharting match found but no price fields returned. Check subscription/token."
    );
    return null;
  }
  return comps;
}

/** True when the model clearly phoned in $100 across the board. */
export function looksLikePlaceholderMarket(market: MarketLadder): boolean {
  const vals = [market.raw, market.psa8, market.psa9, market.psa10].filter(
    (v) => v > 0
  );
  if (vals.length === 0) return true;
  const allHundred = vals.every((v) => v === 100);
  const allSame = vals.every((v) => v === vals[0]);
  const flatLadder =
    market.psa8 > 0 &&
    market.psa9 > 0 &&
    Math.abs(market.psa8 - market.psa9) < 5 &&
    Math.abs(market.psa9 - market.psa10) < 20;
  return allHundred || (allSame && vals[0] <= 150) || flatLadder;
}

/**
 * Web-grounded comps via OpenRouter (eBay sold / PriceCharting / auction houses).
 * Used when PriceCharting API token is missing or returns no prices.
 */
export async function lookupWebMarketComps(input: {
  name: string;
  set: string;
  year: string;
  category?: string;
  psa?: number;
}): Promise<LiveMarketComps | null> {
  const fixed = correctCardIdentity(input);
  const { apiKey, model } = getOpenRouterKeyAndModel();

  const cardLabel = `${fixed.year} ${fixed.set} ${fixed.name}`.replace(
    /\s+/g,
    " "
  ).trim();

  const system = `You are a trading-card market analyst. Use web search to find CURRENT US secondary-market sold comps (eBay sold, PriceCharting, SportsCardsPro, PWCC, Goldin, PSA auction).

Return ONLY valid JSON:
{
  "raw": number USD ungraded near-mint sold comps,
  "psa8": number USD PSA 8 sold comps,
  "psa9": number USD PSA 9 sold comps,
  "psa10": number USD PSA 10 sold comps,
  "productName": "exact card name",
  "setName": "set name",
  "notes": "1 sentence citing the comps you used"
}

Rules:
- Prefer recent sold prices over asking prices.
- raw < psa8 < psa9 < psa10 for desirable cards.
- NEVER invent flat placeholder values like raw=100, psa8=100, psa9=100.
- If this is 1996 Kobe Bryant Topps / Chrome / Fleer Metal, PSA 8 base rookies commonly trade above $100–$150+ — do not underprice below realistic sold comps.
- If comps vary, use a midpoint of recent sales.
- Output JSON only.`;

  const user = `Find current market values for: ${cardLabel}${
    input.category ? ` (${input.category})` : ""
  }. Predicted grade context: PSA ${input.psa ?? 8}. Search for "${cardLabel} PSA 8 sold" and PriceCharting / SportsCardsPro listings.`;

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_SITE_URL ?? "https://gemmint.ai",
          "X-Title": "GemMint AI Market",
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          response_format: { type: "json_object" },
          // Prefer server tool; also keep plugin for models that still use it.
          tools: [
            {
              type: "openrouter:web_search",
              parameters: {
                max_results: 6,
                search_context_size: "medium",
              },
            },
          ],
          plugins: [{ id: "web", max_results: 6 }],
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.warn(
        "Web market lookup failed:",
        response.status,
        errText.slice(0, 300)
      );
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = webMarketSchema.safeParse(extractJsonObject(content));
    if (!parsed.success) return null;

    const market: MarketLadder = {
      raw: Math.round(parsed.data.raw),
      psa8: Math.round(parsed.data.psa8),
      psa9: Math.round(parsed.data.psa9),
      psa10: Math.round(parsed.data.psa10),
    };

    if (looksLikePlaceholderMarket(market)) {
      console.warn("Web market comps looked like placeholders — discarding.");
      return null;
    }

    return {
      source: "web",
      productId: null,
      productName: parsed.data.productName ?? cardLabel,
      setName: parsed.data.setName ?? fixed.set,
      market,
      psa7: null,
      psa95: null,
      bgs10: null,
      url: null,
    };
  } catch (error) {
    console.warn("Web market lookup error:", error);
    return null;
  }
}

export type LiveMarketLookupOptions = {
  /** When false, skip slow OpenRouter web-search comps (lot pricing). Default true. */
  allowWeb?: boolean;
  /** Fewer PriceCharting queries + no rate-limit sleep (lot batch). */
  fast?: boolean;
};

/**
 * Resolve live market comps for an identified card.
 * PriceCharting first (if token), then web-grounded OpenRouter comps.
 */
export async function lookupLiveMarketComps(
  input: {
    name: string;
    set: string;
    year: string;
    category?: string;
    psa?: number;
  },
  options?: LiveMarketLookupOptions
): Promise<LiveMarketComps | null> {
  const fixed = correctCardIdentity(input);
  const allowWeb = options?.allowWeb !== false;
  const fast = options?.fast === true;

  const fromApi = await lookupPriceChartingComps(fixed, { fast });
  if (fromApi) return fromApi;

  if (!allowWeb) return null;

  if (!getToken()) {
    console.warn(
      "PRICECHARTING_API_TOKEN not set — using web-grounded market comps."
    );
  }

  return lookupWebMarketComps({
    ...fixed,
    category: input.category,
    psa: input.psa,
  });
}

/** Merge live comps over AI estimates (live wins when present). */
export function preferLiveMarket(
  aiMarket: MarketLadder,
  live: LiveMarketComps | null
): {
  market: MarketLadder;
  source: MarketPriceSource;
  live: LiveMarketComps | null;
} {
  if (!live) {
    return { market: aiMarket, source: "estimate", live: null };
  }

  return {
    market: {
      raw: live.market.raw > 0 ? live.market.raw : aiMarket.raw,
      psa8: live.market.psa8 > 0 ? live.market.psa8 : aiMarket.psa8,
      psa9: live.market.psa9 > 0 ? live.market.psa9 : aiMarket.psa9,
      psa10: live.market.psa10 > 0 ? live.market.psa10 : aiMarket.psa10,
    },
    source: live.source,
    live,
  };
}
