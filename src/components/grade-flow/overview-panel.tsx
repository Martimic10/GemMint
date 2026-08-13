"use client";

import { resolveCardFrame } from "@/lib/cards";
import type { RichGradeReport } from "@/lib/grade-flow-data";
import { ConfidenceMeter } from "@/components/grade-flow/grade-summary";
import { UploadThumb } from "@/components/grade-flow/upload-zone";
import { RecommendationCard } from "@/components/grade-flow/recommendation-card";

interface OverviewPanelProps {
  report: RichGradeReport;
  cardSrc: string;
}

export function OverviewPanel({ report, cardSrc }: OverviewPanelProps) {
  const { grade, explanation } = report;
  const asset = resolveCardFrame(grade.cardId);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <div className="mx-auto w-full max-w-[200px]">
        <div
          className="relative overflow-hidden rounded-2xl border border-border bg-surface-muted shadow-sm"
          style={{ aspectRatio: asset.aspect.replace("/", " / ") }}
        >
          <UploadThumb
            src={cardSrc}
            alt={grade.name}
            className="absolute inset-0"
          />
        </div>
        <div className="mt-3 flex justify-center gap-2">
          <span className="rounded-lg bg-emerald/10 px-2.5 py-1 text-sm font-bold text-emerald">
            PSA {grade.psa}
          </span>
          <span className="rounded-lg bg-royal/10 px-2.5 py-1 text-sm font-bold text-royal">
            BGS {grade.beckett}
          </span>
        </div>
      </div>

      <div className="space-y-5">
        <ConfidenceMeter value={grade.confidence} />
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            AI Explanation
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {explanation}
          </p>
        </div>
        <RecommendationCard
          recommendation={grade.recommendation}
          reasoning={grade.insight}
        />
      </div>
    </div>
  );
}
