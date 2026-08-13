"use client";

import { motion } from "framer-motion";
import { Lightbulb, TrendingUp, Wallet } from "lucide-react";
import { DASHBOARD_INSIGHTS } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

const ICONS = [Lightbulb, Wallet, TrendingUp] as const;

export function InsightCards() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          AI Insights
        </h2>
        <p className="mt-0.5 text-sm text-muted">
          Intelligent signals from your recent grading activity
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {DASHBOARD_INSIGHTS.map((insight, index) => {
          const Icon = ICONS[index % ICONS.length];
          return (
            <motion.article
              key={insight.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.1 + index * 0.06,
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -3 }}
              className="rounded-2xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] transition-shadow hover:shadow-[0_8px_30px_rgba(17,24,39,0.06)]"
            >
              <span
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-xl",
                  insight.tone === "emerald" && "bg-emerald/10 text-emerald",
                  insight.tone === "royal" && "bg-royal/10 text-royal",
                  insight.tone === "neutral" && "bg-card text-foreground"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 text-sm font-bold text-foreground">
                {insight.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {insight.body}
              </p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
