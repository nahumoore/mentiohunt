import Link from "next/link"

import { features } from "@/consts/features"
import { Button } from "@workspace/ui/components/button"
import { IconBrandMentiohunt } from "../custom-icons/brand-mentiohunt"

const productLinks = [
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/features", label: "Features" },
  ...features.map((f) => ({
    href: `/features/${f.slug}`,
    label: f.shortTitle,
  })),
  { href: "/#target-personas", label: "Who It's For" },
  { href: "/#pricing", label: "Pricing" },
]

const resourceLinks = [
  { href: "/blog", label: "Blog" },
  { href: "/backlinks-from", label: "Backlinks From" },
  { href: "/free-tools", label: "Free Tools" },
  { href: "/directory-submission", label: "Submit a Directory" },
  { href: "/about", label: "About" },
  { href: "/alternatives", label: "Alternatives" },
]

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/tos", label: "Terms of Service" },
]

const stats = [
  { value: "Daily", label: "opportunity queue" },
  { value: "AI", label: "fit scoring" },
  { value: "Zero", label: "cold prospecting" },
]

function FooterSocialProof() {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-1">
      <a
        href="https://fazier.com/launches/mentiohunt.com"
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label="Mentiohunt launch badge on Fazier"
        className="inline-flex rounded-lg transition-opacity hover:opacity-85"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=neutral"
          width={120}
          alt="Fazier badge"
        />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a
        href="https://www.producthunt.com/products/mentiohunt?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-mentiohunt"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Mentiohunt on Product Hunt"
        className="inline-flex rounded-lg transition-opacity hover:opacity-85"
      >
        <img
          alt="Mentiohunt - Find backlink and mention opportunities for your startup | Product Hunt"
          width={250}
          height={54}
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1153691&theme=neutral&t=1779549223016"
        />
      </a>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-glow)]/60 to-transparent" />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage: `linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative container mx-auto px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/20 bg-[linear-gradient(135deg,var(--color-background)_0%,color-mix(in_oklab,var(--color-background)_74%,var(--color-amber-glow)_26%)_100%)] shadow-[0_32px_100px_-40px_rgba(255,133,0,0.36)]">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/70 to-transparent" />
          <div className="pointer-events-none absolute -top-24 -right-12 h-72 w-72 rounded-full bg-[var(--color-princeton-orange)]/12 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-16 h-56 w-56 rounded-full bg-[var(--color-blaze-orange)]/10 blur-3xl" />

          <div className="pointer-events-none absolute top-1/2 right-6 -translate-y-1/2 font-heading text-[10rem] leading-none font-bold tracking-[-0.06em] text-[var(--color-amber-glow)]/[0.07] select-none lg:right-14 lg:text-[14rem]">
            Q
          </div>

          <div className="relative grid gap-10 px-6 py-10 sm:px-8 sm:py-12 lg:grid-cols-[1fr_auto] lg:items-center lg:px-12 lg:py-14">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.18em] text-[var(--color-princeton-orange)] uppercase">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-princeton-orange)]" />
                Your next backlink opportunities, ready
              </div>

              <h2 className="mt-5 font-heading text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl lg:text-[2.75rem]">
                Stop searching for prospects.{" "}
                <span className="text-[var(--color-princeton-orange)]">
                  Start working a queue.
                </span>
              </h2>

              <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                Mentiohunt turns your site, niche, keywords, and competitors
                into a recurring stream of outreach opportunities — each with
                fit rationale and a clear next step.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="h-11 rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
                >
                  <Link href="/signup">Start your first queue</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="h-11 rounded-full px-6 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Link href="/#how-it-works">See how it works →</Link>
                </Button>
              </div>
            </div>

            <div className="flex flex-row gap-8 lg:flex-col lg:gap-6 lg:text-right">
              {stats.map((s) => (
                <div key={s.label} className="space-y-0.5">
                  <p className="font-heading text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
                    {s.value}
                  </p>
                  <p className="text-xs leading-4 text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-10 border-t border-border/60 pt-10 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto] lg:items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <IconBrandMentiohunt className="size-5 rotate-12 text-primary" />
              <p className="font-heading text-lg font-semibold tracking-tight">
                Mentiohunt
              </p>
            </div>
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              Daily backlink queue for founders and agencies. Qualified
              opportunities, plain-English fit rationale, and outreach prep —
              ready each morning.
            </p>
            <div className="space-y-1 text-xs leading-5 text-muted-foreground/65">
              <p>Made with ❤️ from 🇺🇸</p>
              <p>
                131 Continental Dr. Suite 305,
                <br />
                19713, Delaware.
              </p>
            </div>
            <p className="text-xs text-muted-foreground/50">
              © 2026 Mentiohunt · Built for recurring backlink work
            </p>
            <FooterSocialProof />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground/60 uppercase">
              Product
            </p>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-[var(--color-princeton-orange)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground/60 uppercase">
              Resources
            </p>
            <ul className="space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-[var(--color-princeton-orange)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground/60 uppercase">
              Legal
            </p>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-[var(--color-princeton-orange)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex justify-start border-t border-border/40 pt-6 sm:justify-end">
          <Link
            href="#"
            className="text-sm text-muted-foreground transition-colors hover:text-[var(--color-princeton-orange)]"
          >
            ↑ Back to top
          </Link>
        </div>
      </div>
    </footer>
  )
}
