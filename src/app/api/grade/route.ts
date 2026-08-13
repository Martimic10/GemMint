import { NextResponse } from "next/server";
import {
  GRADING_SYSTEM_PROMPT,
  aiGradePayloadSchema,
  gradeRequestSchema,
} from "@/lib/grade-schema";
import { reconcileGradePrediction } from "@/lib/grade-reconcile";
import {
  correctCardIdentity,
  lookupLiveMarketComps,
} from "@/lib/market-prices";
import {
  buildRichReport,
  callOpenRouterVision,
  extractJsonObject,
} from "@/lib/openrouter";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = gradeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Front and back images are required." },
        { status: 400 }
      );
    }

    const { frontImage, backImage } = parsed.data;

    const raw = await callOpenRouterVision({
      system: GRADING_SYSTEM_PROMPT,
      userText:
        "Grade THIS card from the front and back photos. Score corners, edges, surface, and centering from what you see, then set psa to match the weakest category — do not default to PSA 8. Identify exact name, set, year, and card number carefully for market comps.",
      frontImage,
      backImage,
    });

    const json = extractJsonObject(raw);
    const payload = aiGradePayloadSchema.safeParse(json);
    if (!payload.success) {
      console.error("Grade schema mismatch:", payload.error.flatten());
      return NextResponse.json(
        {
          error:
            "The AI returned an unexpected grade format. Please try again with clearer photos.",
          details: payload.error.flatten(),
        },
        { status: 502 }
      );
    }

    const reconciled = reconcileGradePrediction(payload.data);

    const identity = correctCardIdentity({
      name: reconciled.name,
      set: reconciled.set,
      year: reconciled.year,
    });

    // Live comps: PriceCharting when configured, else OpenRouter web-search comps.
    const liveComps = await lookupLiveMarketComps({
      name: identity.name,
      set: identity.set,
      year: identity.year,
      category: reconciled.category,
      psa: reconciled.psa,
    });

    const report = buildRichReport(
      { ...reconciled, ...identity },
      frontImage,
      liveComps
    );
    return NextResponse.json({ report });
  } catch (error) {
    console.error("Grade API error:", error);
    const message =
      error instanceof Error ? error.message : "Grading failed unexpectedly.";
    const status = message.includes("OPENROUTER_API_KEY") ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
