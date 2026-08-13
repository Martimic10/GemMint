"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  LayoutDashboard,
  Layers,
  Library,
  LogOut,
  PanelLeft,
  Plus,
  ScanLine,
  Settings,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useCredits } from "@/components/auth/credits-provider";
import { useDemoMode } from "@/components/demo/demo-provider";
import { Logo } from "@/components/layout/logo";
import { gradeDisplaySrc } from "@/lib/cards";
import type { DashboardGrade, NavId } from "@/lib/dashboard-data";
import { DEMO_USER } from "@/lib/demo";
import { cn } from "@/lib/utils";

const PRIMARY_NAV: {
  id: NavId;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "collection", label: "Collection", icon: Library },
  { id: "new-grade", label: "New Grade", icon: ScanLine },
  { id: "lot-price", label: "Price a Lot", icon: Layers },
];

interface DashboardSidebarProps {
  active: NavId;
  onNavigate: (id: NavId) => void;
  onNewGrade?: () => void;
  onOpenBilling?: () => void;
  onOpenReport?: (grade: DashboardGrade) => void;
  onDeleteGrade?: (grade: DashboardGrade) => void;
  recentGrades?: DashboardGrade[];
  selectedGradeId?: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

export function DashboardSidebar({
  active,
  onNavigate,
  onNewGrade,
  onOpenBilling,
  onOpenReport,
  onDeleteGrade,
  recentGrades = [],
  selectedGradeId = null,
  collapsed = false,
  onToggleCollapse,
  onClose,
}: DashboardSidebarProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { credits, creditBalancePeak, isLow } = useCredits();
  const { isDemo } = useDemoMode();
  const [recentOpen, setRecentOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  // Tank = peak since last purchase (full bar after buy; depletes as you scan).
  const capacity = Math.max(creditBalancePeak, credits, 1);
  const usedFromPeak = Math.max(0, capacity - credits);
  const progressPct = Math.min(100, (credits / capacity) * 100);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = isDemo
    ? DEMO_USER.displayName
    : user?.displayName || user?.email?.split("@")[0] || "Collector";
  const initial = displayName.charAt(0).toUpperCase();
  const photoURL = isDemo ? null : user?.photoURL ?? null;
  const emailLabel = isDemo ? DEMO_USER.email : user?.email;

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const go = (id: NavId) => {
    onNavigate(id);
    onClose?.();
    setMenuOpen(false);
  };

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    onClose?.();
    router.replace("/");
  }

  const avatar = (
    <UserAvatar
      photoURL={photoURL}
      initial={initial}
      name={displayName}
      className="h-10 w-10"
    />
  );

  const profileMenu = (
    <AnimatePresence>
      {menuOpen ? (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "absolute z-30 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-[0_12px_40px_rgba(17,24,39,0.12)]",
            collapsed
              ? "bottom-0 left-full ml-2 w-48"
              : "right-3 bottom-[calc(100%-0.25rem)] left-3"
          )}
          role="menu"
        >
          <MenuItem
            icon={Wallet}
            label="Buy Credits"
            onClick={() => {
              setMenuOpen(false);
              onClose?.();
              onOpenBilling?.();
            }}
          />
          <MenuItem
            icon={Settings}
            label="Settings"
            onClick={() => go("settings")}
          />
          <div className="my-1 h-px bg-border" />
          {isDemo ? (
            <MenuItem
              icon={LogOut}
              label="Exit demo"
              onClick={() => {
                setMenuOpen(false);
                onClose?.();
                router.push("/");
              }}
            />
          ) : (
            <MenuItem
              icon={LogOut}
              label="Sign out"
              destructive
              onClick={() => void handleSignOut()}
            />
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  if (collapsed) {
    return (
      <aside className="flex h-full w-[72px] flex-col items-center rounded-[1.5rem] border border-border bg-surface py-4 shadow-[0_8px_30px_rgba(17,24,39,0.04)]">
        <Link href="/" aria-label="GemMint home" className="mb-4">
          <Logo markOnly />
        </Link>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-card hover:text-foreground"
          aria-label="Expand sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-1 flex-col items-center gap-1">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                onClick={() => go(item.id)}
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                  isActive
                    ? "bg-emerald/10 text-emerald"
                    : "text-muted hover:bg-card hover:text-foreground"
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </button>
            );
          })}
        </div>
        <div className="relative mt-auto flex flex-col items-center gap-2" ref={menuRef}>
          <button
            type="button"
            title={`${credits} credits`}
            onClick={() => onOpenBilling?.()}
            className={cn(
              "inline-flex h-10 min-w-10 flex-col items-center justify-center rounded-xl px-1 text-[10px] font-bold tabular-nums transition-colors",
              credits === 0 || isLow
                ? "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-400 dark:hover:bg-amber-500/25"
                : "bg-emerald/10 text-emerald hover:bg-emerald/15"
            )}
          >
            {credits}
          </button>
          {profileMenu}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Account menu"
            className="rounded-full outline-none ring-emerald/30 focus-visible:ring-2"
          >
            <UserAvatar
              photoURL={photoURL}
              initial={initial}
              name={displayName}
              className="h-9 w-9"
            />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-full max-w-[280px] flex-col rounded-none border-y-0 border-l-0 border-r border-border bg-surface shadow-[0_8px_30px_rgba(17,24,39,0.04)] lg:rounded-[1.5rem] lg:border">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <Link href="/" aria-label="GemMint home" onClick={onClose}>
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          {onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-card hover:text-foreground"
              aria-label="Collapse sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          ) : null}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-card hover:text-foreground lg:hidden"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-2">
        <nav className="space-y-0.5 px-1" aria-label="Primary">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald/10 text-foreground shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--emerald)_35%,transparent)]"
                    : "text-muted hover:bg-card/80 hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px]",
                    isActive ? "text-emerald" : ""
                  )}
                  strokeWidth={1.75}
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-5 px-1">
          <div className="mb-1.5 flex items-center gap-1 px-2">
            <button
              type="button"
              onClick={() => setRecentOpen((v) => !v)}
              className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-left text-xs font-semibold tracking-wide text-muted uppercase"
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  !recentOpen && "-rotate-90"
                )}
              />
              Recent Scans
            </button>
            <button
              type="button"
              onClick={() => {
                onNewGrade?.();
                go("new-grade");
              }}
              className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-semibold text-emerald transition-colors hover:bg-emerald/10"
            >
              <Plus className="h-3 w-3" />
              Add new
            </button>
          </div>

          <AnimatePresence initial={false}>
            {recentOpen ? (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="max-h-[min(40vh,320px)] space-y-0.5 overflow-y-auto overflow-x-hidden overscroll-contain"
              >
                {recentGrades.length === 0 ? (
                  <li className="px-3 py-2 text-xs text-muted">
                    No grades yet
                  </li>
                ) : (
                  recentGrades.map((grade) => {
                    const src = gradeDisplaySrc(grade);
                    const selected = selectedGradeId === grade.id;
                    return (
                      <li key={grade.id} className="group/scan relative">
                        <button
                          type="button"
                          onClick={() => {
                            onOpenReport?.(grade);
                            onClose?.();
                          }}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 pr-9 text-left transition-colors",
                            selected
                              ? "bg-emerald/10 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--emerald)_35%,transparent)]"
                              : "hover:bg-card/80"
                          )}
                        >
                          <span
                            className={cn(
                              "relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-gradient-to-b from-surface-muted to-border/60",
                              selected && "ring-2 ring-emerald/40 ring-offset-1 ring-offset-surface"
                            )}
                          >
                            {src ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={src}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {grade.name}
                            </span>
                            <span className="block truncate text-[11px] text-muted">
                              PSA {grade.psa} · {grade.year}
                            </span>
                          </span>
                        </button>
                        {onDeleteGrade ? (
                          <button
                            type="button"
                            aria-label={`Delete ${grade.name}`}
                            title="Delete scan"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onDeleteGrade(grade);
                            }}
                            className="absolute top-1/2 right-1.5 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted opacity-100 transition-colors hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover/scan:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </li>
                    );
                  })
                )}
              </motion.ul>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative space-y-2 p-3" ref={menuRef}>
        {profileMenu}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors hover:bg-card"
        >
          {avatar}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-foreground">
              {displayName}
            </span>
            <span className="block truncate text-xs text-muted">
              {emailLabel}
            </span>
          </span>
        </button>

        <div className="rounded-2xl border border-border bg-card p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              Scan Credits
            </p>
            {isLow ? (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            ) : null}
          </div>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">
            {credits}{" "}
            <span className="text-sm font-semibold text-muted">Remaining</span>
          </p>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-border/80">
            <motion.div
              className={cn(
                "h-full rounded-full",
                credits === 0
                  ? "bg-amber-500"
                  : isLow
                    ? "bg-amber-500"
                    : "bg-emerald"
              )}
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          {isLow ? (
            <p className="mt-2 text-[11px] leading-snug text-amber-700 dark:text-amber-400">
              You&apos;re running low on scan credits.
            </p>
          ) : credits === 0 ? (
            <p className="mt-2 text-[11px] leading-snug text-amber-700 dark:text-amber-400">
              You&apos;re out of scan credits.
            </p>
          ) : usedFromPeak > 0 ? (
            <p className="mt-2 text-[11px] text-muted">
              {usedFromPeak} used · credits never expire
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-muted">
              Credits never expire
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              onClose?.();
              onOpenBilling?.();
            }}
            className="mt-3 w-full rounded-xl bg-royal px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-royal-dark hover:shadow-sm active:scale-[0.98]"
          >
            Buy More Credits
          </button>
        </div>
      </div>
    </aside>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: typeof Settings;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
        destructive
          ? "text-red-600 hover:bg-red-50"
          : "text-foreground hover:bg-card"
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
      {label}
    </button>
  );
}

function UserAvatar({
  photoURL,
  initial,
  name,
  className,
}: {
  photoURL: string | null;
  initial: string;
  name: string;
  className?: string;
}) {
  if (photoURL) {
    return (
      <span
        className={cn(
          "relative inline-block shrink-0 overflow-hidden rounded-full bg-card ring-1 ring-border",
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoURL}
          alt={name}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-emerald/10 text-sm font-bold text-emerald",
        className
      )}
    >
      {initial}
    </span>
  );
}
