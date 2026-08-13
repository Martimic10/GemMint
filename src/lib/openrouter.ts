import type { AiGradePayload } from "@/lib/grade-schema";
import type { DashboardGrade } from "@/lib/dashboard-data";
import type { RichGradeReport } from "@/lib/grade-flow-data";
import { normalizeMarketEconomics } from "@/lib/market-economics";
import type { LiveMarketComps } from "@/lib/market-prices";
import {
  correctCardIdentity,
  looksLikePlaceholderMarket,
  preferLiveMarket,
} from "@/lib/market-prices";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export function getOpenRouterConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model =
    process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";

  if (!apiKey) {
    throw new Error(
      "Missing OPENROUTER_API_KEY. Add it to .env.local and restart the dev server."
    );
  }

  return { apiKey, model };
}

export async function callOpenRouterVision(params: {
  system: string;
  userText: string;
  frontImage: string;
  backImage: string;
}): Promise<string> {
  const { apiKey, model } = getOpenRouterConfig();

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_SITE_URL ?? "https://gemmint.ai",
      "X-Title": "GemMint AI",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: params.system },
        {
          role: "user",
          content: [
            { type: "text", text: params.userText },
            {
              type: "text",
              text: "FRONT of card:",
            },
            {
              type: "image_url",
              image_url: { url: params.frontImage },
            },
            {
              type: "text",
              text: "BACK of card:",
            },
            {
              type: "image_url",
              image_url: { url: params.backImage },
            },
          ],
        },
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
    choices?: Array<{ message?: { content?: unknown } }>;
  };

  const content = messageContentToText(data.choices?.[0]?.message?.content);
  if (!content) {
    throw new Error("OpenRouter returned an empty response.");
  }

  return content;
}

export function extractJsonObject(text: string): unknown {
  const cleaned = stripToJsonCandidate(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    // Attempt light repair for truncated / trailing-comma JSON from long lot lists.
    const repaired = repairJsonCandidate(cleaned);
    try {
      return JSON.parse(repaired);
    } catch {
      throw new Error("Model response was not valid JSON.");
    }
  }
}

/** Normalize model text that may include markdown fences or chatter. */
function stripToJsonCandidate(text: string): string {
  let t = text.trim();
  // ```json ... ``` or ``` ... ```
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    t = fence[1].trim();
  } else {
    // Truncated response may open a fence without closing it.
    const openFence = t.match(/```(?:json)?\s*([\s\S]*)$/i);
    if (openFence?.[1]) t = openFence[1].trim();
  }

  const start = t.indexOf("{");
  if (start < 0) return t.trim();

  t = t.slice(start);
  const end = t.lastIndexOf("}");
  if (end > 0) {
    const candidate = t.slice(0, end + 1);
    const opens = (candidate.match(/[\[{]/g) || []).length;
    const closes = (candidate.match(/[\]}]/g) || []).length;
    // Only cut at last } when balanced; otherwise keep the rest for repair.
    if (opens === closes) return candidate.trim();
  }
  return t.trim();
}

function repairJsonCandidate(text: string): string {
  let t = text
    // Remove trailing commas before } or ]
    .replace(/,\s*([}\]])/g, "$1")
    // Common model slip: smart quotes
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");

  // If truncated mid-array/object, close open brackets.
  const opens = (t.match(/[\[{]/g) || []).length;
  const closes = (t.match(/[\]}]/g) || []).length;
  if (opens > closes) {
    // Drop dangling incomplete tokens at the end.
    t = t.replace(/,\s*\{[\s\S]*$/g, "");
    t = t.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"{[\],}]*$/g, "");
    t = t.replace(/:\s*"[^"]*$/g, ': ""');
    t = t.replace(/,\s*$/g, "");
    const stack: string[] = [];
    let inString = false;
    let escaped = false;
    for (const ch of t) {
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') inString = true;
      else if (ch === "{" || ch === "[") stack.push(ch);
      else if (ch === "}" || ch === "]") stack.pop();
    }
    while (stack.length) {
      const open = stack.pop();
      t += open === "{" ? "}" : "]";
    }
  }
  return t;
}

/** OpenRouter / Gemini sometimes return content as a string OR an array of parts. */
export function messageContentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object") {
          const p = part as { text?: string; content?: string };
          return p.text ?? p.content ?? "";
        }
        return "";
      })
      .join("\n")
      .trim();
  }
  if (content && typeof content === "object") {
    const p = content as { text?: string };
    if (typeof p.text === "string") return p.text;
  }
  return "";
}

export function buildRichReport(
  payload: AiGradePayload,
  imageUrl: string,
  liveComps?: LiveMarketComps | null
): RichGradeReport {
  const id = `gr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const date = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const identity = correctCardIdentity({
    name: payload.name,
    set: payload.set,
    year: payload.year,
  });

  let aiMarket = payload.market;
  let aiEstimate = payload.estimatedValue;
  if (looksLikePlaceholderMarket(aiMarket)) {
    aiMarket = { raw: 0, psa8: 0, psa9: 0, psa10: 0 };
    aiEstimate = 0;
  }

  const preferred = preferLiveMarket(aiMarket, liveComps ?? null);

  const economics = normalizeMarketEconomics({
    name: identity.name,
    set: identity.set,
    year: identity.year,
    psa: payload.psa,
    estimatedValue: aiEstimate,
    market: preferred.market,
    submissionCost: payload.submissionCost,
    // PriceCharting + web-search comps are treated as live (skip soft floors inflate).
    liveMarket:
      preferred.source === "pricecharting" || preferred.source === "web",
    psa7: liveComps?.psa7,
    psa95: liveComps?.psa95,
  });

  const grade: DashboardGrade = {
    id,
    name: identity.name,
    set: identity.set,
    year: identity.year,
    category: payload.category,
    cardId: null,
    imageUrl,
    psa: Math.round(payload.psa),
    beckett: payload.beckett,
    confidence: Math.round(payload.confidence),
    worthGrading: payload.worthGrading,
    estimatedValue: economics.estimatedValue,
    date,
    status: "complete",
    creditUsed: 1,
    centering: payload.centering,
    corners: payload.corners,
    edges: {
      score: payload.edges.score,
      notes: payload.edges.notes,
    },
    surface: payload.surface,
    market: economics.market,
    recommendation: payload.recommendation,
    insight: payload.insight,
  };

  return {
    grade,
    explanation: payload.explanation,
    centeringDetail: payload.centeringDetail,
    corners: payload.cornerDetails,
    edges: {
      top: payload.edges.top,
      right: payload.edges.right,
      bottom: payload.edges.bottom,
      left: payload.edges.left,
    },
    defects: payload.defects,
    submissionCost: economics.submissionCost,
    potentialProfit: economics.potentialProfit,
    roiLabel: economics.roiLabel,
    marketSource: preferred.source,
    marketProductName: liveComps?.productName ?? null,
    marketUrl: liveComps?.url ?? null,
  };
}
