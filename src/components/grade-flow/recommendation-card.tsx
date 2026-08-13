"use client";

import type { Recommendation } from "@/lib/dashboard-data";
import { recommendationCopy } from "@/lib/grade-flow-data";
import { cn } from "@/lib/utils";

interface RecommendationCardProps {
  recommendation: Recommendation;
  reasoning: string;
}

export function RecommendationCard({
  recommendation,
  reasoning,
}: RecommendationCardProps) {
  const rec = recommendationCopy(recommendation);

  return (
    <div
      className={cn(
        "rounded-2xl border px-5 py-4",
        rec.tone === "emerald" && "border-emerald/25 bg-emerald/5",
        rec.tone === "amber" && "border-amber-200 bg-amber-50/80",
        rec.tone === "red" && "border-red-200 bg-red-50/70"
      )}
    >
      <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
        Final recommendation
      </p>
      <p
        className={cn(
          "mt-1 text-xl font-bold",
          rec.tone === "emerald" && "text-emerald",
          rec.tone === "amber" && "text-amber-800",
          rec.tone === "red" && "text-red-600"
        )}
      >
        {rec.title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{reasoning}</p>
    </div>
  );
}
