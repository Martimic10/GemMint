"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BadgeDollarSign,
  Layers,
  PiggyBank,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  cardsGraded: number;
  averageGrade: number;
  moneySaved: number;
  collectionValue: number;
}

export function StatsCards({
  cardsGraded,
  averageGrade,
  moneySaved,
  collectionValue,
}: StatsCardsProps) {
  const stats: {
    key: string;
    label: string;
    hint: string;
    delta: string;
    icon: LucideIcon;
    value: number;
    decimals?: number;
    prefix?: string;
    accent: "emerald" | "royal";
    fill: number;
  }[] = [
    {
      key: "graded",
      label: "Cards Graded",
      hint: "Lifetime lab inspections",
      delta: cardsGraded > 0 ? "Your collection" : "Grade your first card",
      icon: Layers,
      value: cardsGraded,
      accent: "emerald",
      fill: Math.min(100, cardsGraded * 12),
    },
    {
      key: "avg",
      label: "Avg Predicted Grade",
      hint: "Across completed reports",
      delta: "PSA scale",
      icon: Sparkles,
      value: averageGrade,
      decimals: 1,
      accent: "royal",
      fill: Math.min(100, averageGrade * 10),
    },
    {
      key: "saved",
      label: "Money Saved",
      hint: "Avoided submission fees",
      delta: "On hold / sell-raw calls",
      icon: PiggyBank,
      value: moneySaved,
      prefix: "$",
      accent: "emerald",
      fill: Math.min(100, moneySaved / 2),
    },
    {
      key: "value",
      label: "Collection Value",
      hint: "Estimated slabbed range",
      delta: "From AI market estimates",
      icon: BadgeDollarSign,
      value: collectionValue,
      prefix: "$",
      accent: "royal",
      fill: Math.min(100, collectionValue / 100),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isEmerald = stat.accent === "emerald";

        return (
          <motion.article
            key={stat.key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.05,
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative overflow-hidden rounded-[1.35rem] border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                  <AnimatedNumber
                    value={stat.value}
                    prefix={stat.prefix}
                    decimals={stat.decimals}
                  />
                </p>
                <p className="mt-1 text-xs text-muted">{stat.hint}</p>
              </div>
              <span
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-2xl",
                  isEmerald
                    ? "bg-emerald/10 text-emerald"
                    : "bg-royal/10 text-royal"
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald">
                <ArrowUpRight className="h-3.5 w-3.5" />
                {stat.delta}
              </span>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-card">
              <div
                className={cn(
                  "h-full rounded-full",
                  isEmerald ? "bg-emerald" : "bg-royal"
                )}
                style={{ width: `${Math.max(4, Math.min(100, stat.fill))}%` }}
              />
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
