"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { formatCardMeta } from "@/lib/cards";
import type { RichGradeReport } from "@/lib/grade-flow-data";
import { recommendationCopy } from "@/lib/grade-flow-data";
import { cn } from "@/lib/utils";

interface GradeSummaryProps {
  report: RichGradeReport;
}

export function GradeSummary({ report }: GradeSummaryProps) {
  const { grade, potentialProfit, roiLabel } = report;
  const rec = recommendationCopy(grade.recommendation);

  return (
    <div className="rounded-[1.5rem] border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6">
      <p className="text-xs font-semibold tracking-wide text-emerald uppercase">
        GemMint Professional Report
      </p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
        {grade.name}
      </h2>
      <p className="mt-0.5 text-sm text-muted">{formatCardMeta(grade)}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Overall Grade"
          value={`PSA ${grade.psa}`}
          sub={`BGS ${grade.beckett}`}
          accent
        />
        <Metric
          label="Confidence"
          value={<AnimatedPct value={grade.confidence} />}
        />
        <Metric label="Recommendation" value={rec.label} tone={rec.tone} />
        <Metric
          label="Expected ROI"
          value={roiLabel}
          sub={
            potentialProfit >= 0
              ? "Graded value − raw − fees"
              : "Would lose vs raw after fees"
          }
          tone={potentialProfit >= 0 ? "emerald" : "red"}
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  accent,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: boolean;
  tone?: "emerald" | "amber" | "red";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        accent
          ? "border-emerald/20 bg-emerald/5"
          : "border-border bg-card"
      )}
    >
      <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-xl font-bold tabular-nums tracking-tight",
          tone === "emerald" && "text-emerald",
          tone === "amber" && "text-amber-700",
          tone === "red" && "text-red-600",
          !tone && accent && "text-emerald",
          !tone && !accent && "text-foreground"
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-xs text-muted">{sub}</p> : null}
    </div>
  );
}

function AnimatedPct({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => `${Math.round(v)}%`);
  const [text, setText] = useState("0%");

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => display.on("change", setText), [display]);

  return <span className="tabular-nums">{text}</span>;
}

export function ConfidenceMeter({ value }: { value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground">Confidence</span>
        <span className="font-bold tabular-nums text-emerald">{value}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
        <motion.div
          className="h-full rounded-full bg-emerald"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
