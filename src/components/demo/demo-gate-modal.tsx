"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Layers, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoMode } from "@/components/demo/demo-provider";

export function DemoGateModal() {
  const { gateOpen, gateMessage, closeGate } = useDemoMode();

  return (
    <AnimatePresence>
      {gateOpen ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-foreground/45 backdrop-blur-[2px]"
            aria-label="Close"
            onClick={closeGate}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-gate-title"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="relative z-10 w-full max-w-md rounded-t-[1.5rem] border border-border bg-surface p-5 shadow-[0_24px_80px_rgba(17,24,39,0.2)] sm:rounded-[1.5rem] sm:p-6"
          >
            <button
              type="button"
              onClick={closeGate}
              className="absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-card hover:text-foreground"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>

            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald/10 text-emerald">
              <Layers className="h-5 w-5" />
            </span>
            <h2
              id="demo-gate-title"
              className="mt-4 text-xl font-bold tracking-tight text-foreground"
            >
              Ready to build your collection?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {gateMessage}
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <Button className="w-full sm:flex-1" asChild>
                <Link
                  href="/sign-in?next=/dashboard?view=new-grade"
                  onClick={closeGate}
                >
                  Continue with Google
                </Link>
              </Button>
              <Button
                variant="secondary"
                className="w-full sm:flex-1"
                onClick={closeGate}
              >
                Keep exploring demo
              </Button>
            </div>
            <p className="mt-3 text-center text-[11px] text-muted">
              Demo data never touches a real account.
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
