"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/ui/fade-in";
import { FAQ_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface FaqSectionProps {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  items?: readonly { question: string; answer: string }[];
  className?: string;
}

export function FaqSection({
  id = "faq",
  eyebrow = "FAQ",
  title = "Questions collectors ask us.",
  description = "Everything you need to know about GemMint grading predictions.",
  items = FAQ_ITEMS,
  className,
}: FaqSectionProps) {
  return (
    <section
      id={id}
      className={cn("py-16 sm:py-20 lg:py-28", className)}
      aria-labelledby={`${id}-heading`}
    >
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-16 xl:gap-20">
          <FadeIn>
            <div className="lg:sticky lg:top-28">
              <p className="mb-3 text-sm font-semibold tracking-wide text-emerald uppercase">
                {eyebrow}
              </p>
              <h2
                id={`${id}-heading`}
                className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]"
              >
                {title}
              </h2>
              <p className="mt-4 max-w-sm text-base leading-relaxed text-muted">
                {description}
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.08}>
            <Accordion
              type="single"
              collapsible
              className="flex flex-col gap-3"
            >
              {items.map((item, index) => (
                <AccordionItem key={item.question} value={`item-${index}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
