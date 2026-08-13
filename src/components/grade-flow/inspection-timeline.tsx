"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import type { InspectionStep } from "@/lib/grade-flow-data";
import { cn } from "@/lib/utils";

interface InspectionTimelineProps {
  steps: InspectionStep[];
  /** Index of currently running step; steps before are done */
  activeIndex: number;
  /** All complete */
  done?: boolean;
  etaSeconds: number;
}

export function InspectionTimeline({
  steps,
  activeIndex,
  done,
  etaSeconds,
}: InspectionTimelineProps) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-emerald uppercase">
            Lab inspection
          </p>
          <h3 className="mt-1 text-lg font-bold text-foreground">
            {done ? "Inspection complete" : "Analyzing card…"}
          </h3>
        </div>
        {!done ? (
          <span className="shrink-0 rounded-full bg-royal/10 px-3 py-1 text-xs font-semibold tabular-nums text-royal">
            ~{Math.max(1, etaSeconds)}s left
          </span>
        ) : null}
      </div>

      <ol className="mt-5 space-y-1.5">
        {steps.map((step, i) => {
          const isDone = done || i < activeIndex;
          const isActive = !done && i === activeIndex;
          return (
            <li key={step.id}>
              <motion.div
                layout
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                  isActive && "bg-emerald/5",
                  isDone && "opacity-100",
                  !isDone && !isActive && "opacity-45"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    isDone && "bg-emerald text-white",
                    isActive && "bg-royal/10 text-royal",
                    !isDone && !isActive && "bg-card text-muted"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isDone ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </motion.span>
                    ) : isActive ? (
                      <motion.span
                        key="spin"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      </motion.span>
                    ) : (
                      <span className="text-[10px] font-bold tabular-nums">
                        {i + 1}
                      </span>
                    )}
                  </AnimatePresence>
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    isActive ? "text-foreground" : "text-foreground",
                    !isDone && !isActive && "text-muted"
                  )}
                >
                  {step.label}
                </span>
              </motion.div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
