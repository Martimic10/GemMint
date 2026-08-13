"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { Check, ListFilter } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardGrade, Recommendation } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

interface CollectionChartProps {
  grades: DashboardGrade[];
  collectionValue: number;
  cardsGraded: number;
  averageGrade: number;
}

type RangeKey = "year" | "quarter" | "month" | "week";
type MetricKey = "portfolio" | "added";
type RecFilter = "all" | Recommendation;

interface DayPoint {
  key: string;
  date: string;
  shortDate: string;
  label: string;
  value: number;
  added: number;
  scans: number;
  names: string[];
}

const RANGES: { id: RangeKey; label: string; days: number }[] = [
  { id: "year", label: "12 months", days: 365 },
  { id: "quarter", label: "3 months", days: 90 },
  { id: "month", label: "30 days", days: 30 },
  { id: "week", label: "7 days", days: 7 },
];

const REC_OPTIONS: { id: RecFilter; label: string }[] = [
  { id: "all", label: "All recommendations" },
  { id: "submit", label: "Submit" },
  { id: "wait", label: "Wait" },
  { id: "do-not-submit", label: "Do not submit" },
];

const chartConfig = {
  value: {
    label: "Collection",
    color: "#16A34A",
  },
  added: {
    label: "Added",
    color: "#2563EB",
  },
} satisfies ChartConfig;

export function CollectionChart({
  grades,
  collectionValue,
  cardsGraded,
  averageGrade,
}: CollectionChartProps) {
  const [range, setRange] = useState<RangeKey>("month");
  const [metric, setMetric] = useState<MetricKey>("portfolio");
  const [category, setCategory] = useState<string>("all");
  const [recommendation, setRecommendation] = useState<RecFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const g of grades) {
      if (g.category?.trim()) set.add(g.category.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [grades]);

  const filteredGrades = useMemo(() => {
    return grades.filter((g) => {
      if (g.status !== "complete") return false;
      if (category !== "all" && g.category !== category) return false;
      if (recommendation !== "all" && g.recommendation !== recommendation) {
        return false;
      }
      return true;
    });
  }, [grades, category, recommendation]);

  const rangeDays = RANGES.find((r) => r.id === range)?.days ?? 30;
  const activeFilterCount =
    (metric !== "portfolio" ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (recommendation !== "all" ? 1 : 0);

  const { points, hasScans, deltaPct, displayValue, rangeCards, rangeAvg } =
    useMemo(
      () =>
        buildSeries(filteredGrades, {
          dayCount: rangeDays,
          rangeKey: range,
          // Only sync ending value to global total when viewing the full portfolio.
          syncEndValue:
            category === "all" && recommendation === "all"
              ? collectionValue
              : null,
        }),
      [filteredGrades, rangeDays, range, collectionValue, category, recommendation]
    );

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (!filtersRef.current?.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [filtersOpen]);

  const tickGap =
    points.length <= 8
      ? 0
      : points.length <= 16
        ? 20
        : points.length <= 35
          ? 28
          : 40;

  const maxBarSize =
    points.length <= 8
      ? 40
      : points.length <= 16
        ? 28
        : points.length <= 35
          ? 16
          : 8;

  const deltaPositive = deltaPct >= 0;
  const deltaLabel = `${deltaPositive ? "+" : ""}${Math.round(deltaPct)}%`;
  const yMax = Math.max(
    ...points.map((p) =>
      metric === "portfolio" ? Math.max(p.value, p.added) : p.added
    ),
    1
  );

  const footerCards = hasScans ? rangeCards : cardsGraded;
  const footerAvg = hasScans ? rangeAvg : averageGrade;

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-border bg-surface shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
      <div className="flex flex-col gap-4 px-5 pt-5 pb-2 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pt-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Collection value
            </h2>
            {hasScans ? (
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  deltaPositive ? "text-emerald" : "text-red-600"
                )}
              >
                {deltaLabel}
              </span>
            ) : null}
          </div>
          {hasScans ? (
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
              ${displayValue.toLocaleString()}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">
              Grade a card to start tracking value over time
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex items-center rounded-lg border border-border bg-surface-muted/60 p-0.5"
            role="group"
            aria-label="Time range"
          >
            {RANGES.map((item) => {
              const selected = range === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setRange(item.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all sm:px-3",
                    selected
                      ? "bg-surface text-foreground shadow-[0_1px_2px_rgba(17,24,39,0.08)] ring-1 ring-border"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="relative" ref={filtersRef}>
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-haspopup="dialog"
              onClick={() => setFiltersOpen((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-[0_1px_2px_rgba(17,24,39,0.04)] transition-colors",
                activeFilterCount > 0 || filtersOpen
                  ? "border-emerald/40 bg-emerald/10 text-emerald"
                  : "border-border bg-surface text-foreground hover:bg-card"
              )}
            >
              <ListFilter className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 ? (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald px-1 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
            {filtersOpen ? (
              <div className="absolute top-full right-0 z-20 mt-1.5 w-56 overflow-hidden rounded-xl border border-border bg-surface py-2 shadow-[0_12px_40px_rgba(17,24,39,0.12)]">
                <FilterSection title="Chart">
                  {(
                    [
                      { id: "portfolio", label: "Portfolio value" },
                      { id: "added", label: "Value added" },
                    ] as const
                  ).map((opt) => (
                    <FilterOption
                      key={opt.id}
                      label={opt.label}
                      selected={metric === opt.id}
                      onSelect={() => setMetric(opt.id)}
                    />
                  ))}
                </FilterSection>

                {categories.length > 0 ? (
                  <FilterSection title="Category">
                    <FilterOption
                      label="All categories"
                      selected={category === "all"}
                      onSelect={() => setCategory("all")}
                    />
                    {categories.map((cat) => (
                      <FilterOption
                        key={cat}
                        label={cat}
                        selected={category === cat}
                        onSelect={() => setCategory(cat)}
                      />
                    ))}
                  </FilterSection>
                ) : null}

                <FilterSection title="Recommendation" last>
                  {REC_OPTIONS.map((opt) => (
                    <FilterOption
                      key={opt.id}
                      label={opt.label}
                      selected={recommendation === opt.id}
                      onSelect={() => setRecommendation(opt.id)}
                    />
                  ))}
                </FilterSection>

                {activeFilterCount > 0 ? (
                  <div className="border-t border-border px-2 pt-2">
                    <button
                      type="button"
                      className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-muted transition-colors hover:bg-card hover:text-foreground"
                      onClick={() => {
                        setMetric("portfolio");
                        setCategory("all");
                        setRecommendation("all");
                      }}
                    >
                      Reset filters
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="relative px-1 pt-1 pb-1 sm:px-3 sm:pb-2">
        {hasScans ? (
          <ChartContainer
            config={chartConfig}
            className="h-[280px] w-full sm:h-[320px]"
          >
            <ComposedChart
              accessibilityLayer
              data={points}
              margin={{ left: 8, right: 12, top: 16, bottom: 4 }}
              barCategoryGap="22%"
            >
              <defs>
                <linearGradient id="collectionFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16A34A" stopOpacity={0.28} />
                  <stop offset="70%" stopColor="#16A34A" stopOpacity={0.06} />
                  <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="addedBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={1} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0.75} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeOpacity={0.85}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                minTickGap={tickGap}
                interval="preserveStartEnd"
                tick={{ fill: "var(--muted)", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={48}
                tickMargin={6}
                domain={[0, Math.ceil(yMax * 1.12)]}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                tickFormatter={(v: number) => formatAxisMoney(v)}
              />
              <ChartTooltip
                cursor={{
                  stroke: "var(--muted)",
                  strokeWidth: 1,
                  strokeOpacity: 0.4,
                  strokeDasharray: "4 4",
                }}
                content={<DarkChartTooltip metric={metric} />}
              />

              {metric === "portfolio" ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="none"
                    fill="url(#collectionFill)"
                    isAnimationActive
                    animationDuration={450}
                  />
                  <Bar
                    dataKey="added"
                    fill="url(#addedBar)"
                    radius={[999, 999, 0, 0]}
                    maxBarSize={Math.min(maxBarSize, 18)}
                    isAnimationActive
                    animationDuration={400}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#16A34A"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "#16A34A",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    isAnimationActive
                    animationDuration={450}
                  />
                </>
              ) : (
                <Bar
                  dataKey="added"
                  fill="#16A34A"
                  radius={[999, 999, 0, 0]}
                  maxBarSize={maxBarSize}
                  isAnimationActive
                  animationDuration={400}
                />
              )}
            </ComposedChart>
          </ChartContainer>
        ) : (
          <EmptyChart />
        )}
      </div>

      {hasScans ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 pb-4 text-xs text-muted sm:px-6">
          {metric === "portfolio" ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald" />
                Portfolio
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-royal" />
                Value added
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald" />
              Value added
            </span>
          )}
          <span className="sm:ml-auto">
            {footerCards} card{footerCards === 1 ? "" : "s"} in range · avg PSA{" "}
            {footerAvg.toFixed(1)}
          </span>
        </div>
      ) : null}
    </section>
  );
}

function FilterSection({
  title,
  children,
  last,
}: {
  title: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <div className={cn("px-1", !last && "border-b border-border pb-2 mb-2")}>
      <p className="px-3 py-1.5 text-[10px] font-semibold tracking-wide text-muted uppercase">
        {title}
      </p>
      {children}
    </div>
  );
}

function FilterOption({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition-colors",
        selected
          ? "bg-emerald/10 font-semibold text-emerald"
          : "text-foreground hover:bg-card"
      )}
    >
      <span className="truncate">{label}</span>
      {selected ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
    </button>
  );
}

function formatAxisMoney(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `$${(value / 1000).toFixed(0)}k`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  if (value === 0) return "$0";
  return `$${Math.round(value)}`;
}

function DarkChartTooltip({
  active,
  payload,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ payload?: DayPoint }>;
  metric: MetricKey;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div className="min-w-[10.5rem] rounded-lg bg-[#111827] px-3 py-2.5 text-xs text-white shadow-[0_12px_32px_rgba(17,24,39,0.28)] dark:bg-[#020617]">
      <p className="font-semibold tracking-tight text-white">{row.date}</p>
      <div className="mt-2 space-y-1.5 text-[11px] text-white/75">
        <p className="flex items-center justify-between gap-6">
          <span>Collection</span>
          <span className="font-semibold text-white tabular-nums">
            ${row.value.toLocaleString()}
          </span>
        </p>
        <p className="flex items-center justify-between gap-6">
          <span>{metric === "added" ? "Added" : "Added in period"}</span>
          <span className="font-semibold text-white tabular-nums">
            {row.added > 0 ? `$${row.added.toLocaleString()}` : "—"}
          </span>
        </p>
        {row.scans > 0 ? (
          <p className="flex items-center justify-between gap-6">
            <span>Scans</span>
            <span className="font-semibold text-white tabular-nums">
              {row.scans}
            </span>
          </p>
        ) : null}
        {row.names.length > 0 ? (
          <p className="border-t border-white/10 pt-1.5 text-white/55">
            {row.names.slice(0, 2).join(", ")}
            {row.names.length > 2 ? "…" : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="relative flex h-[280px] flex-col items-center justify-center px-6 text-center sm:h-[320px]">
      <div className="flex h-28 items-end gap-1 opacity-35">
        {[38, 62, 45, 78, 52, 70, 42, 88, 58, 74, 48, 66].map((h, i) => (
          <span
            key={i}
            className="w-2.5 rounded-t-full bg-emerald sm:w-3"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <p className="relative mt-5 text-sm font-semibold text-foreground">
        Your collection chart starts here
      </p>
      <p className="relative mt-1 max-w-xs text-xs text-muted">
        After your first scan, portfolio value and adds appear across the
        selected range.
      </p>
    </div>
  );
}

function buildSeries(
  grades: DashboardGrade[],
  opts: {
    dayCount: number;
    rangeKey: RangeKey;
    syncEndValue: number | null;
  }
) {
  const complete = [...grades].sort((a, b) => {
    const da = parseGradeDate(a.date)?.getTime() || 0;
    const db = parseGradeDate(b.date)?.getTime() || 0;
    if (da !== db) return da - db;
    return a.id.localeCompare(b.id);
  });

  const hasScans = complete.length > 0;
  const today = startOfDay(new Date());
  const start = addDays(today, -(opts.dayCount - 1));

  // Bucket size: keep longer ranges readable without collapsing the window.
  const stepDays =
    opts.rangeKey === "year" ? 7 : opts.rangeKey === "quarter" ? 3 : 1;

  const buckets = buildBucketStarts(start, today, stepDays);

  let runningBefore = 0;
  const scansByBucket = new Map<
    string,
    { total: number; names: string[]; count: number; psaSum: number }
  >();

  let rangeCards = 0;
  let rangePsaSum = 0;

  for (const g of complete) {
    const d = parseGradeDate(g.date);
    if (!d) {
      runningBefore += Math.max(0, g.estimatedValue);
      continue;
    }
    const day = startOfDay(d);

    if (day < start) {
      runningBefore += Math.max(0, g.estimatedValue);
      continue;
    }
    if (day > today) continue;

    const bucketStart = bucketForDay(day, start, stepDays);
    const key = dayKey(bucketStart);
    const bucket = scansByBucket.get(key) ?? {
      total: 0,
      names: [],
      count: 0,
      psaSum: 0,
    };
    bucket.total += Math.max(0, g.estimatedValue);
    bucket.count += 1;
    bucket.psaSum += g.psa;
    if (g.name) bucket.names.push(g.name);
    scansByBucket.set(key, bucket);

    rangeCards += 1;
    rangePsaSum += g.psa;
  }

  let running = runningBefore;
  const points: DayPoint[] = [];

  for (const bucketStart of buckets) {
    const key = dayKey(bucketStart);
    const bucket = scansByBucket.get(key);
    const added = bucket?.total ?? 0;
    running += added;

    const endOfBucket = addDays(bucketStart, stepDays - 1);
    const labelDay =
      endOfBucket > today ? today : stepDays === 1 ? bucketStart : endOfBucket;

    points.push({
      key,
      date:
        stepDays === 1
          ? formatLongDate(bucketStart)
          : `${formatShortDate(bucketStart)} – ${formatShortDate(
              endOfBucket > today ? today : endOfBucket
            )}`,
      shortDate: formatShortDate(labelDay),
      label: formatTickLabel(labelDay, opts.dayCount, stepDays),
      value: Math.round(running),
      added: Math.round(added),
      scans: bucket?.count ?? 0,
      names: bucket?.names ?? [],
    });
  }

  if (points.length > 0 && opts.syncEndValue != null && opts.syncEndValue > 0) {
    points[points.length - 1].value = Math.round(opts.syncEndValue);
  }

  const startVal = points[0]?.value ?? 0;
  const endVal =
    points.length > 0
      ? points[points.length - 1].value
      : opts.syncEndValue ?? 0;
  // Compare against value at the start of the window (before first bucket adds).
  const baseline = startVal - (points[0]?.added ?? 0);
  let deltaPct = 0;
  if (baseline > 0 && endVal !== baseline) {
    deltaPct = ((endVal - baseline) / baseline) * 100;
  } else if (baseline <= 0 && endVal > 0) {
    deltaPct = 100;
  }

  return {
    points,
    hasScans,
    deltaPct,
    displayValue: endVal || opts.syncEndValue || 0,
    rangeCards,
    rangeAvg: rangeCards > 0 ? rangePsaSum / rangeCards : 0,
  };
}

function buildBucketStarts(start: Date, today: Date, stepDays: number) {
  const out: Date[] = [];
  let cursor = startOfDay(start);
  while (cursor <= today) {
    out.push(cursor);
    cursor = addDays(cursor, stepDays);
  }
  return out;
}

function bucketForDay(day: Date, rangeStart: Date, stepDays: number) {
  const diff = Math.round(
    (day.getTime() - rangeStart.getTime()) / 86_400_000
  );
  const offset = Math.floor(diff / stepDays) * stepDays;
  return addDays(rangeStart, offset);
}

function parseGradeDate(raw: string): Date | null {
  if (!raw?.trim()) return null;
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) return new Date(parsed);

  // Fallback for locale strings like "Aug 12, 2026"
  const m = raw.trim().match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (m) {
    const dt = new Date(`${m[1]} ${m[2]}, ${m[3]}`);
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  return null;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, amount: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + amount);
  return startOfDay(next);
}

function dayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatLongDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTickLabel(d: Date, dayCount: number, stepDays: number) {
  if (dayCount <= 8) {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  if (stepDays >= 7 || dayCount > 100) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
