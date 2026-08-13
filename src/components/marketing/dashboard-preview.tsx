"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const REPORT_SRC = "/grading_report_transparent.png";
const REPORT_ALT =
  "GemMint grading report for a 1989 Upper Deck Ken Griffey Jr. card";

interface ReportMockupProps {
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/** Marketing mockup of the GemMint grading report UI. */
export function ReportMockup({
  className,
  priority = false,
  sizes = "(max-width: 1024px) 100vw, 640px",
}: ReportMockupProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <Image
        src={REPORT_SRC}
        alt={REPORT_ALT}
        width={2044}
        height={1364}
        priority={priority}
        sizes={sizes}
        className="h-auto w-full select-none"
      />
    </div>
  );
}

/** Hero alias — same mockup, tuned for the landing hero column. */
export function DashboardPreview({ className }: { className?: string }) {
  return (
    <ReportMockup
      className={cn("mx-auto max-w-xl lg:max-w-none", className)}
      priority
      sizes="(max-width: 1024px) 90vw, 560px"
    />
  );
}
