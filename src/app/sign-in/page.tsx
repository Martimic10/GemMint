import type { Metadata } from "next";
import { SignInClient } from "@/components/auth/sign-in-client";
import { ForceLightTheme } from "@/components/theme/theme-provider";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your GemMint account.",
};

export default function SignInPage() {
  return (
    <ForceLightTheme>
      <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-6 sm:px-6">
        <div className="relative w-full max-w-md">
          <SignInClient />
        </div>
      </main>
    </ForceLightTheme>
  );
}
