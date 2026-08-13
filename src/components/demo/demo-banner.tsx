"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoBannerProps {
  className?: string;
}

export function DemoBanner({ className }: DemoBannerProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-b border-emerald/20 bg-emerald/10 px-3 py-2 sm:px-4",
        className
      )}
    >
      <p className="inline-flex items-center gap-2 text-xs font-semibold text-emerald sm:text-sm">
        <Sparkles className="h-3.5 w-3.5 shrink-0" />
        <span>
          Demo Mode · Read only
          <span className="hidden font-medium text-emerald/80 sm:inline">
            {" "}
            — curated sample collection, not your account
          </span>
        </span>
      </p>
      <Link
        href="/sign-in?next=/dashboard?view=new-grade"
        className="inline-flex items-center rounded-lg bg-emerald px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-dark"
      >
        Create Your Collection
      </Link>
    </div>
  );
}
