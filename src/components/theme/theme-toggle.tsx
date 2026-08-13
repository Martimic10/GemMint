"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme, ready } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={!ready}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-foreground disabled:opacity-60",
        className
      )}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-emerald" />
      ) : (
        <Moon className="h-4 w-4 text-royal" />
      )}
      <span className="tabular-nums">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
