"use client";

import { useState } from "react";
import { resolveCardFrame } from "@/lib/cards";
import type { CornerDetail, RichGradeReport } from "@/lib/grade-flow-data";
import { UploadThumb } from "@/components/grade-flow/upload-zone";
import { cn } from "@/lib/utils";

interface CornerPanelProps {
  report: RichGradeReport;
  cardSrc: string;
}

export function CornerPanel({ report, cardSrc }: CornerPanelProps) {
  const { grade, corners } = report;
  const [active, setActive] = useState<CornerDetail["id"]>("tl");
  const selected = corners.find((c) => c.id === active) ?? corners[0];
  const asset = resolveCardFrame(grade.cardId);

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
          {corners.map((c) => {
            const pos =
              c.id === "tl"
                ? "top-2 left-2"
                : c.id === "tr"
                  ? "top-2 right-2"
                  : c.id === "bl"
                    ? "bottom-2 left-2"
                    : "bottom-2 right-2";
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(c.id)}
                className={cn(
                  "absolute h-9 w-9 rounded-lg border-2 transition-all",
                  pos,
                  active === c.id
                    ? "border-emerald bg-emerald/30 shadow-sm"
                    : "border-white/80 bg-surface/30 hover:bg-surface/50"
                )}
                aria-label={c.label}
              />
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap gap-2">
          {corners.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActive(c.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                active === c.id
                  ? "border-emerald bg-emerald/10 text-emerald"
                  : "border-border bg-surface text-muted hover:text-foreground"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                {selected.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {selected.condition}
              </p>
            </div>
            <p className="text-3xl font-bold tabular-nums text-emerald">
              {selected.score}
            </p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-card px-3 py-2.5">
              <p className="text-[11px] font-semibold text-muted uppercase">
                Damage
              </p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">
                {selected.damage}%
              </p>
            </div>
            <div className="rounded-xl bg-card px-3 py-2.5">
              <p className="text-[11px] font-semibold text-muted uppercase">
                AI Notes
              </p>
              <p className="mt-0.5 text-sm text-foreground">{selected.notes}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted">{grade.corners.notes}</p>
        </div>
      </div>
    </div>
  );
}
