import Link from "next/link";
import { AuthAwareFooterLink } from "@/components/auth/auth-aware-footer-link";
import { GitHubIcon, LinkedInIcon, XIcon } from "@/components/icons/social";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Container } from "@/components/ui/container";
import { FOOTER_LINKS } from "@/lib/constants";

const SOCIAL = [
  { label: "X", href: "https://x.com/gemmint", icon: XIcon },
  { label: "LinkedIn", href: "https://linkedin.com/company/gemmint", icon: LinkedInIcon },
  { label: "GitHub", href: "https://github.com/gemmint", icon: GitHubIcon },
] as const;

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold tracking-wide text-foreground uppercase">
        {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            {link.href.startsWith("/") ? (
              <AuthAwareFooterLink
                label={link.label}
                href={link.href}
                className="text-sm text-muted transition-colors hover:text-foreground"
              />
            ) : (
              <a
                href={link.href}
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <Container className="pb-10 pt-6 lg:pb-12 lg:pt-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" aria-label="GemMint home">
              <Logo />
            </Link>
            <p className="mt-4 max-w-[220px] text-sm leading-relaxed text-muted">
              GemMint is the professional AI grading platform for serious card
              collectors.
            </p>
          </div>

          <FooterColumn title="Product" links={FOOTER_LINKS.product} />
          <FooterColumn title="Company" links={FOOTER_LINKS.company} />
          <FooterColumn title="Resources" links={FOOTER_LINKS.resources} />

          <div>
            <h3 className="text-xs font-semibold tracking-wide text-foreground uppercase">
              Follow us
            </h3>
            <div className="mt-4 flex items-center gap-3">
              {SOCIAL.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-card hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Copyright © {year} GemMint Inc. All rights reserved.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <p className="text-sm text-muted">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy Policy
              </Link>
              <span className="mx-2">&</span>
              <Link href="/terms" className="hover:text-foreground">
                Terms of Use
              </Link>
            </p>
            <ThemeToggle className="self-start" />
          </div>
        </div>
      </Container>
    </footer>
  );
}
