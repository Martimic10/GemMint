"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useSpring, useTransform } from "framer-motion";
import {
  Check,
  CreditCard,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { useCredits } from "@/components/auth/credits-provider";
import { Button } from "@/components/ui/button";
import {
  FREE_SCAN_CREDITS,
  LOT_PRICE_REPORT,
  PROFESSIONAL_REPORT,
  SCAN_PACKS,
  costPerScan,
  formatUsd,
  getScanPack,
  isLotPack,
  isOneTimePurchase,
  type ScanPack,
  type ScanPackId,
} from "@/lib/scan-packs";
import { cn } from "@/lib/utils";

interface BillingModalProps {
  open: boolean;
  onClose: () => void;
  onNewGrade?: () => void;
  /** After returning from Stripe Checkout */
  checkoutReturn?: {
    status: "success" | "cancelled";
    sessionId?: string;
  } | null;
  onCheckoutReturnHandled?: () => void;
}

type Phase = "packs" | "checkout" | "success";

export function BillingModal({
  open,
  onClose,
  onNewGrade,
  checkoutReturn = null,
  onCheckoutReturnHandled,
}: BillingModalProps) {
  const { credits, lotCredits, startCheckout, confirmCheckout } = useCredits();
  const [phase, setPhase] = useState<Phase>("packs");
  const [purchasing, setPurchasing] = useState<ScanPackId | null>(null);
  const [successPack, setSuccessPack] = useState<ScanPack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayCredits, setDisplayCredits] = useState(credits);
  const [displayLotCredits, setDisplayLotCredits] = useState(lotCredits);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (checkoutReturn?.status === "success") {
      setPhase("checkout");
      setPurchasing(null);
      setSuccessPack(null);
      setError(null);
    } else if (checkoutReturn?.status === "cancelled") {
      setPhase("packs");
      setPurchasing(null);
      setSuccessPack(null);
      setError("Checkout cancelled — no charge was made.");
    } else {
      setPhase("packs");
      setPurchasing(null);
      setSuccessPack(null);
      setError(null);
    }
    setDisplayCredits(credits);
    setDisplayLotCredits(lotCredits);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose, checkoutReturn?.status, checkoutReturn?.sessionId]);

  useEffect(() => {
    if (!open || checkoutReturn?.status !== "success" || !checkoutReturn.sessionId) {
      return;
    }
    let cancelled = false;
    (async () => {
      setConfirming(true);
      setPhase("checkout");
      const result = await confirmCheckout(checkoutReturn.sessionId!);
      if (cancelled) return;
      setConfirming(false);
      onCheckoutReturnHandled?.();

      const pack = result?.packId ? getScanPack(result.packId) : null;
      const granted = result?.credits ?? pack?.credits ?? 0;
      if (pack && granted > 0) {
        setSuccessPack(pack);
        setPhase("success");
        const lot = isLotPack(pack) || result?.creditKind === "lot";
        // `balance` is the post-fulfill ledger (source of truth).
        const to =
          typeof result?.balance === "number"
            ? result.balance
            : (lot ? lotCredits : credits) +
              (result?.alreadyFulfilled ? 0 : granted);
        const from = Math.max(0, to - granted);
        if (lot) setDisplayLotCredits(from);
        else setDisplayCredits(from);
        const start = performance.now();
        const duration = 900;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          const value = Math.round(from + (to - from) * eased);
          if (lot) setDisplayLotCredits(value);
          else setDisplayCredits(value);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      } else {
        setPhase("packs");
        setError(
          "Payment received. If credits don’t appear in a few seconds, refresh the page."
        );
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, checkoutReturn?.status, checkoutReturn?.sessionId]);

  useEffect(() => {
    if (open && phase === "packs" && !confirming) {
      setDisplayCredits(credits);
      setDisplayLotCredits(lotCredits);
    }
  }, [credits, lotCredits, open, phase, confirming]);

  async function buyPack(pack: ScanPack) {
    setPurchasing(pack.id);
    setPhase("checkout");
    setError(null);

    const ok = await startCheckout(pack.id);
    if (!ok) {
      setPurchasing(null);
      setPhase("packs");
      setError(
        "Could not open Stripe Checkout. Check that Stripe keys and Price IDs are configured, then try again."
      );
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
            aria-label="Close"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="billing-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[min(92vh,100dvh)] w-full max-w-4xl flex-col overflow-hidden rounded-t-[1.75rem] border border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_24px_80px_rgba(17,24,39,0.18)] sm:max-h-[92vh] sm:rounded-[1.75rem] sm:pb-0"
          >
            <div className="flex items-start justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-8 sm:py-5">
              <div className="min-w-0">
                <h2
                  id="billing-title"
                  className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
                >
                  Buy Credits & Reports
                </h2>
                <p className="mt-1 text-sm text-muted sm:mt-1.5">
                  One-time purchases — no subscription. Grade credits power
                  single-card reports; lot credits price multi-card lots.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:bg-card hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 py-5 sm:px-8 sm:py-6">
              <AnimatePresence mode="wait">
                {phase === "checkout" ? (
                  <motion.div
                    key="checkout"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <Loader2 className="h-10 w-10 animate-spin text-royal" />
                    <p className="mt-4 text-lg font-bold text-foreground">
                      {confirming
                        ? "Confirming your payment…"
                        : "Redirecting to Stripe Checkout…"}
                    </p>
                    <p className="mt-1.5 max-w-sm text-sm text-muted">
                      {confirming
                        ? "Unlocking credits on your account."
                        : "You'll complete payment securely on Stripe, then return here with your credits unlocked."}
                    </p>
                  </motion.div>
                ) : null}

                {phase === "success" && successPack ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-10 text-center"
                  >
                    <motion.span
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 320, damping: 18 }}
                      className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald/10 text-emerald"
                    >
                      <Check className="h-8 w-8" strokeWidth={2.5} />
                    </motion.span>
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 }}
                      className="mt-5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
                    >
                      {isLotPack(successPack)
                        ? "Lot Price Report Unlocked"
                        : successPack.credits === 1
                          ? "Professional Report Unlocked"
                          : `${successPack.credits} Scan Credits Added`}
                    </motion.p>
                    <p className="mt-2 text-sm text-muted">
                      {successPack.name}
                      {isOneTimePurchase(successPack) ? "" : " pack"} ·{" "}
                      {formatUsd(successPack.price)} · One-time purchase
                    </p>
                    <div className="mt-6 rounded-2xl border border-border bg-card px-8 py-4">
                      <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                        {isLotPack(successPack) ? "Lot credits" : "Grade credits"}
                      </p>
                      <p className="mt-1 text-4xl font-bold tabular-nums text-emerald">
                        {isLotPack(successPack)
                          ? displayLotCredits
                          : displayCredits}
                      </p>
                    </div>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                      <Button
                        onClick={() => {
                          onClose();
                          onNewGrade?.();
                        }}
                      >
                        Grade a card
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setPhase("packs");
                          setSuccessPack(null);
                        }}
                      >
                        Buy more
                      </Button>
                    </div>
                  </motion.div>
                ) : null}

                {phase === "packs" ? (
                  <motion.div
                    key="packs"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald/10 text-emerald">
                            <Sparkles className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-sm font-medium text-muted">
                              Grade credits
                            </p>
                            <p className="text-2xl font-bold tabular-nums text-foreground">
                              {credits}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted">
                            Lot credits
                          </p>
                          <p className="text-2xl font-bold tabular-nums text-foreground">
                            {lotCredits}
                          </p>
                        </div>
                      </div>
                      {onNewGrade && credits > 0 ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            onClose();
                            onNewGrade();
                          }}
                        >
                          Grade a card
                        </Button>
                      ) : null}
                    </div>

                    <div className="mt-6 space-y-4">
                      {error ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {error}
                        </div>
                      ) : null}
                      <ProfessionalCard
                        pack={LOT_PRICE_REPORT}
                        disabled={purchasing !== null}
                        onPurchase={() => void buyPack(LOT_PRICE_REPORT)}
                      />
                      <ProfessionalCard
                        pack={PROFESSIONAL_REPORT}
                        disabled={purchasing !== null}
                        onPurchase={() => void buyPack(PROFESSIONAL_REPORT)}
                      />
                    </div>

                    <p className="mt-6 text-xs font-semibold tracking-wide text-muted uppercase">
                      Or buy a grading credit pack
                    </p>

                    <div className="mt-3 grid gap-4 sm:grid-cols-3">
                      {SCAN_PACKS.map((pack) => (
                        <PackCard
                          key={pack.id}
                          pack={pack}
                          disabled={purchasing !== null}
                          onPurchase={() => void buyPack(pack)}
                        />
                      ))}
                    </div>

                    <div className="mt-6 rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-start gap-3">
                        <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-royal" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            How credits work
                          </p>
                          <ul className="mt-2 space-y-1.5 text-xs text-muted">
                            <li className="flex gap-2">
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                              New accounts get {FREE_SCAN_CREDITS} free
                              professional scan
                            </li>
                            <li className="flex gap-2">
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                              Lot Price Reports ({formatUsd(LOT_PRICE_REPORT.price)})
                              are separate credits for multi-card lot valuation
                            </li>
                            <li className="flex gap-2">
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                              Credits never expire and only deduct after a
                              successful report
                            </li>
                              <li className="flex gap-2">
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                              No subscriptions — buy a single report or packs
                              when you need them
                            </li>
                          </ul>
                          <p className="mt-3 text-[11px] text-muted">
                            Payments are processed securely by Stripe. Credits
                            are added automatically after checkout.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ProfessionalCard({
  pack,
  disabled,
  onPurchase,
}: {
  pack: ScanPack;
  disabled: boolean;
  onPurchase: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald/30 bg-emerald/[0.04] p-5 ring-1 ring-emerald/15 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
          One-time purchase
        </span>
        <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted uppercase">
          No subscription
        </span>
      </div>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-lg font-bold tracking-tight text-foreground">
            {pack.name}
          </p>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">
            {pack.description}
          </p>
          <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-foreground">
            {formatUsd(pack.price)}
            <span className="ml-2 text-sm font-medium text-muted">
              · 1 report
            </span>
          </p>
        </div>
        <Button
          className="w-full shrink-0 sm:w-auto"
          disabled={disabled}
          onClick={onPurchase}
        >
          {pack.cta}
        </Button>
      </div>
      <ul className="mt-5 grid gap-2 border-t border-border/80 pt-4 sm:grid-cols-2">
        {pack.features.slice(0, 6).map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-xs text-foreground"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
            {feature}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-muted">
        {isLotPack(pack)
          ? "Includes raw + graded comps and a suggested lot list price."
          : "Plus market value, ROI recommendation, and downloadable PDF."}
      </p>
    </div>
  );
}

function PackCard({
  pack,
  disabled,
  onPurchase,
}: {
  pack: ScanPack;
  disabled: boolean;
  onPurchase: () => void;
}) {
  const perScan = costPerScan(pack);

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-surface p-5 transition-shadow hover:shadow-[0_8px_28px_rgba(17,24,39,0.08)]",
        pack.highlighted
          ? "border-emerald shadow-[0_8px_28px_rgba(22,163,74,0.12)] ring-1 ring-emerald/30"
          : "border-border"
      )}
    >
      {pack.badge ? (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
          {pack.badge}
        </span>
      ) : null}

      <p className="text-sm font-bold text-foreground">{pack.name}</p>
      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-foreground">
        {formatUsd(pack.price)}
      </p>
      <p className="mt-1 text-sm font-semibold text-emerald">
        {pack.credits} Credits
      </p>
      <p className="mt-1 text-xs text-muted">
        {formatUsd(perScan)} per scan · One-time
      </p>
      <p className="mt-3 flex-1 text-xs leading-relaxed text-muted">
        {pack.description}
      </p>
      <Button
        className="mt-5 w-full"
        variant={pack.highlighted ? "primary" : "secondary"}
        disabled={disabled}
        onClick={onPurchase}
      >
        Purchase
      </Button>
    </div>
  );
}

/** Optional animated counter for external use */
export function AnimatedCreditCount({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 90, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [text, setText] = useState(String(value));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    return display.on("change", (v) => setText(String(v)));
  }, [display]);

  return <span className="tabular-nums">{text}</span>;
}
