"use client";

import { resolveCardFrame } from "@/lib/cards";
import type { RichGradeReport } from "@/lib/grade-flow-data";
import { UploadThumb } from "@/components/grade-flow/upload-zone";

interface EdgePanelProps {
  report: RichGradeReport;
  cardSrc: string;
}

export function EdgePanel({ report, cardSrc }: EdgePanelProps) {
  const { grade, edges } = report;
  const asset = resolveCardFrame(grade.cardId);
  const entries = [
    { key: "top" as const, label: "Top", data: edges.top },
    { key: "right" as const, label: "Right", data: edges.right },
    { key: "bottom" as const, label: "Bottom", data: edges.bottom },
    { key: "left" as const, label: "Left", data: edges.left },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <div className="relative mx-auto w-full max-w-[220px] overflow-hidden rounded-2xl border border-border bg-surface-muted p-2">
        <div
          className="relative w-full overflow-hidden rounded-xl"
          style={{ aspectRatio: asset.aspect.replace("/", " / ") }}
        >
          <UploadThumb
            src={cardSrc}
            alt={grade.name}
            className="absolute inset-0"
          />
          <div className="pointer-events-none absolute inset-3 rounded-md border-[3px] border-royal/60" />
          <div className="pointer-events-none absolute top-3 left-3 h-1/2 w-[3px] bg-amber-400/80" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-xs font-semibold text-muted uppercase">
            Overall edge score
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
            {grade.edges.score}
          </p>
          <p className="mt-1 text-sm text-muted">{grade.edges.notes}</p>
        </div>

        {entries.map(({ key, label, data }) => (
          <div
            key={key}
            className="rounded-2xl border border-border bg-surface px-4 py-3.5"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">{label} edge</p>
              <p className="text-sm font-bold tabular-nums text-amber-700">
                {data.whitening}% whitening
              </p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${Math.min(100, data.whitening * 4)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">{data.notes}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
