"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CollectionChart } from "@/components/dashboard/collection-chart";
import { CollectionView } from "@/components/dashboard/collection-view";
import { ComingSoonView } from "@/components/dashboard/coming-soon";
import { DashboardHeader } from "@/components/dashboard/header";
import { RecentGradesTable } from "@/components/dashboard/recent-grades";
import { ReportModal } from "@/components/dashboard/report-modal";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DemoBanner } from "@/components/demo/demo-banner";
import { DemoGateModal } from "@/components/demo/demo-gate-modal";
import { useDemoMode } from "@/components/demo/demo-provider";
import { Button } from "@/components/ui/button";
import type { DashboardGrade, NavId } from "@/lib/dashboard-data";
import { getDemoGrades, getDemoRichReport } from "@/lib/demo";
import { computeStats } from "@/lib/grades-store";
import { cn } from "@/lib/utils";

export function DemoWorkspace() {
  const { openGate } = useDemoMode();
  const grades = useMemo(() => getDemoGrades(), []);
  const [active, setActive] = useState<NavId>("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DashboardGrade | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    if (view === "collection") setActive("collection");
    if (view === "new-grade" || view === "grade") setActive("new-grade");
    if (view === "lot-price" || view === "lot") setActive("lot-price");
    const id = params.get("report");
    if (id) {
      const match = grades.find((g) => g.id === id);
      if (match) {
        setSelected(match);
        setActive("dashboard");
      }
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
  const recentGrades = useMemo(
    () => grades.filter((g) => g.status === "complete"),
    [grades]
  );

  const gateWrite = useCallback(
    (message: string) => {
      openGate(message);
    },
    [openGate]
  );

  const goNewGrade = () =>
    gateWrite(
      "Create your GemMint account to grade your own cards with AI — this demo stays read-only."
    );

  const openBilling = () =>
    gateWrite(
      "Billing and scan credits unlock when you create a real GemMint account."
    );

  const handleDeleteGrade = useCallback(
    (_grade: DashboardGrade) => {
      gateWrite(
        "Demo cards can’t be deleted. Create an account to manage your own collection."
      );
    },
    [gateWrite]
  );

  const navigate = (id: NavId) => {
    if (id === "new-grade" || id === "lot-price" || id === "settings") {
      const messages: Partial<Record<NavId, string>> = {
        "new-grade":
          "Create your GemMint account to grade your own cards with AI.",
        "lot-price":
          "Lot pricing is available on real accounts. Create yours to price multi-card lots.",
        settings:
          "Account settings are available after you sign in with Google.",
      };
      gateWrite(messages[id] ?? "Create a GemMint account to continue.");
      return;
    }
    setActive(id);
  };

  const richOverride = useMemo(
    () => (selected ? getDemoRichReport(selected) : null),
    [selected]
  );

  const sidebarProps = {
    active,
    onNavigate: navigate,
    onNewGrade: goNewGrade,
    onOpenBilling: openBilling,
    onOpenReport: setSelected,
    onDeleteGrade: handleDeleteGrade,
    recentGrades,
    selectedGradeId: selected?.id ?? null,
  };

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <DemoBanner />

      <div className="flex min-h-0 flex-1 gap-0 overflow-hidden p-0 sm:gap-3 sm:p-3">
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
                <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-10">
                  <DemoIntroCard onCreateAccount={goNewGrade} />
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
                  <DemoFooterCta />
                </div>
              ) : null}

              {active === "collection" ? (
                <div className="mx-auto max-w-6xl pb-10">
                  <CollectionView
                    grades={grades}
                    query={search}
                    onOpenReport={setSelected}
                    onDeleteGrade={handleDeleteGrade}
                    onNewGrade={goNewGrade}
                  />
                  <div className="mt-8">
                    <DemoFooterCta />
                  </div>
                </div>
              ) : null}

              {active !== "dashboard" &&
              active !== "collection" &&
              active !== "new-grade" &&
              active !== "lot-price" &&
              active !== "settings" ? (
                <ComingSoonView view={active} onNewGrade={goNewGrade} />
              ) : null}
            </main>
          </div>
        </div>
      </div>

      <ReportModal
        grade={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        onDelete={handleDeleteGrade}
        richOverride={richOverride}
      />

      <DemoGateModal />
    </div>
  );
}

function DemoIntroCard({ onCreateAccount }: { onCreateAccount: () => void }) {
  return (
    <div className="rounded-[1.5rem] border border-emerald/25 bg-gradient-to-br from-emerald/10 via-surface to-royal/5 px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-wide text-emerald uppercase">
            Welcome to GemMint
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            AI grading, collection value, and market insight — in one place.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
            Explore a curated portfolio of sports and TCG cards. Open any report
            to see centering, corners, edges, surface, and comps — no sign-in
            required.
          </p>
        </div>
        <Button onClick={onCreateAccount} className="shrink-0">
          Try with your cards
        </Button>
      </div>
    </div>
  );
}

function DemoFooterCta() {
  return (
    <div className="rounded-[1.5rem] border border-border bg-surface px-5 py-6 text-center sm:px-8">
      <h3 className="text-lg font-bold tracking-tight text-foreground">
        Build your own GemMint collection
      </h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
        Grade cards in under 30 seconds, track portfolio value, and decide what
        is worth submitting.
      </p>
      <Button className="mt-4" asChild>
        <Link href="/sign-in?next=/dashboard?view=new-grade">
          Start collecting
        </Link>
      </Button>
    </div>
  );
}
