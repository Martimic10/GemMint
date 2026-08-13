"use client";

import {
  Check,
  Copy,
  Download,
  Link2,
  Save,
  ScanLine,
  Share2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { RichGradeReport } from "@/lib/grade-flow-data";
import {
  copyReportLink,
  downloadReportFile,
  downloadReportPdf,
  shareReport,
} from "@/lib/report-export";
import { cn } from "@/lib/utils";

interface DownloadButtonsProps {
  report: RichGradeReport;
  onGradeAnother: () => void;
}

type FlashKey = "pdf" | "share" | "copy" | "save" | null;

export function DownloadButtons({
  report,
  onGradeAnother,
}: DownloadButtonsProps) {
  const [flash, setFlash] = useState<FlashKey>(null);
  const [busy, setBusy] = useState<FlashKey>(null);

  function pulse(key: Exclude<FlashKey, null>, ms = 2000) {
    setFlash(key);
    window.setTimeout(() => setFlash((cur) => (cur === key ? null : cur)), ms);
  }

  async function onDownloadPdf() {
    setBusy("pdf");
    try {
      const result = downloadReportPdf(report);
      pulse("pdf", result.mode === "file" ? 2400 : 1800);
    } finally {
      setBusy(null);
    }
  }

  async function onShare() {
    setBusy("share");
    try {
      const result = await shareReport(report);
      if (result.mode !== "cancelled") pulse("share");
    } catch {
      pulse("share");
    } finally {
      setBusy(null);
    }
  }

  async function onCopy() {
    setBusy("copy");
    try {
      await copyReportLink(report.grade);
      pulse("copy");
    } catch {
      /* clipboard may be blocked */
    } finally {
      setBusy(null);
    }
  }

  function onSave() {
    setBusy("save");
    try {
      downloadReportFile(report, "html");
      pulse("save");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          type="button"
          disabled={busy === "pdf"}
          onClick={() => void onDownloadPdf()}
        >
          {flash === "pdf" ? (
            <Check className="h-3.5 w-3.5 text-emerald" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          {flash === "pdf" ? "Opening print…" : "Download PDF"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          disabled={busy === "share"}
          onClick={() => void onShare()}
        >
          {flash === "share" ? (
            <Check className="h-3.5 w-3.5 text-emerald" />
          ) : (
            <Share2 className="h-3.5 w-3.5" />
          )}
          {flash === "share" ? "Shared" : "Share Report"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          disabled={busy === "copy"}
          onClick={() => void onCopy()}
          className={cn(flash === "copy" && "border-emerald/30 text-emerald")}
        >
          {flash === "copy" ? (
            <>
              <Link2 className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy Link
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          disabled={busy === "save"}
          onClick={onSave}
        >
          {flash === "save" ? (
            <Check className="h-3.5 w-3.5 text-emerald" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {flash === "save" ? "Saved" : "Save Report"}
        </Button>
      </div>
      <Button type="button" onClick={onGradeAnother}>
        <ScanLine className="h-4 w-4" />
        Grade Another Card
      </Button>
    </div>
  );
}
