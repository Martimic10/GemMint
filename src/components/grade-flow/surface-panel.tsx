"use client";

import { resolveCardFrame } from "@/lib/cards";
import type { RichGradeReport } from "@/lib/grade-flow-data";
import { UploadThumb } from "@/components/grade-flow/upload-zone";
import { cn } from "@/lib/utils";

interface SurfacePanelProps {
  report: RichGradeReport;
  cardSrc: string;
}

export function SurfacePanel({ report, cardSrc }: SurfacePanelProps) {
  const { grade, defects } = report;
  const asset = resolveCardFrame(grade.cardId);
  const { viewBox, photo } = asset;

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
          <div
            className="pointer-events-none absolute overflow-hidden rounded-sm opacity-50 mix-blend-multiply"
            style={{
              left: `${(photo.x / viewBox.w) * 100}%`,
              top: `${(photo.y / viewBox.h) * 100}%`,
              width: `${(photo.w / viewBox.w) * 100}%`,
              height: `${(photo.h / viewBox.h) * 100}%`,
              backgroundImage:
                "radial-gradient(circle at 30% 40%, rgba(239,68,68,0.45), transparent 26%), radial-gradient(circle at 70% 75%, rgba(245,158,11,0.4), transparent 22%)",
            }}
          />
          {defects.map((d) => (
            <span
              key={d.id}
              className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 ring-2 ring-white"
              style={{ left: `${d.x}%`, top: `${d.y}%` }}
              title={d.type}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-xs font-semibold text-muted uppercase">
            Surface score
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
            {grade.surface.score}
          </p>
          <p className="mt-1 text-sm text-muted">{grade.surface.notes}</p>
        </div>

        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          Detected issues
        </p>
        {defects.map((d) => (
          <div
            key={d.id}
            className="rounded-2xl border border-border bg-surface px-4 py-3.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{d.type}</p>
              <SeverityBadge severity={d.severity} />
            </div>
            <p className="mt-1 text-xs text-muted">{d.location}</p>
            <p className="mt-2 text-sm text-foreground">
              <span className="font-medium">Impact: </span>
              {d.impact}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeverityBadge({
  severity,
}: {
  severity: "low" | "medium" | "high";
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
        severity === "low" && "bg-emerald/10 text-emerald",
        severity === "medium" && "bg-amber-50 text-amber-800",
        severity === "high" && "bg-red-50 text-red-600"
      )}
    >
      {severity}
    </span>
  );
}
