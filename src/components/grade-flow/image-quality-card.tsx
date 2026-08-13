"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QualityCheck } from "@/lib/grade-flow-data";
import { cn } from "@/lib/utils";
import { UploadThumb } from "@/components/grade-flow/upload-zone";

interface ImageQualityCardProps {
  frontSrc: string;
  backSrc: string;
  checks: QualityCheck[];
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
}

export function ImageQualityCard({
  frontSrc,
  backSrc,
  checks,
  onBack,
  onContinue,
  continueLabel = "Start AI Inspection",
  continueDisabled = false,
}: ImageQualityCardProps) {
  const warnings = checks.filter((c) => c.status === "warn");
  const blocking = checks.some((c) => c.status === "fail");

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="text-center">
        <p className="text-xs font-semibold tracking-wide text-emerald uppercase">
          Step 2 · Quality Check
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Image quality inspection
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
          We verify capture quality before the lab run. Warnings won&apos;t block
          grading — they help you improve accuracy.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <figure className="rounded-2xl border border-border bg-surface p-2 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <div className="relative aspect-[5/7] overflow-hidden rounded-xl bg-surface-muted">
              <UploadThumb src={frontSrc} alt="Front" className="absolute inset-0" />
            </div>
            <figcaption className="mt-2 text-center text-xs font-semibold text-muted">
              Front
            </figcaption>
          </figure>
          <figure className="rounded-2xl border border-border bg-surface p-2 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <div className="relative aspect-[5/7] overflow-hidden rounded-xl bg-surface-muted">
              <UploadThumb src={backSrc} alt="Back" className="absolute inset-0" />
            </div>
            <figcaption className="mt-2 text-center text-xs font-semibold text-muted">
              Back
            </figcaption>
          </figure>
        </div>

        <div className="space-y-3">
          {checks.map((check, i) => (
            <motion.div
              key={check.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.35 }}
              className={cn(
                "flex gap-3 rounded-2xl border bg-surface px-4 py-3.5",
                check.status === "pass" && "border-border",
                check.status === "warn" && "border-amber-200 bg-amber-50/50",
                check.status === "fail" && "border-red-200 bg-red-50/50"
              )}
            >
              <StatusIcon status={check.status} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {check.label}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">
                  {check.detail}
                </p>
              </div>
            </motion.div>
          ))}

          {warnings.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3.5">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Suggestion
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {warnings[0].detail}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button variant="secondary" size="lg" onClick={onBack}>
          Re-upload
        </Button>
        <Button
          size="lg"
          onClick={onContinue}
          disabled={blocking || continueDisabled}
        >
          {blocking ? "Images unusable" : continueLabel}
        </Button>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: QualityCheck["status"] }) {
  if (status === "pass") {
    return (
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald/10 text-emerald">
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </span>
    );
  }
  if (status === "warn") {
    return (
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <AlertTriangle className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
      <X className="h-4 w-4" />
    </span>
  );
}
