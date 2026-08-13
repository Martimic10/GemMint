"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  FREE_SCAN_CREDITS,
  LOW_CREDITS_THRESHOLD,
  getScanPack,
  type ScanPackId,
} from "@/lib/scan-packs";
import { confirmStripeCheckout, startStripeCheckout } from "@/lib/stripe-client";
import {
  addCreditsTxn,
  emptyLedger,
  loadUserCredits,
  resetCreditsTxn,
  saveUserCredits,
  consumeCreditTxn,
  consumeLotCreditTxn,
  type CreditPurchase,
  type CreditUsage,
  type CreditsLedger,
} from "@/lib/user-data";

/** @deprecated Prefer FREE_SCAN_CREDITS from @/lib/scan-packs */
export const FREE_CREDITS = FREE_SCAN_CREDITS;

export type {
  CreditPurchase,
  CreditUsage,
  CreditsLedger,
  PurchaseStatus,
} from "@/lib/user-data";

interface CreditsContextValue {
  credits: number;
  lotCredits: number;
  totalPurchased: number;
  totalUsed: number;
  /** Peak balance since last top-up; drives the sidebar fuel gauge. */
  creditBalancePeak: number;
  totalLotPurchased: number;
  totalLotUsed: number;
  purchases: CreditPurchase[];
  usages: CreditUsage[];
  loading: boolean;
  canScan: boolean;
  canLotScan: boolean;
  isLow: boolean;
  showWelcome: boolean;
  consumeCredit: (meta?: {
    cardName?: string;
    reportId?: string;
  }) => Promise<boolean>;
  consumeLotCredit: (meta?: {
    lotTitle?: string;
    reportId?: string;
  }) => Promise<boolean>;
  purchasePack: (packId: ScanPackId) => Promise<CreditPurchase | null>;
  /** Redirects to Stripe Checkout for the given pack. */
  startCheckout: (packId: ScanPackId) => Promise<{ ok: true } | { ok: false; error: string }>;
  /** Reload ledger from Firestore (e.g. after Checkout return). */
  refreshCredits: () => Promise<void>;
  /** Confirm + fulfill a Checkout session id after redirect. */
  confirmCheckout: (sessionId: string) => Promise<{
    packId?: string;
    credits?: number;
    creditKind?: "grade" | "lot";
    alreadyFulfilled?: boolean;
    balance?: number;
  } | null>;
  addCredits: (amount: number) => Promise<void>;
  dismissWelcome: () => Promise<void>;
  resetDemoCredits: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextValue | undefined>(
  undefined
);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [ledger, setLedger] = useState<CreditsLedger>(emptyLedger);
  const [loading, setLoading] = useState(true);
  const ledgerRef = useRef(ledger);
  const uidRef = useRef<string | null>(null);

  useEffect(() => {
    ledgerRef.current = ledger;
  }, [ledger]);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    (async () => {
      if (!user) {
        uidRef.current = null;
        if (!cancelled) {
          setLedger(emptyLedger());
          setLoading(false);
        }
        return;
      }

      uidRef.current = user.uid;
      setLoading(true);
      try {
        const stored = await loadUserCredits(user.uid);
        if (cancelled || uidRef.current !== user.uid) return;
        setLedger(stored);
      } catch (error) {
        console.error("Failed to load credits from Firestore:", error);
        if (!cancelled) setLedger(emptyLedger());
      } finally {
        if (!cancelled && uidRef.current === user.uid) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.uid]);

  const consumeCredit = useCallback(
    async (meta?: { cardName?: string; reportId?: string }) => {
      const uid = uidRef.current;
      if (!uid) return false;
      if (ledgerRef.current.credits < 1) return false;

      try {
        const next = await consumeCreditTxn(uid, meta);
        if (!next) return false;
        ledgerRef.current = next;
        setLedger(next);
        return true;
      } catch (error) {
        console.error("Failed to consume credit:", error);
        return false;
      }
    },
    []
  );

  const consumeLotCredit = useCallback(
    async (meta?: { lotTitle?: string; reportId?: string }) => {
      const uid = uidRef.current;
      if (!uid) return false;
      if (ledgerRef.current.lotCredits < 1) return false;

      try {
        const next = await consumeLotCreditTxn(uid, meta);
        if (!next) return false;
        ledgerRef.current = next;
        setLedger(next);
        return true;
      } catch (error) {
        console.error("Failed to consume lot credit:", error);
        return false;
      }
    },
    []
  );

  const refreshCredits = useCallback(async () => {
    const uid = uidRef.current;
    if (!uid) return;
    try {
      const stored = await loadUserCredits(uid);
      if (uidRef.current !== uid) return;
      ledgerRef.current = stored;
      setLedger(stored);
    } catch (error) {
      console.error("Failed to refresh credits:", error);
    }
  }, []);

  const startCheckout = useCallback(async (packId: ScanPackId) => {
    const uid = uidRef.current;
    const pack = getScanPack(packId);
    if (!uid || !pack) {
      return {
        ok: false as const,
        error: !uid ? "Sign in required to purchase credits." : "Unknown pack.",
      };
    }
    try {
      const { url } = await startStripeCheckout(packId);
      window.location.assign(url);
      return { ok: true as const };
    } catch (error) {
      console.error("Checkout failed:", error);
      return {
        ok: false as const,
        error:
          error instanceof Error
            ? error.message
            : "Could not start Stripe Checkout.",
      };
    }
  }, []);

  const confirmCheckout = useCallback(async (sessionId: string) => {
    const uid = uidRef.current;
    if (!uid || !sessionId) return null;
    try {
      const result = await confirmStripeCheckout(sessionId);
      await refreshCredits();
      const kind = result.creditKind ?? "grade";
      const balance =
        kind === "lot"
          ? ledgerRef.current.lotCredits
          : ledgerRef.current.credits;
      return {
        packId: result.packId,
        credits: result.credits,
        creditKind: result.creditKind,
        alreadyFulfilled: result.alreadyFulfilled,
        balance,
      };
    } catch (error) {
      console.error("Confirm checkout failed:", error);
      // Still try a refresh — webhook may have already fulfilled.
      await refreshCredits();
      return null;
    }
  }, [refreshCredits]);

  /** @deprecated Client-side grants are disabled. Use startCheckout. */
  const purchasePack = useCallback(async (packId: ScanPackId) => {
    const result = await startCheckout(packId);
    return result.ok ? null : null;
  }, [startCheckout]);

  const addCredits = useCallback(async (amount: number) => {
    const uid = uidRef.current;
    if (!uid || amount <= 0) return;
    try {
      const next = await addCreditsTxn(uid, amount);
      ledgerRef.current = next;
      setLedger(next);
    } catch (error) {
      console.error("Failed to add credits:", error);
    }
  }, []);

  const dismissWelcome = useCallback(async () => {
    const uid = uidRef.current;
    const next = { ...ledgerRef.current, welcomeDismissed: true };
    ledgerRef.current = next;
    setLedger(next);
    if (uid) {
      try {
        await saveUserCredits(uid, next);
      } catch (error) {
        console.error("Failed to dismiss welcome:", error);
      }
    }
  }, []);

  const resetDemoCredits = useCallback(async () => {
    const uid = uidRef.current;
    if (!uid) return;
    try {
      const next = await resetCreditsTxn(uid);
      ledgerRef.current = next;
      setLedger(next);
    } catch (error) {
      console.error("Failed to reset credits:", error);
    }
  }, []);

  const value = useMemo(
    () => ({
      credits: ledger.credits,
      lotCredits: ledger.lotCredits,
      totalPurchased: ledger.totalPurchased,
      totalUsed: ledger.totalUsed,
      creditBalancePeak: ledger.creditBalancePeak,
      totalLotPurchased: ledger.totalLotPurchased,
      totalLotUsed: ledger.totalLotUsed,
      purchases: ledger.purchases,
      usages: ledger.usages,
      loading,
      canScan: ledger.credits >= 1,
      canLotScan: ledger.lotCredits >= 1,
      isLow:
        ledger.credits > 0 && ledger.credits <= LOW_CREDITS_THRESHOLD,
      showWelcome: false,
      consumeCredit,
      consumeLotCredit,
      purchasePack,
      startCheckout,
      refreshCredits,
      confirmCheckout,
      addCredits,
      dismissWelcome,
      resetDemoCredits,
    }),
    [
      addCredits,
      confirmCheckout,
      consumeCredit,
      consumeLotCredit,
      dismissWelcome,
      ledger,
      loading,
      purchasePack,
      refreshCredits,
      resetDemoCredits,
      startCheckout,
    ]
  );

  return (
    <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error("useCredits must be used within a CreditsProvider");
  }
  return context;
}
