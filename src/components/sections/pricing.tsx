import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { AuthCtaLink } from "@/components/auth/auth-cta-link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/ui/fade-in";
import { SectionHeader } from "@/components/ui/section-header";
import {
  FREE_SCAN_CREDITS,
  PROFESSIONAL_REPORT,
  SCAN_PACKS,
  costPerScan,
  formatUsd,
  type ScanPack,
} from "@/lib/scan-packs";
import { cn } from "@/lib/utils";

interface PricingSectionProps {
  id?: string;
  className?: string;
  showHeader?: boolean;
  /** full = pricing page detail; teaser = landing summary */
  variant?: "full" | "teaser";
}

export function PricingSection({
  id = "pricing",
  className,
  showHeader = true,
  variant = "full",
}: PricingSectionProps) {
  if (variant === "teaser") {
    return <PricingTeaser id={id} className={className} />;
  }

  return (
    <section
      id={id}
      className={cn("py-16 sm:py-20 lg:py-28", className)}
      aria-labelledby="pricing-heading"
    >
      <Container>
        {showHeader ? (
          <FadeIn>
            <SectionHeader
              id="pricing-heading"
              eyebrow="Pricing"
              title="Scan credit packs"
              description="No subscriptions. Buy a single report or a credit pack — credits never expire. Every new account includes 1 free professional scan."
            />
          </FadeIn>
        ) : null}

        <FadeIn delay={0.05} className={cn(showHeader && "mt-10 sm:mt-12")}>
          <ProfessionalReportCard />
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="mt-10 mb-2 flex items-end justify-between gap-4 sm:mt-12">
            <div>
              <p className="text-xs font-semibold tracking-wide text-royal uppercase">
                Credit packs
              </p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Need more than one report?
              </h3>
            </div>
            <p className="hidden text-sm text-muted sm:block">
              One-time purchase · No subscription
            </p>
          </div>
        </FadeIn>

        <div className="relative -mx-5 mt-5 sm:-mx-6 sm:mt-6 lg:mx-0">
          <div
            className={cn(
              "flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pt-3 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 sm:px-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0 lg:pt-0 lg:pb-0 [&::-webkit-scrollbar]:hidden",
              "items-stretch"
            )}
          >
            {SCAN_PACKS.map((pack, index) => (
              <FadeIn
                key={pack.id}
                delay={0.08 + index * 0.06}
                className="w-[min(82vw,300px)] shrink-0 snap-center sm:w-[min(70vw,320px)] lg:h-full lg:w-auto lg:min-w-0 lg:snap-align-none"
              >
                <PackArticle pack={pack} />
              </FadeIn>
            ))}
          </div>
        </div>

        {showHeader ? (
          <FadeIn delay={0.2}>
            <p className="mt-8 text-center text-sm text-muted sm:mt-10">
              New accounts include {FREE_SCAN_CREDITS} free AI grading report —
              no credit card required. All options are one-time purchases with
              no subscription.
            </p>
          </FadeIn>
        ) : null}
      </Container>
    </section>
  );
}

/** Compact landing summary — full detail lives on /pricing. */
function PricingTeaser({
  id,
  className,
}: {
  id?: string;
  className?: string;
}) {
  const rows = [
    {
      name: PROFESSIONAL_REPORT.name,
      detail: "1 report · one-time",
      price: formatUsd(PROFESSIONAL_REPORT.price),
      highlight: false,
    },
    {
      name: "Starter",
      detail: "10 credits",
      price: formatUsd(SCAN_PACKS[0].price),
      highlight: false,
    },
    {
      name: "Collector",
      detail: "25 credits · best value",
      price: formatUsd(SCAN_PACKS[1].price),
      highlight: true,
    },
    {
      name: "Dealer",
      detail: "100 credits",
      price: formatUsd(SCAN_PACKS[2].price),
      highlight: false,
    },
  ];

  return (
    <section
      id={id}
      className={cn("py-16 sm:py-20 lg:py-28", className)}
      aria-labelledby="pricing-heading"
    >
      <Container>
        <FadeIn>
          <SectionHeader
            id="pricing-heading"
            eyebrow="Pricing"
            title="Simple, one-time pricing"
            description="No subscriptions. Start with a single report or buy credits in packs — they never expire."
          />
        </FadeIn>

        <FadeIn delay={0.1} className="mx-auto mt-10 max-w-xl sm:mt-12">
          <div className="overflow-hidden rounded-[1.5rem] border border-border bg-surface">
            <ul className="divide-y divide-border">
              {rows.map((row) => (
                <li
                  key={row.name}
                  className={cn(
                    "flex items-center justify-between gap-4 px-5 py-4 sm:px-6",
                    row.highlight && "bg-emerald/[0.04]"
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{row.name}</p>
                    <p className="mt-0.5 text-sm text-muted">{row.detail}</p>
                  </div>
                  <p
                    className={cn(
                      "shrink-0 text-lg font-bold tabular-nums tracking-tight",
                      row.highlight ? "text-emerald" : "text-foreground"
                    )}
                  >
                    {row.price}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/pricing">
                View full pricing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <AuthCtaLink>Grade My Card</AuthCtaLink>
            </Button>
          </div>

          <p className="mt-5 text-center text-sm text-muted">
            New accounts include {FREE_SCAN_CREDITS} free report — no card
            required.
          </p>
        </FadeIn>
      </Container>
    </section>
  );
}

function ProfessionalReportCard() {
  const pack = PROFESSIONAL_REPORT;

  return (
    <article
      id={pack.id}
      className="scroll-mt-28 overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-[0_8px_30px_rgba(17,24,39,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
    >
      <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-b border-border p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
              One-time purchase
            </span>
            <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted uppercase">
              No subscription
            </span>
          </div>
          <h3 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {pack.name}
          </h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted sm:text-base">
            {pack.description}
          </p>
          <div className="mt-6 flex flex-wrap items-end gap-3">
            <span className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {formatUsd(pack.price)}
            </span>
            <span className="mb-1.5 text-sm font-medium text-muted">
              for 1 professional report
            </span>
          </div>
          <AuthCtaLink className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald px-6 text-sm font-semibold text-white transition-colors hover:bg-emerald-dark active:scale-[0.98] sm:w-auto sm:px-8">
            {pack.cta}
          </AuthCtaLink>
        </div>

        <div className="bg-card/60 p-6 sm:p-8">
          <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
            Includes
          </p>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-1">
            {pack.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2.5 text-sm text-foreground"
              >
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function PackArticle({ pack }: { pack: ScanPack }) {
  return (
    <article
      id={pack.id}
      className={cn(
        "relative flex h-full flex-col rounded-[1.75rem] bg-surface-muted p-2 sm:p-2.5 scroll-mt-28",
        pack.highlighted && "lg:-mt-2 lg:mb-[-0.5rem]",
        pack.badge && "mt-1.5 lg:mt-0"
      )}
    >
      {pack.badge ? (
        <span className="absolute inset-x-0 top-0 z-10 mx-auto w-fit -translate-y-1/2 whitespace-nowrap rounded-full bg-emerald px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase shadow-sm">
          {pack.badge}
        </span>
      ) : null}

      <div
        className={cn(
          "rounded-[1.35rem] bg-surface p-5 sm:p-6 lg:p-7",
          pack.highlighted &&
            "shadow-[0_16px_40px_rgba(22,163,74,0.14)] ring-1 ring-emerald/25 dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
        )}
      >
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          {pack.name}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {pack.description}
        </p>

        <div className="mt-5 flex items-baseline gap-1.5 sm:mt-6">
          <span className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {formatUsd(pack.price)}
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold text-emerald">
          {pack.credits} scan credits
        </p>
        <p className="text-xs text-muted">
          {formatUsd(costPerScan(pack))} per scan · One-time purchase
        </p>

        <AuthCtaLink
          className={cn(
            "mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] sm:mt-6",
            pack.highlighted
              ? "bg-emerald text-white shadow-[0_10px_24px_rgba(22,163,74,0.35)] hover:bg-emerald-dark"
              : "bg-border/70 text-foreground hover:bg-border"
          )}
        >
          {pack.cta}
          {pack.id === "dealer" ? <ArrowRight className="h-4 w-4" /> : null}
        </AuthCtaLink>
      </div>

      <div className="flex flex-1 flex-col px-4 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-6">
        <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
          Includes
        </p>
        <ul className="mt-3 space-y-3 sm:mt-4 sm:space-y-3.5">
          {pack.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-3 text-sm text-foreground"
            >
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald text-white">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
