"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  Camera,
  LogOut,
  Mail,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useCredits } from "@/components/auth/credits-provider";
import { Button } from "@/components/ui/button";
import { FREE_SCAN_CREDITS, formatUsd } from "@/lib/scan-packs";
import { cn } from "@/lib/utils";

interface SettingsViewProps {
  onOpenBilling?: () => void;
}

export function SettingsView({ onOpenBilling }: SettingsViewProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const {
    credits,
    totalPurchased,
    totalUsed,
    purchases,
    usages,
  } = useCredits();
  const displayName =
    user?.displayName || user?.email?.split("@")[0] || "Collector";
  const initial = displayName.charAt(0).toUpperCase();
  const photoURL = user?.photoURL ?? null;

  const [displayNameDraft, setDisplayNameDraft] = useState(displayName);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [reportReady, setReportReady] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [saved, setSaved] = useState(false);

  function saveProfile() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  return (
    <div className="mr-auto flex w-full max-w-3xl flex-col gap-6 pb-10 text-left">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-sm text-muted">
          Manage your profile, notifications, and scan credits.
        </p>
      </motion.div>

      {/* Profile */}
      <section className="rounded-[1.5rem] border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-emerald" />
          <h3 className="text-sm font-bold text-foreground">Profile</h3>
        </div>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            {photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoURL}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="h-20 w-20 rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald/10 text-2xl font-bold text-emerald ring-1 ring-border">
                {initial}
              </span>
            )}
            <span className="absolute -right-1 -bottom-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm">
              <Camera className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Display name
              </span>
              <input
                value={displayNameDraft}
                onChange={(e) => setDisplayNameDraft(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none transition-colors focus:border-emerald focus:ring-2 focus:ring-emerald/20"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Email
              </span>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  value={user?.email ?? ""}
                  readOnly
                  className="h-11 w-full rounded-xl border border-border bg-card pr-3 pl-10 text-sm text-muted outline-none"
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                Managed by your sign-in provider.
              </p>
            </label>
            <div className="flex items-center gap-3">
              <Button onClick={saveProfile}>Save changes</Button>
              {saved ? (
                <span className="text-sm font-medium text-emerald">Saved</span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Credits */}
      <section className="rounded-[1.5rem] border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald" />
            <h3 className="text-sm font-bold text-foreground">Credits</h3>
          </div>
          <Button size="sm" className="w-full sm:w-auto" onClick={onOpenBilling}>
            Buy More Credits
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <StatTile label="Current Balance" value={String(credits)} accent />
          <StatTile
            label="Credits Remaining"
            value={String(credits)}
          />
          <StatTile
            label="Lifetime Credits Purchased"
            value={String(totalPurchased)}
          />
          <StatTile
            label="Lifetime Credits Used"
            value={String(totalUsed)}
          />
        </div>
        <p className="mt-3 text-xs text-muted">
          New accounts include {FREE_SCAN_CREDITS} free professional scan.
          Credits never expire.
        </p>

        <div className="mt-6">
          <h4 className="text-sm font-bold text-foreground">
            Purchase History
          </h4>
          {purchases.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted">
              No purchases yet. Buy a pack when you&apos;re ready to grade more
              cards.
            </p>
          ) : (
            <>
              <div className="mt-3 space-y-2 sm:hidden">
                {purchases.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-border bg-card px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {p.packName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">{p.date}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald/10 px-2 py-0.5 text-[11px] font-semibold text-emerald capitalize">
                        {p.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="tabular-nums text-muted">
                        {p.credits} credits
                      </span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatUsd(p.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 hidden overflow-x-auto rounded-2xl border border-border sm:block">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card text-[11px] font-semibold tracking-wide text-muted uppercase">
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Pack</th>
                      <th className="px-3 py-2.5">Credits</th>
                      <th className="px-3 py-2.5">Amount</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 text-muted">{p.date}</td>
                        <td className="px-3 py-3 font-medium text-foreground">
                          {p.packName}
                        </td>
                        <td className="px-3 py-3 tabular-nums">{p.credits}</td>
                        <td className="px-3 py-3 tabular-nums">
                          {formatUsd(p.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[11px] font-semibold text-emerald capitalize">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-bold text-foreground">
            Report History
          </h4>
          {usages.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted">
              Completed grading reports that used a credit will appear here.
            </p>
          ) : (
            <>
              <div className="mt-3 space-y-2 sm:hidden">
                {usages.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {u.cardName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">{u.date}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      −1
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 hidden overflow-x-auto rounded-2xl border border-border sm:block">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card text-[11px] font-semibold tracking-wide text-muted uppercase">
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Card</th>
                      <th className="px-4 py-2.5">Credit Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usages.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 text-muted">{u.date}</td>
                        <td className="px-3 py-3 font-medium text-foreground">
                          {u.cardName}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-foreground">
                          1
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-[1.5rem] border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-emerald" />
          <h3 className="text-sm font-bold text-foreground">Notifications</h3>
        </div>
        <div className="mt-4 divide-y divide-border">
          <ToggleRow
            title="Email notifications"
            description="Account and security alerts"
            checked={emailNotifs}
            onChange={setEmailNotifs}
          />
          <ToggleRow
            title="Report ready"
            description="When a grading report finishes"
            checked={reportReady}
            onChange={setReportReady}
          />
          <ToggleRow
            title="Product updates"
            description="Occasional tips and feature news"
            checked={marketing}
            onChange={setMarketing}
          />
        </div>
      </section>

      {/* Privacy */}
      <section className="rounded-[1.5rem] border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald" />
          <h3 className="text-sm font-bold text-foreground">Privacy</h3>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Card images and reports are stored in your GemMint account (Firestore).
          Credits and Recent Scans sync across devices when you&apos;re signed in.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" asChild>
            <a href="/privacy" target="_blank" rel="noreferrer">
              Privacy Policy
            </a>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <a href="/terms" target="_blank" rel="noreferrer">
              Terms of Use
            </a>
          </Button>
        </div>
      </section>

      {/* Sign out */}
      <section className="rounded-[1.5rem] border border-red-100 bg-red-50/50 p-5 sm:p-6">
        <h3 className="text-sm font-bold text-foreground">Session</h3>
        <p className="mt-1 text-sm text-muted">
          Sign out of GemMint on this device.
        </p>
        <Button
          variant="secondary"
          className="mt-4 border-red-200 text-red-600 hover:bg-red-50"
          onClick={() => void handleSignOut()}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        accent
          ? "border-emerald/20 bg-emerald/5"
          : "border-border bg-card"
      )}
    >
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          accent ? "text-emerald" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-emerald" : "bg-border"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-surface shadow-sm transition-transform",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}
