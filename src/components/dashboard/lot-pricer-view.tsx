"use client";

import { useCallback, useRef, useState } from "react";
import {
  Layers,
  Plus,
  Sparkles,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useCredits } from "@/components/auth/credits-provider";
import { Button } from "@/components/ui/button";
import type { LotPriceReport } from "@/lib/lot-report";
import { saveLotReport } from "@/lib/lots-store";
import { prepareImageForLot } from "@/lib/image-utils";
import { LOT_PRICE_REPORT, formatUsd } from "@/lib/scan-packs";
import { cn } from "@/lib/utils";

const MAX_PHOTOS = 6;

interface LotPricerViewProps {
  onGoBilling?: () => void;
  onComplete?: (report: LotPriceReport) => void;
}

export function LotPricerView({ onGoBilling, onComplete }: LotPricerViewProps) {
  const { user } = useAuth();
  const { lotCredits, canLotScan, consumeLotCredit, startCheckout } =
    useCredits();
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<LotPriceReport | null>(null);
  const [buying, setBuying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setError(null);
    const remaining = MAX_PHOTOS - photos.length;
    const slice = list.slice(0, remaining);
    const prepared = await Promise.all(
      slice.map(async (file) => {
        const { dataUrl } = await prepareImageForLot(file);
        return dataUrl;
      })
    );
    setPhotos((prev) => [...prev, ...prepared].slice(0, MAX_PHOTOS));
  }, [photos.length]);

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const runLotPrice = async () => {
    if (photos.length === 0) {
      setError("Add at least one lot photo.");
      return;
    }
    if (!canLotScan) {
      setError("You need a Lot Price Report credit first.");
      return;
    }

    setBusy(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch("/api/lot-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: photos }),
      });
      const data = (await res.json()) as {
        report?: LotPriceReport;
        error?: string;
      };
      if (!res.ok || !data.report) {
        throw new Error(data.error || "Lot pricing failed.");
      }

      // Show results immediately so consuming the last credit can't flash
      // the "buy credits" gate before report state lands.
      setReport(data.report);
      onComplete?.(data.report);

      const ok = await consumeLotCredit({
        lotTitle: data.report.title,
        reportId: data.report.id,
      });
      if (!ok) {
        setError(
          "Report ready, but we couldn't deduct a lot credit. Contact support if this repeats."
        );
      }

      try {
        await saveLotReport(data.report, user?.uid);
      } catch (saveError) {
        console.warn("Could not save lot report:", saveError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lot pricing failed.");
    } finally {
      setBusy(false);
    }
  };

  const buyLotCredit = async () => {
    setBuying(true);
    setError(null);
    try {
      const ok = await startCheckout("lot-price");
      if (!ok) {
        setError("Could not open Stripe Checkout. Try Billing instead.");
        onGoBilling?.();
      }
    } finally {
      setBuying(false);
    }
  };

  if (!canLotScan && !report && !busy) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-12 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/10 text-emerald">
          <Layers className="h-6 w-6" />
        </span>
        <h2 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
          Price a card lot
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Upload photos of a lot and get AI card IDs with raw and graded market
          estimates — built for sellers. Flat price{" "}
          {formatUsd(LOT_PRICE_REPORT.price)} per report.
        </p>
        {error ? (
          <div className="mt-4 w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="w-full sm:w-auto"
            disabled={buying}
            onClick={buyLotCredit}
          >
            <Wallet className="h-4 w-4" />
            {buying
              ? "Purchasing…"
              : `Buy Lot Report · ${formatUsd(LOT_PRICE_REPORT.price)}`}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={onGoBilling}
          >
            Open billing
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted">
          You have {lotCredits} lot credit{lotCredits === 1 ? "" : "s"}.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-10">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-emerald uppercase">
            Lot pricer
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Price a card lot
          </h2>
          <p className="mt-1 text-sm text-muted">
            Up to {MAX_PHOTOS} photos · {lotCredits} lot credit
            {lotCredits === 1 ? "" : "s"} left
          </p>
        </div>
        {!report ? (
          <Button
            onClick={runLotPrice}
            disabled={busy || photos.length === 0}
            className="mt-3 sm:mt-0"
          >
            <Sparkles className="h-4 w-4" />
            {busy ? "Pricing lot…" : "Price this lot"}
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="mt-3 sm:mt-0"
            onClick={() => {
              setReport(null);
              setPhotos([]);
              setError(null);
            }}
          >
            Price another lot
          </Button>
        )}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!report ? (
        <div className="rounded-[1.5rem] border border-border bg-surface p-4 sm:p-6">
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-4 py-10 text-center transition-colors",
              "hover:border-emerald/40"
            )}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.length) {
                void addFiles(e.dataTransfer.files);
              }
            }}
          >
            <Upload className="h-8 w-8 text-muted" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              Drop lot photos here
            </p>
            <p className="mt-1 max-w-sm text-xs text-muted">
              Spread cards flat, good light, readable names. Binder pages and
              table lots both work.
            </p>
            <Button
              variant="secondary"
              className="mt-5"
              onClick={() => inputRef.current?.click()}
              disabled={photos.length >= MAX_PHOTOS || busy}
            >
              <Plus className="h-4 w-4" />
              Add photos
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) void addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {photos.length > 0 ? (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {photos.map((src, i) => (
                <div
                  key={`${i}-${src.slice(0, 24)}`}
                  className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-card"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Lot photo ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    aria-label={`Remove photo ${i + 1}`}
                    onClick={() => removePhoto(i)}
                    className="absolute top-1.5 right-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground/80 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {busy ? (
            <p className="mt-4 text-center text-sm text-muted">
              Identifying cards and pulling market comps…
            </p>
          ) : null}
        </div>
      ) : (
        <LotReportPanel report={report} />
      )}
    </div>
  );
}

function LotReportPanel({ report }: { report: LotPriceReport }) {
  return (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              {report.title}
            </h3>
            <p className="mt-1 text-sm text-muted">{report.summary}</p>
            <p className="mt-2 text-xs text-muted">
              {report.cardCount} identified
              {report.unclearCount > 0
                ? ` · ${report.unclearCount} unclear`
                : ""}{" "}
              · {report.date}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[240px]">
            <Stat label="Raw total" value={`$${report.rawTotal.toLocaleString()}`} />
            <Stat
              label="Suggested list"
              value={`$${report.suggestedListPrice.toLocaleString()}`}
              accent
            />
            <Stat label="If PSA 8s" value={`$${report.psa8Total.toLocaleString()}`} />
            <Stat label="If PSA 10s" value={`$${report.psa10Total.toLocaleString()}`} />
          </div>
        </div>
        {report.tips ? (
          <p className="mt-4 rounded-xl bg-card px-3 py-2 text-xs text-muted">
            Tip: {report.tips}
          </p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-border bg-surface">
        <div className="border-b border-border px-4 py-3 sm:px-5">
          <p className="text-sm font-semibold text-foreground">
            Cards in this lot
          </p>
        </div>
        <div className="divide-y divide-border">
          {report.cards.map((card, i) => (
            <div
              key={`${card.name}-${card.set}-${i}`}
              className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {card.name}
                </p>
                <p className="truncate text-xs text-muted">
                  {card.year} · {card.set} · {card.condition} · {card.confidence}
                  % ID
                  {card.priceSource !== "estimate"
                    ? ` · ${card.priceSource}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold tabular-nums">
                <span className="rounded-lg bg-emerald/10 px-2 py-1 text-emerald">
                  Raw ${card.raw.toLocaleString()}
                </span>
                {card.psa8 > 0 ? (
                  <span className="rounded-lg bg-card px-2 py-1 text-foreground">
                    PSA 8 ${card.psa8.toLocaleString()}
                  </span>
                ) : null}
                {card.psa9 > 0 ? (
                  <span className="rounded-lg bg-card px-2 py-1 text-foreground">
                    PSA 9 ${card.psa9.toLocaleString()}
                  </span>
                ) : null}
                {card.psa10 > 0 ? (
                  <span className="rounded-lg bg-royal/10 px-2 py-1 text-royal">
                    PSA 10 ${card.psa10.toLocaleString()}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
          {report.cards.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">
              No cards could be identified. Try closer photos with readable
              names.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-base font-bold tabular-nums",
          accent ? "text-emerald" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}
