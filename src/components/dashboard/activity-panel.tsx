"use client";

import { motion } from "framer-motion";
import {
  CreditCard,
  FileText,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import {
  ACTIVITY_FEED,
  FUTURE_FEATURES,
  type ActivityItem,
} from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

const TYPE_ICON = {
  report: FileText,
  payment: CreditCard,
  suggestion: Lightbulb,
  feature: Sparkles,
} as const;

const TYPE_STYLE = {
  report: "bg-emerald/10 text-emerald",
  payment: "bg-royal/10 text-royal",
  suggestion: "bg-amber-50 text-amber-700",
  feature: "bg-card text-muted",
} as const;

export function ActivityPanel() {
  const reports = ACTIVITY_FEED.filter((a) => a.type === "report");
  const suggestions = ACTIVITY_FEED.filter((a) => a.type === "suggestion");
  const payments = ACTIVITY_FEED.filter((a) => a.type === "payment");

  return (
    <aside className="hidden w-[300px] shrink-0 flex-col border-l border-border bg-surface xl:flex">
      <div className="border-b border-border px-5 py-5">
        <h2 className="text-sm font-bold tracking-tight text-foreground">
          Today&apos;s Activity
        </h2>
        <p className="mt-0.5 text-xs text-muted">Live workspace signals</p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        <PanelBlock title="Recent Reports">
          {reports.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </PanelBlock>

        <PanelBlock title="Submission Suggestions">
          {suggestions.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </PanelBlock>

        <PanelBlock title="Latest Payments">
          {payments.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </PanelBlock>

        <PanelBlock title="Upcoming Features">
          <ul className="space-y-2">
            {FUTURE_FEATURES.slice(0, 4).map((feature) => (
              <li
                key={feature.title}
                className="rounded-xl border border-border bg-card px-3 py-2.5"
              >
                <p className="text-xs font-semibold text-foreground">
                  {feature.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                  {feature.description}
                </p>
              </li>
            ))}
          </ul>
        </PanelBlock>
      </div>
    </aside>
  );
}

function PanelBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2.5 px-1 text-[11px] font-semibold tracking-wide text-muted uppercase">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = TYPE_ICON[item.type];
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 transition-colors hover:bg-card"
    >
      <span
        className={cn(
          "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          TYPE_STYLE[item.type]
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold text-foreground">{item.label}</p>
          <span className="shrink-0 text-[10px] text-muted">{item.time}</span>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted">{item.detail}</p>
      </div>
    </motion.div>
  );
}
