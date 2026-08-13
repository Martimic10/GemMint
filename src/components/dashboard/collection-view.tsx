"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  LayoutGrid,
  List,
  ListFilter,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { gradeDisplaySrc } from "@/lib/cards";
import type { DashboardGrade } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

type FilterId = "all" | "submit" | "wait" | "do-not-submit" | string;
type SortId = "newest" | "value" | "grade";
type ViewMode = "grid" | "list";

const REC_FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "submit", label: "Submit" },
  { id: "wait", label: "Wait" },
  { id: "do-not-submit", label: "Hold" },
];

const SORTS: { id: SortId; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "value", label: "Highest value" },
  { id: "grade", label: "Highest grade" },
];

interface CollectionViewProps {
  grades: DashboardGrade[];
  query?: string;
  onOpenReport: (grade: DashboardGrade) => void;
  onDeleteGrade?: (grade: DashboardGrade) => void;
  onNewGrade: () => void;
}

export function CollectionView({
  grades,
  query = "",
  onOpenReport,
  onDeleteGrade,
  onNewGrade,
}: CollectionViewProps) {
  const [filter, setFilter] = useState<FilterId>("all");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortId>("newest");
  const [view, setView] = useState<ViewMode>("grid");

  const complete = useMemo(
    () => grades.filter((g) => g.status === "complete"),
    [grades]
  );

  const categories = useMemo(() => {
    const set = new Set(complete.map((g) => g.category));
    return ["all", ...Array.from(set).sort()];
  }, [complete]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = complete.filter((g) => {
      if (filter !== "all" && g.recommendation !== filter) return false;
      if (category !== "all" && g.category !== category) return false;
      if (!q) return true;
      return (
        g.name.toLowerCase().includes(q) ||
        g.set.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.year.includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      if (sort === "value") return b.estimatedValue - a.estimatedValue;
      if (sort === "grade") return b.psa - a.psa || b.confidence - a.confidence;
      return Date.parse(b.date) - Date.parse(a.date);
    });

    return list;
  }, [category, complete, filter, query, sort]);

  const totalValue = complete.reduce((sum, g) => sum + g.estimatedValue, 0);
  const avgGrade =
    complete.length === 0
      ? 0
      : complete.reduce((sum, g) => sum + g.psa, 0) / complete.length;

  if (complete.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/10 text-emerald">
          <LayoutGrid className="h-6 w-6" />
        </span>
        <h2 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
          Your collection is empty
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Grade a card to start building your collection with values, grades, and
          submission guidance.
        </p>
        <Button className="mt-6" onClick={onNewGrade}>
          Grade your first card
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-10">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-muted">
          Browse graded cards, filter by recommendation, and open any report.
        </p>
        <p className="text-sm text-muted">
          Showing{" "}
          <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
          of {complete.length}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Cards" value={String(complete.length)} />
        <SummaryCard
          label="Estimated value"
          value={`$${totalValue.toLocaleString()}`}
        />
        <SummaryCard label="Avg PSA" value={avgGrade.toFixed(1)} />
      </div>

      <div className="flex flex-col gap-3 rounded-[1.35rem] border border-border bg-card p-3 sm:p-4">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {REC_FILTERS.map((item) => {
            const count =
              item.id === "all"
                ? complete.length
                : complete.filter((g) => g.recommendation === item.id).length;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  filter === item.id
                    ? "bg-emerald text-white"
                    : "bg-surface text-muted hover:text-foreground"
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                    filter === item.id
                      ? "bg-surface/20 text-white"
                      : "bg-card text-muted"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-border/80 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  category === cat
                    ? "bg-foreground text-white"
                    : "bg-surface text-muted hover:text-foreground"
                )}
              >
                {cat === "all" ? "All categories" : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted">
              <ListFilter className="h-3.5 w-3.5" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortId)}
                className="bg-transparent pr-1 font-medium text-foreground outline-none"
              >
                {SORTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="inline-flex rounded-full border border-border bg-surface p-0.5">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  view === "grid"
                    ? "bg-card text-foreground"
                    : "text-muted hover:text-foreground"
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  view === "list"
                    ? "bg-card text-foreground"
                    : "text-muted hover:text-foreground"
                )}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[1.5rem] border border-border bg-card px-6 py-14 text-center">
          <p className="text-sm font-medium text-foreground">No cards match</p>
          <p className="mt-1 text-sm text-muted">
            Try another filter or clear search.
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => {
              setFilter("all");
              setCategory("all");
            }}
          >
            Reset filters
          </Button>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((grade, index) => (
            <CollectionCard
              key={grade.id}
              grade={grade}
              index={index}
              onOpen={() => onOpenReport(grade)}
              onDelete={
                onDeleteGrade ? () => onDeleteGrade(grade) : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[1.5rem] border border-border bg-surface">
          {filtered.map((grade, index) => (
            <CollectionRow
              key={grade.id}
              grade={grade}
              index={index}
              onOpen={() => onOpenReport(grade)}
              onDelete={
                onDeleteGrade ? () => onDeleteGrade(grade) : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function CollectionCard({
  grade,
  index,
  onOpen,
  onDelete,
}: {
  grade: DashboardGrade;
  index: number;
  onOpen: () => void;
  onDelete?: () => void;
}) {
  const src = gradeDisplaySrc(grade);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-[1.35rem] border border-border bg-surface text-left shadow-[0_1px_2px_rgba(17,24,39,0.04)] transition-shadow hover:shadow-[0_10px_30px_rgba(17,24,39,0.08)]"
    >
      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left"
      >
        <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-gradient-to-b from-surface-muted to-border/60 px-5 pt-5 pb-3">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={grade.name}
              className="h-full w-auto max-w-full rounded-lg object-contain shadow-[0_8px_24px_rgba(17,24,39,0.18)] transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-[70%] items-center justify-center rounded-lg border border-dashed border-border/80 bg-surface/50 text-xs text-muted">
              No preview
            </div>
          )}
          <RecBadge recommendation={grade.recommendation} className="absolute top-3 left-3" />
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-foreground">
                {grade.name}
              </p>
              <p className="mt-0.5 truncate text-sm text-muted">
                {grade.year} · {grade.set}
              </p>
            </div>
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card text-muted opacity-0 transition-opacity group-hover:opacity-100">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="rounded-lg bg-emerald/10 px-2 py-1 text-xs font-bold text-emerald">
              PSA {grade.psa}
            </span>
            <span className="rounded-lg bg-royal/10 px-2 py-1 text-xs font-bold text-royal">
              BGS {grade.beckett}
            </span>
            <span className="ml-auto text-sm font-semibold tabular-nums text-foreground">
              ${grade.estimatedValue.toLocaleString()}
            </span>
          </div>
        </div>
      </button>

      {onDelete ? (
        <button
          type="button"
          aria-label={`Delete ${grade.name}`}
          title="Delete from collection"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-3 right-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface/95 text-muted shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </motion.div>
  );
}

function CollectionRow({
  grade,
  index,
  onOpen,
  onDelete,
}: {
  grade: DashboardGrade;
  index: number;
  onOpen: () => void;
  onDelete?: () => void;
}) {
  const src = gradeDisplaySrc(grade);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03 }}
      className="group flex w-full items-center gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-card/70 sm:gap-4 sm:px-5"
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-4 text-left"
      >
        <span className="relative flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-gradient-to-b from-surface-muted to-border/60">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              className="h-full w-full object-contain"
            />
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">
            {grade.name}
          </span>
          <span className="block truncate text-xs text-muted">
            {grade.year} · {grade.set} · {grade.category}
          </span>
        </span>
        <span className="hidden rounded-lg bg-emerald/10 px-2 py-1 text-xs font-bold text-emerald sm:inline">
          PSA {grade.psa}
        </span>
        <RecBadge
          recommendation={grade.recommendation}
          className="hidden sm:inline-flex"
        />
        <span className="text-sm font-semibold tabular-nums text-foreground">
          ${grade.estimatedValue.toLocaleString()}
        </span>
        <ArrowUpRight className="hidden h-4 w-4 text-muted sm:block" />
      </button>
      {onDelete ? (
        <button
          type="button"
          aria-label={`Delete ${grade.name}`}
          title="Delete from collection"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </motion.div>
  );
}

function RecBadge({
  recommendation,
  className,
}: {
  recommendation: DashboardGrade["recommendation"];
  className?: string;
}) {
  const label =
    recommendation === "submit"
      ? "Submit"
      : recommendation === "wait"
        ? "Wait"
        : "Hold";
  const styles =
    recommendation === "submit"
      ? "bg-emerald/10 text-emerald"
      : recommendation === "wait"
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-600";

  return (
    <span
      className={cn(
        "rounded-lg px-2 py-1 text-[11px] font-semibold",
        styles,
        className
      )}
    >
      {label}
    </span>
  );
}
