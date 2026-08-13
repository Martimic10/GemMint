"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Wallet, X } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useCredits } from "@/components/auth/credits-provider";
import {
  CenteringPanel,
  CornerPanel,
  DownloadButtons,
  EdgePanel,
  GradeSummary,
  ImageQualityCard,
  InspectionTimeline,
  OverviewPanel,
  ScanningOverlay,
  SurfacePanel,
  UploadZone,
  ValuePanel,
  type UploadSlotState,
} from "@/components/grade-flow";
import { Button } from "@/components/ui/button";
import type { DashboardGrade } from "@/lib/dashboard-data";
import {
  INSPECTION_STEPS,
  INSPECTION_TOTAL_MS,
  type GradeStage,
  type QualityCheck,
  type RichGradeReport,
} from "@/lib/grade-flow-data";
import { saveRichReport, upsertGrade } from "@/lib/grades-store";
import {
  buildClientQualityChecks,
  getImageDimensions,
  makeThumbnail,
  prepareImageForGrade,
} from "@/lib/image-utils";
import { SCAN_PACKS, PROFESSIONAL_REPORT, formatUsd } from "@/lib/scan-packs";
import { cn } from "@/lib/utils";

type ReportTab =
  | "overview"
  | "centering"
  | "corners"
  | "edges"
  | "surface"
  | "value";

const REPORT_TABS: { id: ReportTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "centering", label: "Centering" },
  { id: "corners", label: "Corners" },
  { id: "edges", label: "Edges" },
  { id: "surface", label: "Surface" },
  { id: "value", label: "Value" },
];

const STAGE_META: { id: GradeStage; label: string; n: number }[] = [
  { id: "upload", label: "Upload", n: 1 },
  { id: "quality", label: "Quality", n: 2 },
  { id: "inspection", label: "Inspect", n: 3 },
  { id: "report", label: "Report", n: 4 },
];

const emptySlot = (): UploadSlotState => ({ preview: null, file: null });

interface NewGradeViewProps {
  onComplete?: (grade: DashboardGrade) => void;
  onGoBilling?: () => void;
}

export function UploadCard({ compact = false }: { compact?: boolean }) {
  void compact;
  return <NewGradeView />;
}

export function NewGradeView({ onComplete, onGoBilling }: NewGradeViewProps) {
  const { user } = useAuth();
  const { credits, canScan, consumeCredit } = useCredits();
  const [stage, setStage] = useState<GradeStage>("upload");
  const [front, setFront] = useState<UploadSlotState>(emptySlot);
  const [back, setBack] = useState<UploadSlotState>(emptySlot);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [eta, setEta] = useState(Math.round(INSPECTION_TOTAL_MS / 1000));
  const [inspectionDone, setInspectionDone] = useState(false);
  const [creditFlash, setCreditFlash] = useState<number | null>(null);
  const [reportTab, setReportTab] = useState<ReportTab>("overview");
  const [report, setReport] = useState<RichGradeReport | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [grading, setGrading] = useState(false);
  const timers = useRef<number[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      abortRef.current?.abort();
    };
  }, [clearTimers]);

  const cardSrc = front.preview ?? "";

  function revokeIfNeeded(slot: UploadSlotState) {
    if (slot.preview && !slot.isDemo && slot.preview.startsWith("blob:")) {
      URL.revokeObjectURL(slot.preview);
    }
  }

  const handleFiles = useCallback(
    (files: FileList | null, preferred?: "front" | "back") => {
      if (!files?.length) return;
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!list.length) return;
      const toSlot = (file: File): UploadSlotState => ({
        preview: URL.createObjectURL(file),
        file,
      });

      if (preferred === "front") {
        setFront((prev) => {
          revokeIfNeeded(prev);
          return toSlot(list[0]);
        });
        return;
      }
      if (preferred === "back") {
        setBack((prev) => {
          revokeIfNeeded(prev);
          return toSlot(list[0]);
        });
        return;
      }

      if (list[0]) {
        setFront((prev) => {
          revokeIfNeeded(prev);
          return toSlot(list[0]);
        });
      }
      if (list[1]) {
        setBack((prev) => {
          revokeIfNeeded(prev);
          return toSlot(list[1]);
        });
      }
    },
    []
  );

  function clearSide(side: "front" | "back") {
    if (side === "front") {
      setFront((prev) => {
        revokeIfNeeded(prev);
        return emptySlot();
      });
    } else {
      setBack((prev) => {
        revokeIfNeeded(prev);
        return emptySlot();
      });
    }
  }

  async function continueFromUpload() {
    if (!front.file && !front.preview) return;
    try {
      const source = front.file ?? front.preview!;
      // Measure the original capture (not the API downscale) so phone photos aren't mislabeled.
      const dims = await getImageDimensions(source);
      setQualityChecks(buildClientQualityChecks(dims));
      setStage("quality");
      setGradeError(null);
    } catch {
      setQualityChecks(buildClientQualityChecks({ width: 1600, height: 2200 }));
      setStage("quality");
    }
  }

  function resetFlow() {
    clearTimers();
    abortRef.current?.abort();
    revokeIfNeeded(front);
    revokeIfNeeded(back);
    setFront(emptySlot());
    setBack(emptySlot());
    setStage("upload");
    setStepIndex(0);
    setInspectionDone(false);
    setCreditFlash(null);
    setReportTab("overview");
    setReport(null);
    setGradeError(null);
    setGrading(false);
    setQualityChecks([]);
    setEta(Math.round(INSPECTION_TOTAL_MS / 1000));
  }

  function runTimeline() {
    clearTimers();
    setStepIndex(0);
    setInspectionDone(false);
    setEta(Math.round(INSPECTION_TOTAL_MS / 1000));
    let elapsed = 0;
    INSPECTION_STEPS.forEach((step, i) => {
      const startAt = elapsed;
      elapsed += step.durationMs;
      const t = window.setTimeout(() => {
        setStepIndex(i);
        setEta(
          Math.max(1, Math.round((INSPECTION_TOTAL_MS - startAt) / 1000))
        );
      }, startAt);
      timers.current.push(t);
    });
  }

  async function startInspection() {
    if (!canScan) {
      onGoBilling?.();
      return;
    }
    if (!front.preview || !back.preview) {
      setGradeError("Front and back photos are required.");
      return;
    }

    setGradeError(null);
    setGrading(true);
    setStage("inspection");
    runTimeline();

    const balanceBefore = credits;
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const [frontPrepared, backPrepared] = await Promise.all([
        prepareImageForGrade(front.file ?? front.preview),
        prepareImageForGrade(back.file ?? back.preview),
      ]);

      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frontImage: frontPrepared.dataUrl,
          backImage: backPrepared.dataUrl,
        }),
        signal: controller.signal,
      });

      const data = (await res.json()) as {
        report?: RichGradeReport;
        error?: string;
      };

      if (!res.ok || !data.report) {
        throw new Error(data.error || "Grading failed. Please try again.");
      }

      const thumb = await makeThumbnail(frontPrepared.dataUrl, 480);
      const nextReport: RichGradeReport = {
        ...data.report,
        grade: {
          ...data.report.grade,
          imageUrl: front.preview || thumb,
        },
      };
      const persistedGrade = {
        ...nextReport.grade,
        imageUrl: thumb,
      };

      const ok = await consumeCredit({
        cardName: nextReport.grade.name,
        reportId: nextReport.grade.id,
      });
      if (!ok) {
        setStage("quality");
        setGrading(false);
        onGoBilling?.();
        return;
      }

      clearTimers();
      setReport(nextReport);
      setInspectionDone(true);
      setStepIndex(INSPECTION_STEPS.length);
      setEta(0);
      setCreditFlash(Math.max(0, balanceBefore - 1));
      setStage("report");
      if (!user?.uid) {
        throw new Error("You must be signed in to save this grade.");
      }
      await upsertGrade(persistedGrade, user.uid);
      await saveRichReport(
        { ...nextReport, grade: persistedGrade },
        user.uid
      );
      onComplete?.(persistedGrade);
    } catch (err) {
      if (controller.signal.aborted) return;
      clearTimers();
      const message =
        err instanceof Error ? err.message : "Grading failed unexpectedly.";
      setGradeError(message);
      setStage("quality");
    } finally {
      setGrading(false);
      abortRef.current = null;
    }
  }

  useEffect(() => {
    if (creditFlash === null) return;
    const t = window.setTimeout(() => setCreditFlash(null), 4200);
    return () => window.clearTimeout(t);
  }, [creditFlash]);

  const activeStep = useMemo(() => {
    if (inspectionDone) return null;
    return INSPECTION_STEPS[Math.min(stepIndex, INSPECTION_STEPS.length - 1)];
  }, [inspectionDone, stepIndex]);

  if (!canScan && stage !== "report") {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-6 pb-10">
        <OutOfCreditsState onGoBilling={onGoBilling} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-12">
      <StageRail stage={stage} />

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onGoBilling}
          className="inline-flex items-center gap-2 rounded-full border border-emerald/20 bg-emerald/5 px-3.5 py-2 text-sm font-semibold text-emerald transition-colors hover:bg-emerald/10"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {credits} credit{credits === 1 ? "" : "s"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {stage === "upload" ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <UploadZone
              front={front}
              back={back}
              onFiles={handleFiles}
              onClear={clearSide}
              onContinue={() => void continueFromUpload()}
            />
          </motion.div>
        ) : null}

        {stage === "quality" ? (
          <motion.div
            key="quality"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {gradeError ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {gradeError}
              </div>
            ) : null}
            <ImageQualityCard
              frontSrc={front.preview ?? ""}
              backSrc={back.preview ?? ""}
              checks={qualityChecks}
              onBack={() => setStage("upload")}
              onContinue={() => void startInspection()}
              continueLabel={grading ? "Starting…" : "Start AI Inspection"}
              continueDisabled={grading}
            />
          </motion.div>
        ) : null}

        {stage === "inspection" ? (
          <motion.div
            key="inspection"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-6 lg:grid-cols-[1fr_320px]"
          >
            <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-border bg-card px-4 py-8 sm:py-12">
              <p className="mb-6 text-center text-xs font-semibold tracking-wide text-emerald uppercase">
                Step 3 · AI Inspection
              </p>
              <ScanningOverlay
                cardSrc={cardSrc}
                cardId={null}
                step={activeStep}
              />
              <p className="mt-4 max-w-sm text-center text-xs text-muted">
                OpenRouter is analyzing centering, corners, edges, surface, and
                market value…
              </p>
            </div>
            <InspectionTimeline
              steps={INSPECTION_STEPS}
              activeIndex={stepIndex}
              done={inspectionDone}
              etaSeconds={eta}
            />
          </motion.div>
        ) : null}

        {stage === "report" && report ? (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 text-center sm:text-left">
                <p className="text-xs font-semibold tracking-wide text-emerald uppercase">
                  Step 4 · Professional Report
                </p>
              </div>
              <button
                type="button"
                onClick={resetFlow}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:bg-card hover:text-foreground"
                aria-label="Close report and grade another card"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <GradeSummary report={report} />

            <div className="overflow-hidden rounded-[1.5rem] border border-border bg-surface shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
              <div className="relative z-10 flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-surface px-3 sm:px-4">
                {REPORT_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setReportTab(t.id)}
                    className={cn(
                      "shrink-0 border-b-2 px-3 py-3.5 text-sm font-semibold transition-colors",
                      reportTab === t.id
                        ? "border-emerald text-emerald"
                        : "border-transparent text-muted hover:text-foreground"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-5 pt-6 sm:p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={reportTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                  >
                    {reportTab === "overview" ? (
                      <OverviewPanel report={report} cardSrc={cardSrc} />
                    ) : null}
                    {reportTab === "centering" ? (
                      <CenteringPanel report={report} cardSrc={cardSrc} />
                    ) : null}
                    {reportTab === "corners" ? (
                      <CornerPanel report={report} cardSrc={cardSrc} />
                    ) : null}
                    {reportTab === "edges" ? (
                      <EdgePanel report={report} cardSrc={cardSrc} />
                    ) : null}
                    {reportTab === "surface" ? (
                      <SurfacePanel report={report} cardSrc={cardSrc} />
                    ) : null}
                    {reportTab === "value" ? (
                      <ValuePanel report={report} />
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <DownloadButtons report={report} onGradeAnother={resetFlow} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {creditFlash !== null ? (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="pointer-events-none fixed right-4 bottom-4 z-50 mb-[env(safe-area-inset-bottom)] mr-[env(safe-area-inset-right)] sm:right-10 sm:bottom-10"
          >
            <div className="rounded-2xl border border-border bg-surface px-5 py-4 shadow-[0_16px_48px_rgba(17,24,39,0.16)]">
              <p className="text-sm font-bold text-amber-700">−1 Scan Credit</p>
              <p className="mt-1 text-xs text-muted">Remaining Credits</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {creditFlash}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function StageRail({ stage }: { stage: GradeStage }) {
  const current = STAGE_META.findIndex((s) => s.id === stage);

  return (
    <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
      {STAGE_META.map((item, i) => (
        <div key={item.id} className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-full px-3 text-sm font-semibold",
              i <= current ? "bg-emerald text-white" : "bg-card text-muted"
            )}
          >
            <span className="tabular-nums">{item.n}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </span>
          {i < STAGE_META.length - 1 ? (
            <span className="hidden h-px w-6 bg-border sm:block" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function OutOfCreditsState({ onGoBilling }: { onGoBilling?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.75rem] border border-border bg-surface p-8 text-center shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-10"
    >
      <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
        <Wallet className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
        You&apos;re Out of Scan Credits
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        Buy a single Professional Report or a credit pack to continue. One-time
        purchase — no subscription.
      </p>

      <button
        type="button"
        onClick={onGoBilling}
        className="mt-6 w-full rounded-2xl border border-emerald/30 bg-emerald/[0.06] px-4 py-4 text-left transition-colors hover:bg-emerald/10"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
            One-time
          </span>
          <span className="text-[10px] font-semibold tracking-wide text-muted uppercase">
            No subscription
          </span>
        </div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-foreground">
              {PROFESSIONAL_REPORT.name}
            </p>
            <p className="mt-0.5 text-xs text-muted">1 full AI grading report</p>
          </div>
          <p className="text-lg font-bold tabular-nums text-foreground">
            {formatUsd(PROFESSIONAL_REPORT.price)}
          </p>
        </div>
      </button>

      <div className="mt-3 grid gap-2 text-left sm:grid-cols-3">
        {SCAN_PACKS.map((pack) => (
          <div
            key={pack.id}
            className={cn(
              "rounded-2xl border px-3 py-3",
              pack.highlighted
                ? "border-emerald bg-emerald/5"
                : "border-border bg-card"
            )}
          >
            <p className="text-xs font-bold text-foreground">{pack.name}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">
              {formatUsd(pack.price)}
            </p>
            <p className="text-[11px] text-muted">{pack.credits} credits</p>
          </div>
        ))}
      </div>
      <Button size="lg" className="mt-6" onClick={onGoBilling}>
        <Sparkles className="h-4 w-4" />
        Buy Credits
      </Button>
    </motion.div>
  );
}
