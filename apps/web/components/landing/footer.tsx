import { IconArrowRight, IconArrowUp } from "@tabler/icons-react"
import Link from "next/link"

import { features } from "@/consts/features"
import { pathFor } from "@/components/link-building-statistics/shared/links"
import { Button } from "@workspace/ui/components/button"
import { IconBrandMentiohunt } from "../custom-icons/brand-mentiohunt"
import { OrganicVisibilityCard } from "./organic-visibility-card"

const productLinks = [
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/features", label: "Features" },
  ...features.map((f) => ({
    href: `/features/${f.slug}`,
    label: f.shortTitle,
  })),
  { href: "/case-studies", label: "Customer Results" },
  { href: "/pricing", label: "Pricing" },
]

const resourceLinks = [
  { href: "/blog", label: "Blog" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/backlinks-from", label: "Backlinks From" },
  { href: "/link-building-for", label: "Link Building by Industry" },
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
  { href: "/llms.txt", label: "llms.txt" },
]

const linkColumns = [
  { heading: "Product", links: productLinks },
  { heading: "Resources", links: resourceLinks },
  { heading: "Legal", links: legalLinks },
]

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-background">
      <div className="pointer-events-none absolute -top-24 right-0 h-[26rem] w-[26rem] translate-x-1/4 rounded-full bg-[var(--color-princeton-orange)]/6 blur-[100px]" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Closing call to action */}
        <div className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[1fr_minmax(0,32rem)] lg:items-center lg:gap-16">
          <div className="max-w-xl">
            <span className="text-[0.7rem] font-bold tracking-[0.22em] text-[var(--color-blaze-orange)] uppercase">
              Get started
            </span>
            <div className="mt-3 h-px w-12 bg-[var(--color-blaze-orange)]/60" />

            <h2 className="mt-6 font-[family-name:var(--font-figtree),var(--font-sans)] text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Put backlink outreach{" "}
              <span className="text-[var(--color-blaze-orange)]">
                on autopilot.
              </span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              Give Mentiohunt the articles you want to promote. The agent finds
              where each one belongs, qualifies the fit, finds the contact, and
              runs outreach through the first reply.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Button
                asChild
                size="lg"
                className="h-11 rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
              >
                <Link href="/signup">Find my backlink opportunities</Link>
              </Button>
              <Link
                href="/#how-it-works"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                See how it works
                <IconArrowRight className="size-4" stroke={1.5} />
              </Link>
            </div>
          </div>

          <OrganicVisibilityCard />
        </div>

        <div className="border-t border-border" />

        {/* Link directory */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_0.7fr]">
          <div>
            <div className="flex items-center gap-2">
              <IconBrandMentiohunt className="size-5 rotate-12 text-primary" />
              <p className="font-[family-name:var(--font-figtree),var(--font-sans)] text-lg font-semibold tracking-tight">
                Mentiohunt
              </p>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
              AI link-building agent and automated outreach software for lean B2B
              SaaS teams. We handle discovery and outreach through the first
              reply; you take it from there.
            </p>
            <div className="mt-5 space-y-1 font-[family-name:var(--font-sans)] text-xs leading-6 text-muted-foreground/65">
              <p>
                131 Continental Dr. Suite 305,
                <br />
                19713, Delaware, United States
              </p>
            </div>
          </div>

          {linkColumns.map((column) => (
            <div key={column.heading}>
              <p className="text-[0.7rem] font-semibold tracking-[0.09em] text-muted-foreground/60 uppercase">
                {column.heading}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-[var(--color-blaze-orange)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-3 border-t border-border py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground/60">
            © 2026 Mentiohunt · Built for recurring backlink work · Made in the
            USA
          </p>
          <Link
            href="#"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-[var(--color-blaze-orange)]"
          >
            <IconArrowUp className="size-4" stroke={1.5} />
            Back to top
          </Link>
        </div>
      </div>
    </footer>
  )
}
