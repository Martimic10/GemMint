"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, Plus, Search, Sparkles, X } from "lucide-react";
import { useCredits } from "@/components/auth/credits-provider";
import { Button } from "@/components/ui/button";
import type { NavId } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

const TITLES: Partial<Record<NavId, string>> = {
  dashboard: "Dashboard",
  collection: "Collection",
  "new-grade": "Grade",
  "lot-price": "Price a Lot",
  settings: "Settings",
  orders: "Orders",
  reports: "Reports",
  api: "API",
};

interface DashboardHeaderProps {
  active: NavId;
  onNewGrade: () => void;
  onOpenBilling?: () => void;
  onOpenSidebar?: () => void;
  search?: string;
  onSearchChange?: (value: string) => void;
}

export function DashboardHeader({
  active,
  onNewGrade,
  onOpenBilling,
  onOpenSidebar,
  search = "",
  onSearchChange,
}: DashboardHeaderProps) {
  const { credits, isLow } = useCredits();
  const title = TITLES[active] ?? "Dashboard";
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const showSearch = active === "dashboard" || active === "collection";

  useEffect(() => {
    setMobileSearchOpen(false);
  }, [active]);

  useEffect(() => {
    if (mobileSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [mobileSearchOpen]);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3 lg:px-8">
        {onOpenSidebar ? (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface sm:h-10 sm:w-10 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        ) : null}

        <h1 className="min-w-0 truncate text-lg font-bold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          {showSearch ? (
            <label className="relative hidden w-full max-w-[11rem] min-w-0 sm:block sm:max-w-xs sm:w-64 lg:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Search cards…"
                className="h-11 w-full rounded-2xl border border-border bg-card pr-3 pl-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-emerald focus:bg-surface focus:ring-2 focus:ring-emerald/20"
              />
            </label>
          ) : null}

          {showSearch ? (
            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border sm:hidden",
                mobileSearchOpen || search
                  ? "border-emerald/40 bg-emerald/5 text-emerald"
                  : "border-border bg-surface text-foreground"
              )}
              aria-label={mobileSearchOpen ? "Close search" : "Search cards"}
              aria-expanded={mobileSearchOpen}
            >
              {mobileSearchOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onOpenBilling}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1 rounded-xl border px-2.5 text-sm font-semibold tabular-nums transition-all hover:shadow-sm active:scale-[0.98] sm:h-11 sm:gap-1.5 sm:rounded-2xl sm:px-3",
              credits === 0 || isLow
                ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                : "border-border bg-surface text-foreground hover:border-emerald/40 hover:bg-emerald/5"
            )}
            aria-label="Buy scan credits"
          >
            <Sparkles
              className={cn(
                "h-3.5 w-3.5",
                credits === 0 || isLow ? "text-amber-600" : "text-emerald"
              )}
            />
            <span className="hidden tabular-nums sm:inline">
              {credits} Credit{credits === 1 ? "" : "s"}
            </span>
            <span className="tabular-nums sm:hidden">{credits}</span>
          </button>

          <Button
            className="h-9 shrink-0 px-3 text-sm sm:h-11 sm:px-5"
            onClick={onNewGrade}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Grade</span>
            <span className="sm:hidden">Grade</span>
          </Button>
        </div>
      </div>

      {showSearch && mobileSearchOpen ? (
        <div className="border-t border-border px-3 py-2.5 sm:hidden">
          <label className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              ref={searchInputRef}
              type="search"
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search cards…"
              className="h-11 w-full rounded-2xl border border-border bg-card pr-3 pl-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-emerald focus:bg-surface focus:ring-2 focus:ring-emerald/20"
            />
          </label>
        </div>
      ) : null}
    </header>
  );
}
