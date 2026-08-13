"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/components/auth/auth-provider";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  // Legacy stub route — send into the real grader.
  if (next === "/grade" || next.startsWith("/grade?")) {
    return "/dashboard?view=new-grade";
  }
  return next;
}

const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

function authErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Invalid email or password.";
      case "auth/email-already-in-use":
        return "An account already exists with this email.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/popup-closed-by-user":
        return "Google sign-in was cancelled.";
      case "auth/argument-error":
        return "Google sign-in failed to start. Refresh the page and try again.";
      case "auth/popup-blocked":
        return "Your browser blocked the Google sign-in popup. Allow popups and try again.";
      case "auth/configuration-not-found":
        return "Firebase Auth is not configured yet. Check your Firebase project settings.";
      default:
        return error.message;
    }
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, signIn, signUp, signInWithGoogle } =
    useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const afterAuthPath = safeNextPath(searchParams.get("next"));

  // Already signed in — skip the form and go straight to the app
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(afterAuthPath);
    }
  }, [authLoading, user, router, afterAuthPath]);

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function handleSignIn(values: SignInValues) {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(values.email, values.password);
      router.replace(afterAuthPath);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignUp(values: SignUpValues) {
    setError(null);
    setSubmitting(true);
    try {
      await signUp(values.email, values.password, values.name);
      router.replace(afterAuthPath);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      router.replace(afterAuthPath);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(next: "signin" | "signup") {
    setMode(next);
    setError(null);
  }

  if (authLoading || user) {
    return (
      <div className="flex w-full max-w-md flex-col items-center justify-center rounded-[1.75rem] border border-border bg-surface px-6 py-16 shadow-[0_24px_80px_rgba(17,24,39,0.1)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-emerald" />
        <p className="mt-3 text-sm text-muted">
          {user ? "Taking you to your dashboard…" : "Checking your session…"}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-[0_24px_80px_rgba(17,24,39,0.1)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="relative flex flex-col justify-center px-6 py-10 sm:px-10">
        <div className="mb-8">
          <Link href="/" aria-label="GemMint home">
            <Logo />
          </Link>
        </div>

        <div className="mx-auto w-full max-w-[380px]">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {mode === "signin"
              ? "Welcome back! Enter your details below."
              : "Start grading with professional AI analysis."}
          </p>

          {error ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          ) : null}

          {mode === "signin" ? (
            <form
              className="mt-8 space-y-5"
              onSubmit={signInForm.handleSubmit(handleSignIn)}
            >
              <Field
                label="Email Address"
                type="email"
                autoComplete="email"
                placeholder="Your email address"
                error={signInForm.formState.errors.email?.message}
                {...signInForm.register("email")}
              />

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">
                    Password
                  </span>
                  <button
                    type="button"
                    className="text-sm font-medium text-muted transition-colors hover:text-emerald"
                    onClick={() =>
                      setError(
                        "Password reset will be available soon. Contact support if you need help."
                      )
                    }
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  className={cn(
                    fieldClass,
                    signInForm.formState.errors.password && fieldErrorClass
                  )}
                  {...signInForm.register("password")}
                />
                {signInForm.formState.errors.password?.message ? (
                  <span className="mt-1.5 block text-xs text-red-600">
                    {signInForm.formState.errors.password.message}
                  </span>
                ) : null}
              </div>

              <Button
                className="w-full"
                size="lg"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          ) : (
            <form
              className="mt-8 space-y-5"
              onSubmit={signUpForm.handleSubmit(handleSignUp)}
            >
              <Field
                label="Name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                error={signUpForm.formState.errors.name?.message}
                {...signUpForm.register("name")}
              />
              <Field
                label="Email Address"
                type="email"
                autoComplete="email"
                placeholder="Your email address"
                error={signUpForm.formState.errors.email?.message}
                {...signUpForm.register("email")}
              />
              <Field
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
                error={signUpForm.formState.errors.password?.message}
                {...signUpForm.register("password")}
              />
              <Button
                className="w-full"
                size="lg"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Creating account…" : "Create account"}
              </Button>
            </form>
          )}

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-semibold tracking-wide text-muted uppercase">
              Or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full border-border bg-background hover:bg-card"
            disabled={submitting}
            onClick={handleGoogle}
          >
            <GoogleIcon />
            Google
          </Button>

          <p className="mt-8 text-center text-sm text-muted">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-semibold text-emerald hover:text-emerald-dark"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="font-semibold text-emerald hover:text-emerald-dark"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

const fieldClass =
  "h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-emerald focus:ring-2 focus:ring-emerald/20";

const fieldErrorClass =
  "border-red-300 focus:border-red-400 focus:ring-red-100 dark:border-red-500/50 dark:focus:border-red-400 dark:focus:ring-red-500/20";

function Field({
  label,
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </span>
      <input className={cn(fieldClass, error && fieldErrorClass, className)} {...props} />
      {error ? <span className="mt-1.5 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
