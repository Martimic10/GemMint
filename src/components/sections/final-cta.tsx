"use client";

import Image from "next/image";
import { ArrowRight, ScanLine } from "lucide-react";
import { AuthCtaLink, GRADE_HREF } from "@/components/auth/auth-cta-link";
import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/ui/fade-in";
import { cn } from "@/lib/utils";

/**
 * Sharp HTML/CSS CTA — desktop side-by-side, mobile stacked & thumb-friendly.
 */
export function FinalCta() {
  return (
    <section
      className="pb-12 pt-6 sm:pb-16 sm:pt-8 lg:pb-24 lg:pt-12"
      aria-labelledby="cta-heading"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div
            className={cn(
              "relative overflow-hidden rounded-[1.35rem] sm:rounded-[2rem]",
              "bg-[#0b1220] text-white",
              "border border-white/10"
            )}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(22,163,74,0.1),transparent_45%)] sm:bg-[radial-gradient(ellipse_at_80%_50%,rgba(22,163,74,0.08),transparent_55%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 hidden opacity-[0.35] sm:block"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
                backgroundSize: "18px 18px",
                maskImage:
                  "linear-gradient(90deg, transparent 0%, black 40%, black 100%)",
              }}
            />

            <DecorativeCards />

            <div className="relative grid items-center gap-6 px-5 py-8 sm:gap-10 sm:px-10 sm:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:px-14 lg:py-16">
              <div className="relative z-10 max-w-xl text-center sm:text-left">
                <h2
                  id="cta-heading"
                  className="text-[1.75rem] font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]"
                >
                  Know Before You{" "}
                  <span className="text-emerald">Grade.</span>
                </h2>
                <p className="mx-auto mt-3 max-w-[22rem] text-[15px] leading-relaxed text-white/70 sm:mx-0 sm:mt-4 sm:max-w-none sm:text-lg">
                  Professional AI card grading powered by advanced computer
                  vision — predict PSA and Beckett in under 30 seconds.
                </p>

                <MobileCardStrip />
              </div>

              <div className="relative z-10 w-full">
                <div
                  className={cn(
                    "flex flex-col gap-2.5 rounded-[1.25rem] border border-white/15 bg-[#0a0f1a]/95 p-2.5",
                    "sm:flex-row sm:items-center sm:gap-3 sm:rounded-[1.35rem] sm:bg-[#0a0f1a]/80 sm:p-3.5 sm:backdrop-blur-sm"
                  )}
                >
                  {/* Primary first on mobile for easier thumbs */}
                  <AuthCtaLink
                    href={GRADE_HREF}
                    className={cn(
                      "order-1 inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald px-5 text-[15px] font-semibold text-white",
                      "sm:order-2 sm:h-14 sm:w-auto sm:px-6 sm:text-sm",
                      "transition-colors hover:bg-emerald-dark active:scale-[0.98]",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald"
                    )}
                  >
                    Grade Your First Card
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </AuthCtaLink>

                  <AuthCtaLink
                    href={GRADE_HREF}
                    className={cn(
                      "order-2 flex w-full min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-[#111827] px-4 py-3",
                      "sm:order-1 sm:py-3.5",
                      "transition-colors hover:border-white/20 hover:bg-[#151d2e]",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald"
                    )}
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald/15 text-emerald sm:h-11 sm:w-11">
                      <ScanLine className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="block text-sm font-semibold text-white sm:text-base">
                        Start grading
                      </span>
                      <span className="block text-xs text-white/55 sm:text-sm">
                        Upload front and back
                      </span>
                    </span>
                  </AuthCtaLink>
                </div>
                <p className="mt-3 text-center text-xs text-white/45 sm:text-left">
                  Or{" "}
                  <a
                    href="/demo"
                    className="font-semibold text-emerald underline-offset-2 hover:underline"
                  >
                    view the live demo
                  </a>{" "}
                  — no account needed.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}

/** In-flow card strip — mobile only, sits under the copy. */
function MobileCardStrip() {
  const cards = [
    { src: "/kengriffey.jpg", rotate: "-rotate-6" },
    { src: "/kobebryant-rookie.jpg", rotate: "rotate-[2deg]" },
    { src: "/bojackson-rookie.jpg", rotate: "rotate-6" },
  ] as const;

  return (
    <div
      aria-hidden
      className="mt-6 flex items-end justify-center gap-2 sm:hidden"
    >
      {cards.map((card, i) => (
        <div
          key={card.src}
          className={cn(
            "overflow-hidden rounded-lg border border-white/15 bg-white/5",
            "shadow-[0_6px_16px_rgba(0,0,0,0.3)]",
            card.rotate,
            i === 1 ? "h-[4.5rem] w-[3.25rem]" : "h-14 w-10 opacity-70"
          )}
        >
          <Image
            src={card.src}
            alt=""
            width={80}
            height={112}
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

function DecorativeCards() {
  const cards = [
    {
      src: "/kengriffey.jpg",
      alt: "",
      className:
        "right-[4%] top-[8%] w-[18%] rotate-[12deg] opacity-50 sm:opacity-60",
    },
    {
      src: "/bojackson-rookie.jpg",
      alt: "",
      className:
        "right-[22%] bottom-[6%] w-[16%] -rotate-[8deg] opacity-40 sm:opacity-50",
    },
    {
      src: "/kobebryant-rookie.jpg",
      alt: "",
      className:
        "right-[2%] bottom-[10%] w-[15%] rotate-[6deg] opacity-35 sm:opacity-45",
    },
  ] as const;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden overflow-hidden sm:block"
    >
      {cards.map((card) => (
        <div
          key={card.src}
          className={cn(
            "absolute overflow-hidden rounded-md border border-white/10 bg-white/5 shadow-[0_8px_24px_rgba(0,0,0,0.35)]",
            card.className
          )}
        >
          <Image
            src={card.src}
            alt={card.alt}
            width={200}
            height={280}
            className="h-auto w-full object-cover"
          />
        </div>
      ))}
      <div className="absolute inset-y-0 right-0 w-[55%] bg-gradient-to-l from-[#0b1220]/30 via-[#0b1220]/55 to-transparent" />
    </div>
  );
}
