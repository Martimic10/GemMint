"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { InspectionStep } from "@/lib/grade-flow-data";
import { resolveCardFrame, type CardAssetId } from "@/lib/cards";
import { cn } from "@/lib/utils";
import { UploadThumb } from "@/components/grade-flow/upload-zone";

interface ScanningOverlayProps {
  cardSrc: string;
  cardId?: CardAssetId | null;
  step: InspectionStep | null;
  className?: string;
}

export function ScanningOverlay({
  cardSrc,
  cardId = null,
  step,
  className,
}: ScanningOverlayProps) {
  const asset = resolveCardFrame(cardId);
  const { viewBox, photo } = asset;
  const left = `${(photo.x / viewBox.w) * 100}%`;
  const top = `${(photo.y / viewBox.h) * 100}%`;
  const width = `${(photo.w / viewBox.w) * 100}%`;
  const height = `${(photo.h / viewBox.h) * 100}%`;
  const mode = step?.overlay ?? "detect";

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[280px] overflow-hidden rounded-[1.35rem] border border-border bg-surface p-3 shadow-[0_12px_40px_rgba(17,24,39,0.1)]",
        className
      )}
    >
      <div
        className="relative w-full overflow-hidden rounded-xl bg-surface-muted"
        style={{ aspectRatio: asset.aspect.replace("/", " / ") }}
      >
        <UploadThumb
          src={cardSrc}
          alt="Card under inspection"
          className="absolute inset-0"
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-none absolute inset-0"
          >
            {mode === "detect" || mode === "perspective" ? (
              <motion.div
                className="absolute rounded-md border-2 border-royal/80"
                style={{ left, top, width, height }}
                initial={{ scale: 1.04, opacity: 0.4 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : null}

            {mode === "borders" || mode === "centering" ? (
              <div
                className="absolute rounded-md border-2 border-dashed border-white/90 shadow-[0_0_0_1px_rgba(37,99,235,0.35)]"
                style={{ left, top, width, height }}
              >
                <span className="absolute top-1.5 left-1.5 rounded bg-royal px-1.5 py-0.5 text-[9px] font-bold text-white">
                  L/R
                </span>
                <span className="absolute right-1.5 bottom-1.5 rounded bg-emerald px-1.5 py-0.5 text-[9px] font-bold text-white">
                  T/B
                </span>
                <motion.div
                  className="absolute inset-y-0 w-px bg-royal/70"
                  style={{ left: "50%" }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.6 }}
                />
                <motion.div
                  className="absolute inset-x-0 h-px bg-emerald/70"
                  style={{ top: "50%" }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.6, delay: 0.2 }}
                />
              </div>
            ) : null}

            {mode === "corners" ? (
              <div
                className="absolute"
                style={{ left, top, width, height }}
              >
                {(
                  [
                    ["0%", "0%"],
                    ["100%", "0%"],
                    ["0%", "100%"],
                    ["100%", "100%"],
                  ] as const
                ).map(([x, y], i) => (
                  <motion.span
                    key={i}
                    className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-emerald bg-emerald/20"
                    style={{ left: x, top: y }}
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.2,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </div>
            ) : null}

            {mode === "edges" ? (
              <div
                className="absolute rounded-sm"
                style={{ left, top, width, height }}
              >
                <motion.div
                  className="absolute inset-0 rounded-sm border-[3px] border-royal/70"
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                />
              </div>
            ) : null}

            {mode === "surface" || mode === "print" ? (
              <>
                <div
                  className="absolute overflow-hidden rounded-sm"
                  style={{ left, top, width, height }}
                >
                  <motion.div
                    className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-emerald/35 to-transparent"
                    initial={{ top: "-20%" }}
                    animate={{ top: "110%" }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.2,
                      ease: "linear",
                    }}
                  />
                </div>
                {mode === "print" ? (
                  <motion.span
                    className="absolute h-3 w-3 rounded-full bg-amber-400/80 ring-2 ring-white"
                    style={{ left: "62%", top: "78%" }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                ) : null}
              </>
            ) : null}

            {mode === "market" || mode === "grade" ? (
              <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 via-transparent to-transparent p-4">
                <motion.span
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-full bg-surface/95 px-3 py-1.5 text-xs font-bold text-foreground shadow-sm"
                >
                  {mode === "market" ? "Comping sales…" : "Calculating grade…"}
                </motion.span>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {step ? (
        <p className="mt-3 text-center text-xs font-semibold text-muted">
          {step.label}
        </p>
      ) : null}
    </div>
  );
}
