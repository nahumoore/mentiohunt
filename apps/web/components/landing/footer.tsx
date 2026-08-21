import Link from "next/link"
import type { ComponentType } from "react"

import { features } from "@/consts/features"
import { IconBrandClaude } from "@/components/custom-icons/brand-claude"
import { IconBrandChatGPT } from "@/components/custom-icons/brand-chatgpt"
import { IconBrandGoogle } from "@/components/custom-icons/brand-google"
import IconBrandPerplexity from "@/components/custom-icons/brand-perplexity"
import { pathFor } from "@/components/link-building-statistics/shared/links"
import { Button } from "@workspace/ui/components/button"
import { IconBrandMentiohunt } from "../custom-icons/brand-mentiohunt"

const aiPlatforms: { name: string; Icon: ComponentType<{ className?: string }> }[] = [
  { name: "Claude", Icon: IconBrandClaude },
  { name: "ChatGPT", Icon: IconBrandChatGPT },
  { name: "Perplexity", Icon: IconBrandPerplexity },
  { name: "Google", Icon: IconBrandGoogle },
]

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
  { href: "/case-studies", label: "Case Studies" },
  { href: "/backlinks-from", label: "Backlinks From" },
  { href: "/outreach-templates", label: "Outreach Templates" },
  { href: "/free-tools", label: "Free Tools" },
  { href: pathFor(2026), label: "Link Building Statistics" },
  { href: "/directory-submission", label: "Submit a Directory" },
  { href: "/about", label: "About" },
  { href: "/alternatives", label: "Alternatives" },
  { href: "/compare", label: "Tool Comparisons" },
]

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/tos", label: "Terms of Service" },
]

const stats = [
  { value: "Daily", label: "opportunity queue" },
  { value: "AI", label: "fit scoring" },
  { value: "Zero", label: "outreach work until they reply" },
]

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
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-[0.65rem] font-semibold text-[var(--color-princeton-orange)] uppercase">
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
                Mentiohunt discovers backlink opportunities and runs outreach
                automatically through a prospect&apos;s first reply. You
                monitor the queue and cancel anything that isn&apos;t a fit — then
                take the conversation over yourself once someone responds.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-[0.65rem] font-medium text-muted-foreground/50 uppercase">
                  Get discovered across
                </span>
                <div className="flex items-center gap-1.5">
                  {aiPlatforms.map(({ name, Icon }) => (
                    <span
                      key={name}
                      aria-label={name}
                      className="flex size-7 items-center justify-center overflow-hidden rounded-[0.6rem] bg-background/70 shadow-sm"
                    >
                      <Icon className="size-4 opacity-80 saturate-[1.04]" />
                    </span>
                  ))}
                </div>
                <span className="text-[0.65rem] font-medium text-muted-foreground/40">
                  & more
                </span>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="h-11 rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
                >
                  <Link href="/signup">Find my first backlink</Link>
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
              Backlink outreach autopilot for lean B2B SaaS teams. We handle
              discovery and outreach through the first reply — you monitor the
              queue, cancel bad fits, and take it from there.
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
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase">
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
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase">
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
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase">
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
