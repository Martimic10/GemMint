"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gradeDisplaySrc } from "@/lib/cards";
import type { DashboardGrade } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

interface RecentGradesTableProps {
  grades: DashboardGrade[];
  onOpenReport: (grade: DashboardGrade) => void;
  onDeleteGrade?: (grade: DashboardGrade) => void;
  query?: string;
}

export function RecentGradesTable({
  grades,
  onOpenReport,
  onDeleteGrade,
  query = "",
}: RecentGradesTableProps) {
  const filtered = grades.filter((g) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      g.name.toLowerCase().includes(q) ||
      g.set.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q)
    );
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-[1.5rem] border border-border bg-surface shadow-[0_1px_2px_rgba(17,24,39,0.04)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Recent Grades
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            Predictions, confidence, and submission guidance
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-card px-3 py-1 text-xs font-semibold text-muted">
          {filtered.length}
        </span>
      </div>

      {/* Mobile card list */}
      <div className="divide-y divide-border md:hidden">
        {filtered.map((grade, index) => {
          const src = gradeDisplaySrc(grade);
          return (
            <motion.div
              key={grade.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * index }}
              className="flex items-start gap-2 px-4 py-3.5"
            >
              <button
                type="button"
                onClick={() =>
                  grade.status === "complete" ? onOpenReport(grade) : undefined
                }
                disabled={grade.status !== "complete"}
                className="flex min-w-0 flex-1 items-start gap-3 text-left transition-colors disabled:cursor-default disabled:opacity-70"
              >
                <div className="relative flex h-16 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-gradient-to-b from-surface-muted to-border/60 shadow-sm">
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt={grade.name}
                      className="h-full w-full object-contain"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {grade.name}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {grade.year} · {grade.set}
                      </p>
                    </div>
                    <StatusBadge status={grade.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-lg bg-emerald/10 px-2 py-0.5 text-xs font-bold text-emerald">
                      PSA {grade.psa}
                    </span>
                    <span className="rounded-lg bg-royal/10 px-2 py-0.5 text-xs font-bold text-royal">
                      BGS {grade.beckett}
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-muted">
                      {grade.confidence}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-muted">{grade.date}</span>
                    {grade.status === "complete" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald">
                        Open
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
              {onDeleteGrade ? (
                <button
                  type="button"
                  aria-label={`Delete ${grade.name}`}
                  title="Delete scan"
                  onClick={() => onDeleteGrade(grade)}
                  className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </motion.div>
          );
        })}
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            No grades match your search.
          </p>
        ) : null}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-border bg-card/80 text-[11px] font-semibold tracking-wide text-muted uppercase">
              <th className="px-5 py-3 font-semibold sm:px-6">Card</th>
              <th className="px-3 py-3 font-semibold">Prediction</th>
              <th className="px-3 py-3 font-semibold">Confidence</th>
              <th className="px-3 py-3 font-semibold">Credit</th>
              <th className="px-3 py-3 font-semibold">Date</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold sm:px-6" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((grade, index) => {
              const src = gradeDisplaySrc(grade);
              return (
                <motion.tr
                  key={grade.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * index }}
                  className="group border-b border-border last:border-0 hover:bg-card/60"
                >
                  <td className="px-5 py-3.5 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-14 w-10 items-center justify-center overflow-hidden rounded-lg border border-border bg-gradient-to-b from-surface-muted to-border/60 shadow-sm">
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={src}
                            alt={grade.name}
                            className="h-full w-full object-contain"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {grade.name}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {grade.year} · {grade.set}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="rounded-lg bg-emerald/10 px-2 py-1 font-bold text-emerald">
                        PSA {grade.psa}
                      </span>
                      <span className="rounded-lg bg-royal/10 px-2 py-1 font-bold text-royal">
                        BGS {grade.beckett}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <ConfidenceBar value={grade.confidence} />
                  </td>
                  <td className="px-3 py-3.5 text-sm font-semibold tabular-nums text-foreground">
                    {grade.creditUsed > 0 ? grade.creditUsed : "—"}
                  </td>
                  <td className="px-3 py-3.5 text-sm text-muted">{grade.date}</td>
                  <td className="px-3 py-3.5">
                    <StatusBadge status={grade.status} />
                  </td>
                  <td className="px-5 py-3.5 sm:px-6">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        onClick={() => onOpenReport(grade)}
                        disabled={grade.status !== "complete"}
                      >
                        Open
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                      {onDeleteGrade ? (
                        <button
                          type="button"
                          aria-label={`Delete ${grade.name}`}
                          title="Delete scan"
                          onClick={() => onDeleteGrade(grade)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted opacity-100 transition-colors hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted">
            No grades match your search.
          </p>
        ) : null}
      </div>
    </motion.section>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="flex min-w-[88px] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-emerald"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums text-foreground">
        {value}%
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: DashboardGrade["status"] }) {
  const styles = {
    complete: "bg-emerald/10 text-emerald",
    processing: "bg-royal/10 text-royal",
    queued: "bg-card text-muted",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-lg px-2 py-1 text-xs font-semibold capitalize",
        styles[status]
      )}
    >
      {status}
    </span>
  );
}
