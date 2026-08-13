import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-border">
        <Container className="flex h-16 items-center">
          <Link href="/">
            <Logo />
          </Link>
        </Container>
      </header>
      <Container className="max-w-3xl py-16">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Terms of Service
        </h1>
        <p className="mt-4 text-muted leading-relaxed">
          GemMint provides AI-assisted grade predictions for informational
          purposes. Predictions are not a substitute for official PSA, Beckett,
          or other third-party grading services. Full terms will be published
          before public launch.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block text-sm font-semibold text-emerald hover:text-emerald-dark"
        >
          ← Back to home
        </Link>
      </Container>
    </main>
  );
}
