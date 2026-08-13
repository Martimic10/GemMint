"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/components/auth/auth-provider";
import { BillingModal } from "@/components/dashboard/billing-modal";
import { CollectionChart } from "@/components/dashboard/collection-chart";
import { CollectionView } from "@/components/dashboard/collection-view";
import { ComingSoonView } from "@/components/dashboard/coming-soon";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DashboardHeader } from "@/components/dashboard/header";
import { NewGradeView } from "@/components/dashboard/new-grade-view";
import { LotPricerView } from "@/components/dashboard/lot-pricer-view";
import { RecentGradesTable } from "@/components/dashboard/recent-grades";
import { ReportModal } from "@/components/dashboard/report-modal";
import { SettingsView } from "@/components/dashboard/settings-view";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import type { DashboardGrade, NavId } from "@/lib/dashboard-data";
import { computeStats, deleteGrade, loadGradesAsync } from "@/lib/grades-store";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardWorkspace />
    </RequireAuth>
  );
}

function DashboardWorkspace() {
  const { user } = useAuth();
  const [active, setActive] = useState<NavId>("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DashboardGrade | null>(null);
  const [billingOpen, setBillingOpen] = useState(false);
  const [grades, setGrades] = useState<DashboardGrade[]>([]);
  const [checkoutReturn, setCheckoutReturn] = useState<{
    status: "success" | "cancelled";
    sessionId?: string;
  } | null>(null);

  useEffect(() => {
    // Don't wipe the in-memory list on a transient auth blip — only reload.
    if (!user?.uid) return;
    let cancelled = false;
    (async () => {
      const loaded = await loadGradesAsync(user.uid);
      if (!cancelled) setGrades(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  // Deep links: /dashboard?view=new-grade | lot-price | report=<id>
  // Stripe return: /dashboard?billing=success&session_id=... | billing=cancelled
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const billing = params.get("billing");
    if (billing === "success" || billing === "cancelled") {
      setCheckoutReturn({
        status: billing,
        sessionId: params.get("session_id") ?? undefined,
      });
      setBillingOpen(true);
      params.delete("billing");
      params.delete("session_id");
      const next = params.toString();
      const path = next
        ? `${window.location.pathname}?${next}`
        : window.location.pathname;
      window.history.replaceState({}, "", path);
    }

    const view = params.get("view");
    if (view === "new-grade" || view === "grade") {
      setActive("new-grade");
      return;
    }
    if (view === "lot-price" || view === "lot") {
      setActive("lot-price");
      return;
    }
    const id = params.get("report");
    if (!id || grades.length === 0) return;
    const match = grades.find((g) => g.id === id);
    if (match) {
      setSelected(match);
      setActive("dashboard");
    }
  }, [grades]);

  useEffect(() => {
    if (!mobileNav) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNav(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileNav]);

  const stats = useMemo(() => computeStats(grades), [grades]);
  const hasGrades = grades.length > 0;
  // Every completed grade stays in Recent Scans permanently (newest first).
  const recentGrades = useMemo(
    () => grades.filter((g) => g.status === "complete"),
    [grades]
  );

  const goNewGrade = () => setActive("new-grade");
  const openBilling = () => setBillingOpen(true);

  const handleGradeComplete = (grade: DashboardGrade) => {
    setGrades((prev) => [grade, ...prev.filter((g) => g.id !== grade.id)]);
  };

  const handleDeleteGrade = useCallback(
    async (grade: DashboardGrade) => {
      if (!user?.uid) return;
      const ok = window.confirm(
        `Delete “${grade.name}” from your scans and collection? This can’t be undone.`
      );
      if (!ok) return;

      // Optimistic UI update
      setGrades((prev) => prev.filter((g) => g.id !== grade.id));
      if (selected?.id === grade.id) setSelected(null);

      try {
        const next = await deleteGrade(grade.id, user.uid);
        setGrades(next);
      } catch (error) {
        console.warn("Delete failed, reloading grades:", error);
        const loaded = await loadGradesAsync(user.uid);
        setGrades(loaded);
      }
    },
    [selected?.id, user?.uid]
  );

  const sidebarProps = {
    active,
    onNavigate: setActive,
    onNewGrade: goNewGrade,
    onOpenBilling: openBilling,
    onOpenReport: setSelected,
    onDeleteGrade: handleDeleteGrade,
    recentGrades,
    selectedGradeId: selected?.id ?? null,
  };

  return (
    <div className="flex h-svh gap-0 overflow-hidden bg-background p-0 sm:gap-3 sm:p-3 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="hidden shrink-0 lg:block">
        <DashboardSidebar
          {...sidebarProps}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
      </div>

      <AnimatePresence>
        {mobileNav ? (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
              aria-label="Close navigation"
              onClick={() => setMobileNav(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="relative flex h-full w-[min(280px,88vw)] flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"
            >
              <DashboardSidebar
                {...sidebarProps}
                onClose={() => setMobileNav(false)}
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-surface shadow-none sm:rounded-[1.5rem] sm:border sm:border-border sm:shadow-[0_8px_30px_rgba(17,24,39,0.04)]">
        <DashboardHeader
          active={active}
          onNewGrade={goNewGrade}
          onOpenBilling={openBilling}
          onOpenSidebar={() => setMobileNav(true)}
          search={search}
          onSearchChange={setSearch}
        />

        <div className="flex min-h-0 flex-1">
          <main
            className={cn(
              "min-w-0 flex-1 overflow-y-auto overscroll-contain",
              "px-3 py-4 sm:px-6 sm:py-6 lg:px-8"
            )}
          >
            {active === "dashboard" ? (
              hasGrades ? (
                <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-10">
                  <StatsCards {...stats} />
                  <RecentGradesTable
                    grades={grades}
                    query={search}
                    onOpenReport={setSelected}
                    onDeleteGrade={handleDeleteGrade}
                  />
                  <CollectionChart
                    grades={grades}
                    collectionValue={stats.collectionValue}
                    cardsGraded={stats.cardsGraded}
                    averageGrade={stats.averageGrade}
                  />
                </div>
              ) : (
                <div className="mx-auto max-w-3xl py-6">
                  <EmptyState onStart={goNewGrade} />
                </div>
              )
            ) : null}

            {active === "new-grade" ? (
              <NewGradeView
                onGoBilling={openBilling}
                onComplete={handleGradeComplete}
              />
            ) : null}

            {active === "lot-price" ? (
              <LotPricerView onGoBilling={openBilling} />
            ) : null}

            {active === "collection" ? (
              <CollectionView
                grades={grades}
                query={search}
                onOpenReport={setSelected}
                onDeleteGrade={handleDeleteGrade}
                onNewGrade={goNewGrade}
              />
            ) : null}

            {active === "settings" ? (
              <SettingsView onOpenBilling={openBilling} />
            ) : null}

            {active !== "dashboard" &&
            active !== "new-grade" &&
            active !== "lot-price" &&
            active !== "collection" &&
            active !== "settings" &&
            active !== "billing" ? (
              <ComingSoonView view={active} onNewGrade={goNewGrade} />
            ) : null}
          </main>
        </div>
      </div>

      <ReportModal
        grade={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        onDelete={handleDeleteGrade}
      />

      <BillingModal
        open={billingOpen}
        onClose={() => {
          setBillingOpen(false);
          setCheckoutReturn(null);
        }}
        onNewGrade={goNewGrade}
        checkoutReturn={checkoutReturn}
        onCheckoutReturnHandled={() => setCheckoutReturn(null)}
      />
    </div>
  );
}
