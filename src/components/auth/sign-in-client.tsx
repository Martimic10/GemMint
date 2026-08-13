"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { AuthForm } from "@/components/auth/auth-form";

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  if (next === "/grade" || next.startsWith("/grade?")) {
    return "/dashboard?view=new-grade";
  }
  return next;
}

function AuthLoading() {
  return (
    <div className="flex min-h-[min(720px,calc(100svh-2rem))] w-full items-center justify-center rounded-[1.75rem] border border-border bg-surface shadow-[0_24px_80px_rgba(17,24,39,0.1)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-emerald" />
    </div>
  );
}

function SignInRedirect({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));

  useEffect(() => {
    if (!loading && user) {
      router.replace(next);
    }
  }, [loading, user, router, next]);

  if (loading) {
    return <AuthLoading />;
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
}

export function SignInClient() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <SignInRedirect>
        <AuthForm />
      </SignInRedirect>
    </Suspense>
  );
}
