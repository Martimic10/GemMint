"use client";

import { resolveCardFrame } from "@/lib/cards";
import type { RichGradeReport } from "@/lib/grade-flow-data";
import { UploadThumb } from "@/components/grade-flow/upload-zone";
import { cn } from "@/lib/utils";

interface CenteringPanelProps {
  report: RichGradeReport;
  cardSrc: string;
}

export function CenteringPanel({ report, cardSrc }: CenteringPanelProps) {
  const { grade, centeringDetail } = report;
  const asset = resolveCardFrame(grade.cardId);
  const { viewBox, photo } = asset;
  const left = `${(photo.x / viewBox.w) * 100}%`;
  const top = `${(photo.y / viewBox.h) * 100}%`;
  const width = `${(photo.w / viewBox.w) * 100}%`;
  const height = `${(photo.h / viewBox.h) * 100}%`;
  const pass = grade.centering.pass;

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
            className="pointer-events-none absolute rounded-md border-2 border-dashed border-royal/80"
            style={{ left, top, width, height }}
          >
            <span className="absolute top-1 left-1 rounded bg-royal px-1.5 py-0.5 text-[9px] font-bold text-white">
              L/R
            </span>
            <span className="absolute right-1 bottom-1 rounded bg-emerald px-1.5 py-0.5 text-[9px] font-bold text-white">
              T/B
            </span>
          </div>
        </div>
      </div>

      <div>
        <div
          className={cn(
            "inline-flex rounded-full px-3 py-1 text-xs font-bold",
            pass
              ? "bg-emerald/10 text-emerald"
              : "bg-amber-50 text-amber-800"
          )}
        >
          {pass ? "Pass — lab standards met" : "Attention — borderline centering"}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ["Left", centeringDetail.left],
              ["Right", centeringDetail.right],
              ["Top", centeringDetail.top],
              ["Bottom", centeringDetail.bottom],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-border bg-card px-3 py-3 text-center"
            >
              <p className="text-[11px] font-semibold text-muted uppercase">
                {label}
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                {value}%
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm font-semibold text-foreground">
            Measured ratios
          </p>
          <p className="mt-1 text-sm text-muted">
            Left/Right {grade.centering.lr} · Top/Bottom {grade.centering.tb}
          </p>
          <div className="mt-4 space-y-3">
            <RatioBar
              label="Horizontal"
              a={centeringDetail.left}
              b={centeringDetail.right}
              aColor="bg-royal"
              bColor="bg-royal/40"
            />
            <RatioBar
              label="Vertical"
              a={centeringDetail.top}
              b={centeringDetail.bottom}
              aColor="bg-emerald"
              bColor="bg-emerald/40"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function RatioBar({
  label,
  a,
  b,
  aColor,
  bColor,
}: {
  label: string;
  a: number;
  b: number;
  aColor: string;
  bColor: string;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-muted">{label}</p>
      <div className="flex h-3 overflow-hidden rounded-full">
        <div className={aColor} style={{ width: `${a}%` }} />
        <div className={bColor} style={{ width: `${b}%` }} />
      </div>
    </div>
  );
}
