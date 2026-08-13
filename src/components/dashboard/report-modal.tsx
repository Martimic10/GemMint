"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, MinusCircle, Trash2, X, XCircle } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { gradeDisplaySrc, formatCardMeta, inferCardAssetId, resolveCardFrame, type CardFrame } from "@/lib/cards";
import type { DashboardGrade, Recommendation } from "@/lib/dashboard-data";
import type { RichGradeReport } from "@/lib/grade-flow-data";
import { loadRichReportAsync } from "@/lib/grades-store";
import { cn } from "@/lib/utils";

type TabId =
  | "overview"
  | "centering"
  | "corners"
  | "edges"
  | "surface"
  | "value";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "centering", label: "Centering" },
  { id: "corners", label: "Corners" },
  { id: "edges", label: "Edges" },
  { id: "surface", label: "Surface" },
  { id: "value", label: "Value" },
];

interface ReportModalProps {
  grade: DashboardGrade | null;
  open: boolean;
  onClose: () => void;
  onDelete?: (grade: DashboardGrade) => void;
  /** When set (e.g. Demo Mode), skip Firestore and use this rich report. */
  richOverride?: RichGradeReport | null;
}

export function ReportModal({
  grade,
  open,
  onClose,
  onDelete,
  richOverride = null,
}: ReportModalProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("overview");
  const [rich, setRich] = useState<RichGradeReport | null>(null);

  useEffect(() => {
    if (open) setTab("overview");
  }, [open, grade?.id]);

  useEffect(() => {
    if (!open || !grade?.id) {
      setRich(null);
      return;
    }

    if (richOverride && richOverride.grade.id === grade.id) {
      setRich(richOverride);
      return;
    }

    if (!user?.uid) {
      setRich(null);
      return;
    }

    let cancelled = false;
    (async () => {
      const report = await loadRichReportAsync(grade.id, user.uid);
      if (!cancelled) setRich(report);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, grade?.id, user?.uid, richOverride]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && grade ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
            aria-label="Close report"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[min(92vh,100dvh)] w-full max-w-5xl flex-col overflow-hidden rounded-t-[1.75rem] border border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_24px_80px_rgba(17,24,39,0.18)] sm:max-h-[92vh] sm:rounded-[1.75rem] sm:pb-0"
          >
            <div className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold tracking-wide text-emerald uppercase">
                  Grading Report
                </p>
                <h2
                  id="report-title"
                  className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl"
                >
                  {grade.name}
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  {formatCardMeta(grade)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {onDelete ? (
                  <button
                    type="button"
                    onClick={() => onDelete(grade)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete scan"
                    title="Delete scan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:bg-card hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-1 overflow-x-auto border-b border-border px-4 sm:px-6">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "shrink-0 border-b-2 px-3 py-3 text-sm font-semibold transition-colors",
                    tab === t.id
                      ? "border-emerald text-emerald"
                      : "border-transparent text-muted hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid flex-1 overflow-y-auto lg:grid-cols-[280px_1fr]">
              <div className="border-b border-border bg-card p-4 lg:border-r lg:border-b-0 lg:p-6">
                <ReportCardPreview grade={grade} tab={tab} rich={rich} />
                <RecommendationBanner value={grade.recommendation} />
              </div>

              <div className="p-4 sm:p-6">
                {tab === "overview" ? <OverviewTab grade={grade} /> : null}
                {tab === "centering" ? <CenteringTab grade={grade} /> : null}
                {tab === "corners" ? <CornersTab grade={grade} /> : null}
                {tab === "edges" ? (
                  <EdgesTab grade={grade} rich={rich} />
                ) : null}
                {tab === "surface" ? (
                  <SurfaceTab grade={grade} rich={rich} />
                ) : null}
                {tab === "value" ? <ValueTab grade={grade} /> : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border bg-card/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="line-clamp-2 text-sm text-muted sm:line-clamp-none">
                {grade.insight}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 sm:flex-none"
                  onClick={onClose}
                >
                  Close
                </Button>
                <Button className="flex-1 sm:flex-none">Export PDF</Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function OverviewTab({ grade }: { grade: DashboardGrade }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <ScoreCard label="PSA Prediction" value={`PSA ${grade.psa}`} accent="emerald" />
        <ScoreCard
          label="Beckett Prediction"
          value={`BGS ${grade.beckett}`}
          accent="royal"
        />
        <ScoreCard label="Confidence" value={`${grade.confidence}%`} />
        <ScoreCard
          label="Estimated Value"
          value={`$${grade.estimatedValue.toLocaleString()}`}
        />
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          Recommendation
        </p>
        <p className="mt-2 text-base font-semibold text-foreground capitalize">
          {grade.recommendation.replaceAll("-", " ")}
        </p>
        <p className="mt-1 text-sm text-muted">{grade.insight}</p>
      </div>
    </div>
  );
}

function CenteringTab({ grade }: { grade: DashboardGrade }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Metric label="Left / Right" value={grade.centering.lr} />
        <Metric label="Top / Bottom" value={grade.centering.tb} />
      </div>
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border px-4 py-3",
          grade.centering.pass
            ? "border-emerald/30 bg-emerald/5 text-emerald"
            : "border-red-200 bg-red-50 text-red-700"
        )}
      >
        {grade.centering.pass ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <XCircle className="h-5 w-5" />
        )}
        <div>
          <p className="text-sm font-semibold">
            {grade.centering.pass ? "Pass" : "Fail"} — centering standard
          </p>
          <p className="text-xs opacity-80">
            Measured against PSA / Beckett border tolerances
          </p>
        </div>
      </div>
    </div>
  );
}

function CornersTab({ grade }: { grade: DashboardGrade }) {
  const labels = ["Top Left", "Top Right", "Bottom Left", "Bottom Right"];
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {grade.corners.scores.map((score, i) => (
          <Metric key={labels[i]} label={labels[i]} value={score.toFixed(1)} />
        ))}
      </div>
      <Note text={grade.corners.notes} />
    </div>
  );
}

function EdgesTab({
  grade,
  rich,
}: {
  grade: DashboardGrade;
  rich: RichGradeReport | null;
}) {
  const sides = rich
    ? [
        { label: "Top edge", data: rich.edges.top },
        { label: "Right edge", data: rich.edges.right },
        { label: "Bottom edge", data: rich.edges.bottom },
        { label: "Left edge", data: rich.edges.left },
      ]
    : null;

  return (
    <div className="space-y-4">
      <Metric label="Edge Score" value={grade.edges.score.toFixed(1)} />
      <Note text={grade.edges.notes} />
      {sides ? (
        <div className="space-y-3">
          {sides.map(({ label, data }) => (
            <div
              key={label}
              className="rounded-2xl border border-border bg-surface px-4 py-3.5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-sm font-bold tabular-nums text-amber-700">
                  {Math.round(data.whitening)}% whitening
                </p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, data.whitening))}%`,
                  }}
                />
              </div>
              {data.notes ? (
                <p className="mt-2 text-xs text-muted">{data.notes}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SurfaceTab({
  grade,
  rich,
}: {
  grade: DashboardGrade;
  rich: RichGradeReport | null;
}) {
  const defects = rich?.defects ?? [];

  return (
    <div className="space-y-4">
      <Metric label="Surface Score" value={grade.surface.score.toFixed(1)} />
      <Note text={grade.surface.notes} />
      {defects.length > 0 ? (
        <ul className="space-y-2">
          {defects.map((d) => (
            <li
              key={d.id}
              className="rounded-2xl border border-border bg-surface px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {d.type}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{d.location}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    d.severity === "high" && "bg-red-50 text-red-700",
                    d.severity === "medium" && "bg-amber-50 text-amber-800",
                    d.severity === "low" && "bg-emerald/10 text-emerald"
                  )}
                >
                  {d.severity}
                </span>
              </div>
              {d.impact ? (
                <p className="mt-2 text-xs text-muted">{d.impact}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted">
          No discrete surface defects were flagged on this scan.
        </p>
      )}
    </div>
  );
}

function ValueTab({ grade }: { grade: DashboardGrade }) {
  const rows = [
    { label: "Raw", value: grade.market.raw },
    { label: "PSA 8", value: grade.market.psa8 },
    { label: "PSA 9", value: grade.market.psa9 },
    { label: "PSA 10", value: grade.market.psa10 },
  ];
  const max = Math.max(...rows.map((r) => r.value));

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-muted">{row.label}</span>
            <span className="font-bold tabular-nums text-foreground">
              ${row.value.toLocaleString()}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-border">
            <motion.div
              className="h-full rounded-full bg-royal"
              initial={{ width: 0 }}
              animate={{ width: `${(row.value / max) * 100}%` }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      ))}
      <RecommendationBanner value={grade.recommendation} />
    </div>
  );
}

function ScoreCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald" | "royal";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-2xl font-bold tracking-tight",
          accent === "emerald" && "text-emerald",
          accent === "royal" && "text-royal",
          !accent && "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

function Note({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-relaxed text-muted">
      {text}
    </div>
  );
}

function RecommendationBanner({ value }: { value: Recommendation }) {
  const map: Record<
    Recommendation,
    { label: string; icon: typeof CheckCircle2; className: string }
  > = {
    submit: {
      label: "Submit",
      icon: CheckCircle2,
      className: "border-emerald/30 bg-emerald/5 text-emerald",
    },
    wait: {
      label: "Wait",
      icon: MinusCircle,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    "do-not-submit": {
      label: "Do Not Submit",
      icon: XCircle,
      className: "border-red-200 bg-red-50 text-red-700",
    },
  };
  const meta = map[value];
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "mt-4 flex items-center gap-2 rounded-2xl border px-3 py-2.5",
        meta.className
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm font-semibold">{meta.label}</span>
    </div>
  );
}

function ReportCardPreview({
  grade,
  tab,
  rich,
}: {
  grade: DashboardGrade;
  tab: TabId;
  rich: RichGradeReport | null;
}) {
  const src = gradeDisplaySrc(grade);
  const asset = resolveCardFrame(inferCardAssetId(grade) ?? grade.cardId);
  const meta = formatCardMeta({ year: grade.year, set: grade.set });

  return (
    <div className="mx-auto w-full max-w-[168px] sm:max-w-[208px] lg:max-w-[248px]">
      <div
        className="relative overflow-hidden rounded-[1.15rem] border border-border bg-[#111827] shadow-[0_12px_40px_rgba(17,24,39,0.14)]"
        style={{ aspectRatio: asset.aspect.replace("/", " / ") }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={grade.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-card" />
        )}
        {tab === "centering" ? <CenteringOverlay asset={asset} /> : null}
        {tab === "surface" && rich?.defects?.length ? (
          <SurfaceDefectMarkers asset={asset} defects={rich.defects} />
        ) : null}
      </div>
      {meta ? (
        <p className="mt-3 text-center text-xs text-muted">{meta}</p>
      ) : null}
    </div>
  );
}

function CenteringOverlay({ asset }: { asset: CardFrame }) {
  const { viewBox, photo } = asset;
  const left = `${(photo.x / viewBox.w) * 100}%`;
  const top = `${(photo.y / viewBox.h) * 100}%`;
  const width = `${(photo.w / viewBox.w) * 100}%`;
  const height = `${(photo.h / viewBox.h) * 100}%`;

  return (
    <div
      className="pointer-events-none absolute rounded-[4px] border-2 border-dashed border-white/90 shadow-[0_0_0_1px_rgba(37,99,235,0.35)]"
      style={{ left, top, width, height }}
    >
      <span className="absolute top-1.5 left-1.5 rounded bg-royal px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
        L/R
      </span>
      <span className="absolute right-1.5 bottom-1.5 rounded bg-emerald px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
        T/B
      </span>
    </div>
  );
}

function SurfaceDefectMarkers({
  asset,
  defects,
}: {
  asset: CardFrame;
  defects: RichGradeReport["defects"];
}) {
  const { viewBox, photo } = asset;
  const left = `${(photo.x / viewBox.w) * 100}%`;
  const top = `${(photo.y / viewBox.h) * 100}%`;
  const width = `${(photo.w / viewBox.w) * 100}%`;
  const height = `${(photo.h / viewBox.h) * 100}%`;

  return (
    <div
      className="pointer-events-none absolute"
      style={{ left, top, width, height }}
    >
      {defects.map((d) => (
        <span
          key={d.id}
          className={cn(
            "absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow-sm",
            d.severity === "high" && "bg-red-500",
            d.severity === "medium" && "bg-amber-500",
            d.severity === "low" && "bg-royal"
          )}
          style={{
            left: `${Math.min(100, Math.max(0, d.x))}%`,
            top: `${Math.min(100, Math.max(0, d.y))}%`,
          }}
          title={`${d.type} · ${d.severity}`}
        />
      ))}
    </div>
  );
}
