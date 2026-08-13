"use client";

import { motion } from "framer-motion";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onStart: () => void;
}

export function EmptyState({ onStart }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center rounded-[1.75rem] border border-border bg-surface px-6 py-16 text-center shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:px-10"
    >
      <div className="relative mb-8">
        <div className="absolute inset-0 scale-150 rounded-full bg-emerald/10 blur-2xl" />
        <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] border border-border bg-card shadow-sm">
          <div className="flex h-16 w-12 rotate-[-6deg] items-center justify-center rounded-lg border border-border bg-surface shadow-md">
            <ScanLine className="h-6 w-6 text-emerald" />
          </div>
          <div className="absolute -right-2 -bottom-1 flex h-14 w-10 rotate-[8deg] items-center justify-center rounded-lg border border-border bg-surface shadow-md">
            <span className="text-[10px] font-bold text-royal">PSA</span>
          </div>
        </div>
      </div>

      <h2 className="text-3xl font-bold tracking-tight text-foreground">
        Grade Your First Card
      </h2>
      <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
        Upload your first trading card and receive a professional AI grading
        report in under 30 seconds.
      </p>
      <Button size="lg" className="mt-8" onClick={onStart}>
        Start Grading
      </Button>
    </motion.div>
  );
}
