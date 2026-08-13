"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";

interface AuthAwareFooterLinkProps {
  label: string;
  href: string;
  className?: string;
}

/** Swaps Sign in → Dashboard when a session is restored. */
export function AuthAwareFooterLink({
  label,
  href,
  className,
}: AuthAwareFooterLinkProps) {
  const { isSignedIn, sessionHint } = useAuth();
  const isSignIn = href === "/sign-in" || href.startsWith("/sign-in?");
  const signedIn = isSignedIn || Boolean(sessionHint);

  if (signedIn && isSignIn) {
    return (
      <Link href="/dashboard" className={className}>
        Dashboard
      </Link>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
