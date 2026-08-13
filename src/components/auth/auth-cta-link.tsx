"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";

/** Signed-in destination for “Grade” CTAs — opens New Grade in the dashboard. */
export const GRADE_HREF = "/dashboard?view=new-grade";

type AuthCtaLinkProps = Omit<
  React.ComponentPropsWithoutRef<typeof Link>,
  "href"
> & {
  /** Destination after auth. Guests are sent to sign-in first. */
  href?: string;
};

function signInHref(next: string) {
  return `/sign-in?next=${encodeURIComponent(next)}`;
}

export const AuthCtaLink = forwardRef<HTMLAnchorElement, AuthCtaLinkProps>(
  function AuthCtaLink({ href = GRADE_HREF, children, ...props }, ref) {
    const { isSignedIn, sessionHint } = useAuth();
    const signedIn = isSignedIn || Boolean(sessionHint);
    const target = signedIn ? href : signInHref(href);

    return (
      <Link ref={ref} href={target} {...props}>
        {children}
      </Link>
    );
  }
);
