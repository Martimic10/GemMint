"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FUTURE_FEATURES, type NavId } from "@/lib/dashboard-data";

const COPY: Partial<
  Record<
    NavId,
    { title: string; description: string; feature?: (typeof FUTURE_FEATURES)[number]["title"] }
  >
> = {
  collection: {
    title: "Collection Manager",
    description:
      "Organize every card you scan with binders, tags, and live estimated values.",
    feature: "Collection Manager",
  },
  reports: {
    title: "Reports Library",
    description:
      "Browse printable PDF reports, heatmaps, and submission recommendations in one place.",
    feature: "Population Reports",
  },
  orders: {
    title: "Orders & Submissions",
    description:
      "Track lab shipments, turnaround times, and final slab results as they come in.",
    feature: "Submission Tracker",
  },
  billing: {
    title: "Billing",
    description:
      "Manage credits, invoices, and plan upgrades. Stripe checkout lands next.",
  },
  api: {
    title: "Developer API",
    description:
      "Programmatic grading for dealers and platforms. Keys, webhooks, and docs coming soon.",
  },
  settings: {
    title: "Settings",
    description:
      "Profile, notification preferences, and workspace defaults will live here.",
  },
};

interface ComingSoonViewProps {
  view: NavId;
  onNewGrade: () => void;
}

export function ComingSoonView({ view, onNewGrade }: ComingSoonViewProps) {
  const meta = COPY[view];
  if (!meta) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl"
    >
      <div className="rounded-[1.75rem] border border-border bg-surface p-8 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-10">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          {meta.title}
        </h2>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
          {meta.description}
        </p>
        <Button className="mt-6" onClick={onNewGrade}>
          Grade a card meanwhile
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {FUTURE_FEATURES.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <p className="text-sm font-bold text-foreground">{feature.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
