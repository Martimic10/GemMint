"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/components/auth/auth-provider";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { isSignedIn, loading, sessionHint } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Show Dashboard whenever Firebase says we're in, or while restoring a
  // previously saved session hint (avoids a stuck Sign In button).
  const showDashboard = isSignedIn || Boolean(sessionHint);
  const showAuthSkeleton = loading && !showDashboard;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:px-6 sm:pt-5">
      <div
        className={cn(
          "pointer-events-auto relative w-full max-w-5xl rounded-2xl border transition-all duration-300",
          scrolled
            ? "border-border/80 bg-background/90 shadow-[0_8px_30px_rgba(17,24,39,0.08)] backdrop-blur-md dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
            : "border-border/60 bg-background/80 shadow-[0_4px_20px_rgba(17,24,39,0.04)] backdrop-blur-sm"
        )}
      >
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:h-16 sm:px-5">
          <Link href="/" aria-label="GemMint home" className="relative z-10 shrink-0">
            <Logo />
          </Link>

          <nav
            className="hidden items-center gap-7 md:flex"
            aria-label="Primary"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {showAuthSkeleton ? (
              <div className="h-9 w-[5.5rem] animate-pulse rounded-xl bg-card" />
            ) : showDashboard ? (
              <>
                <Button size="sm" variant="secondary" asChild>
                  <Link href="/demo">View Demo</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="secondary" asChild>
                  <Link href="/demo">View Demo</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border md:hidden"
            >
              <div className="flex flex-col gap-1 px-3 py-3">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-xl px-3 py-3 text-base font-medium text-foreground hover:bg-card"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
                  {showAuthSkeleton ? (
                    <div className="h-11 animate-pulse rounded-2xl bg-card" />
                  ) : showDashboard ? (
                    <>
                      <Button variant="secondary" asChild>
                        <Link href="/demo" onClick={() => setOpen(false)}>
                          View Demo
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link href="/dashboard" onClick={() => setOpen(false)}>
                          Dashboard
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="secondary" asChild>
                        <Link href="/demo" onClick={() => setOpen(false)}>
                          View Demo
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link href="/sign-in" onClick={() => setOpen(false)}>
                          Sign In
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
