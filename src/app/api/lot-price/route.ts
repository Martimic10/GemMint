import { NextResponse } from "next/server";
import {
  LOT_PRICING_SYSTEM_PROMPT,
  aiLotPayloadSchema,
  lotRequestSchema,
} from "@/lib/lot-schema";
import { buildLotReport, type LotCardPrice } from "@/lib/lot-report";
import {
  correctCardIdentity,
  lookupLiveMarketComps,
  preferLiveMarket,
  looksLikePlaceholderMarket,
} from "@/lib/market-prices";
import {
  extractJsonObject,
  getOpenRouterConfig,
  messageContentToText,
} from "@/lib/openrouter";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Cap live lookups — AI estimates cover the rest. */
const LIVE_ENRICH_LIMIT = 5;
const LIVE_ENRICH_CONCURRENCY = 3;

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, Math.max(1, items.length)) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

async function callOpenRouterLotVision(params: {
  system: string;
  userText: string;
  images: string[];
}): Promise<string> {
  const { apiKey, model } = getOpenRouterConfig();
  const lotModel =
    process.env.OPENROUTER_LOT_MODEL?.trim() || model;

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [{ type: "text", text: params.userText }];

  params.images.forEach((url, i) => {
    content.push({ type: "text", text: `Lot photo ${i + 1}:` });
    content.push({ type: "image_url", image_url: { url } });
  });

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_SITE_URL ?? "https://gemmint.ai",
      "X-Title": "GemMint AI Lot Pricer",
    },
    body: JSON.stringify({
      model: lotModel,
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: params.system },
        { role: "user", content },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `OpenRouter error ${response.status}: ${errText.slice(0, 400) || response.statusText}`
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: { content?: unknown };
      finish_reason?: string;
    }>;
  };
  const choice = data.choices?.[0];
  const text = messageContentToText(choice?.message?.content);
  if (!text) throw new Error("OpenRouter returned an empty lot response.");

  if (choice?.finish_reason === "length") {
    console.warn(
      "Lot pricing response was truncated (finish_reason=length). Attempting repair."
    );
  }

  return text;
}

function conditionMultiplier(
  condition: "NM" | "LP" | "MP" | "HP" | "Damaged"
): number {
  switch (condition) {
    case "NM":
      return 1;
    case "LP":
      return 0.72;
    case "MP":
      return 0.45;
    case "HP":
      return 0.25;
    case "Damaged":
      return 0.12;
    default:
      return 1;
  }
}

function cardEnrichScore(card: {
  confidence: number;
  rawEstimate: number;
  psa8Estimate?: number;
  psa9Estimate?: number;
  psa10Estimate?: number;
}): number {
  const value =
    card.rawEstimate +
    (card.psa8Estimate || 0) * 0.15 +
    (card.psa9Estimate || 0) * 0.1 +
    (card.psa10Estimate || 0) * 0.05;
  return value * (0.4 + card.confidence / 100);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = lotRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Upload 1–6 lot photos to continue." },
        { status: 400 }
      );
    }

    const { images } = parsed.data;

    const raw = await callOpenRouterLotVision({
      system: LOT_PRICING_SYSTEM_PROMPT,
      userText:
        "Identify distinct trading cards you can read. Return one compact JSON object only. Leave notes empty unless needed. Keep the cards array complete.",
      images,
    });

    let json: unknown;
    try {
      json = extractJsonObject(raw);
    } catch (parseError) {
      console.error(
        "Lot JSON parse failed. Preview:",
        raw.slice(0, 500),
        "…",
        raw.slice(-200)
      );
      throw parseError;
    }

    const payload = aiLotPayloadSchema.safeParse(json);
    if (!payload.success) {
      console.error("Lot schema mismatch:", payload.error.flatten());
      console.error("Lot payload preview:", JSON.stringify(json).slice(0, 800));
      return NextResponse.json(
        {
          error:
            "The AI returned an unexpected lot format. Try clearer, closer photos.",
          details: payload.error.flatten(),
        },
        { status: 502 }
      );
    }

    if (payload.data.cards.length === 0) {
      return NextResponse.json(
        {
          error:
            "No cards could be identified. Try closer photos with readable names and less glare.",
        },
        { status: 422 }
      );
    }

    // Live comps only for the highest-value identifiable cards (parallel, API-only).
    const rankedForLive = [...payload.data.cards]
      .filter((c) => c.confidence >= 50 && cardEnrichScore(c) >= 3)
      .sort((a, b) => cardEnrichScore(b) - cardEnrichScore(a))
      .slice(0, LIVE_ENRICH_LIMIT);

    const liveByKey = new Map<
      string,
      Awaited<ReturnType<typeof lookupLiveMarketComps>>
    >();

    await mapPool(rankedForLive, LIVE_ENRICH_CONCURRENCY, async (card) => {
      const identity = correctCardIdentity({
        name: card.name,
        set: card.set,
        year: card.year,
      });
      const key = `${identity.name}|${identity.set}|${identity.year}`;
      try {
        const live = await lookupLiveMarketComps(
          {
            name: identity.name,
            set: identity.set,
            year: identity.year,
            category: card.category,
          },
          { allowWeb: false, fast: true }
        );
        liveByKey.set(key, live);
      } catch (error) {
        console.warn("Lot card comps failed:", identity.name, error);
        liveByKey.set(key, null);
      }
      return null;
    });

    const enriched: LotCardPrice[] = payload.data.cards.map((card) => {
      const identity = correctCardIdentity({
        name: card.name,
        set: card.set,
        year: card.year,
      });
      const key = `${identity.name}|${identity.set}|${identity.year}`;
      const mult = conditionMultiplier(card.condition);
      let market = {
        raw: Math.round(card.rawEstimate * mult * 100) / 100,
        psa8: Math.round(card.psa8Estimate || 0),
        psa9: Math.round(card.psa9Estimate || 0),
        psa10: Math.round(card.psa10Estimate || 0),
      };
      let source: LotCardPrice["priceSource"] = "estimate";

      const live = liveByKey.get(key) ?? null;
      if (live) {
        const preferred = preferLiveMarket(market, live);
        if (
          preferred.source !== "estimate" &&
          !looksLikePlaceholderMarket(preferred.market)
        ) {
          market = {
            raw: Math.round(preferred.market.raw * mult * 100) / 100,
            psa8: preferred.market.psa8,
            psa9: preferred.market.psa9,
            psa10: preferred.market.psa10,
          };
          source = preferred.source;
        }
      }

      if (looksLikePlaceholderMarket(market)) {
        market = { raw: Math.max(0, market.raw), psa8: 0, psa9: 0, psa10: 0 };
      }

      return {
        name: identity.name,
        set: identity.set,
        year: identity.year,
        category: card.category,
        condition: card.condition,
        confidence: Math.round(card.confidence),
        notes: card.notes || "",
        raw: Math.max(0, market.raw),
        psa8: Math.max(0, market.psa8),
        psa9: Math.max(0, market.psa9),
        psa10: Math.max(0, market.psa10),
        priceSource: source,
      };
    });

    const report = buildLotReport({
      title: payload.data.title,
      summary: payload.data.summary,
      tips: payload.data.tips,
      unclearCount: payload.data.unclearCount,
      cards: enriched,
      // Don't echo multi-MB data URLs back — they break the client/Firestore path.
      imageUrls: [],
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Lot price API error:", error);
    const message =
      error instanceof Error ? error.message : "Lot pricing failed unexpectedly.";
    const friendly =
      message.includes("valid JSON")
        ? "The AI response was incomplete. Please try again — large lots sometimes need a second pass."
        : message;
    const status = message.includes("OPENROUTER_API_KEY") ? 500 : 502;
    return NextResponse.json({ error: friendly }, { status });
  }
}
