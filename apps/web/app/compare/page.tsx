import {
  IconArrowRight,
  IconBrandX,
  IconCalendar,
  IconClock,
  IconScale,
} from "@tabler/icons-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { Footer } from "@/components/landing/footer"
import { Navbar } from "@/components/landing/navbar"
import { RelatedHubsSection } from "@/components/resources/related-hubs-section"
import { getAllResources, type BlogPostMeta } from "@/lib/mdx"

export const metadata: Metadata = {
  title: "Tool Comparisons",
  description:
    "Honest head-to-head comparisons of backlink building and outreach tools. We'll tell you when a competitor is actually the better fit for your team.",
  alternates: {
    canonical: "/compare",
  },
  openGraph: {
    title: "Tool Comparisons — Mentiohunt",
    description:
      "Honest head-to-head comparisons of backlink building and outreach tools. We'll tell you when a competitor is actually the better fit for your team.",
    url: "https://mentiohunt.com/compare",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tool Comparisons — Mentiohunt",
    description:
      "Honest head-to-head comparisons of backlink building and outreach tools. We'll tell you when a competitor is actually the better fit for your team.",
  },
}

function getReadTimeLabel(readTime?: string): string {
  if (!readTime) return "1 min read"
  return readTime.endsWith("read") ? readTime : `${readTime} read`
}

function formatDate(date: string): string {
  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime())) return date
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate)
}

function getToolNames(comparison: BlogPostMeta): { a: string; b: string } {
  if (comparison.toolA && comparison.toolB) {
    return { a: comparison.toolA, b: comparison.toolB }
  }
  const parts = comparison.slug.split("-vs-")
  if (parts.length === 2) {
    return {
      a: parts[0]!.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      b: parts[1]!.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }
  }
  return { a: "Tool A", b: "Tool B" }
}

export default function ComparePage() {
  const comparisons = getAllResources("compare")

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60 px-4 pt-14 pb-16 sm:px-6 lg:px-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
          />
          <div className="pointer-events-none absolute top-0 -right-32 h-80 w-80 rounded-full bg-[var(--color-blaze-orange)]/8 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 -left-20 h-56 w-56 rounded-full bg-[var(--color-amber-glow)]/6 blur-3xl" />

          <div className="relative container mx-auto max-w-5xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-princeton-orange)] uppercase">
              <IconScale size={13} stroke={2.5} />
              <span>Tool vs Tool</span>
            </div>
            <h1 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl lg:text-[3.25rem]">
              Side-by-side.{" "}
              <span className="bg-gradient-to-r from-[var(--color-blaze-orange-2)] via-[var(--color-harvest-orange)] to-[var(--color-amber-flame)] bg-clip-text text-transparent">
                No fluff.
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              We compared every tool founders actually consider. Same format every
              time: what each tool does, where it struggles, and which situation
              it fits.
            </p>

            <div className="mt-7 inline-flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
              <Image
                src="/founder.webp"
                alt="Nicolas More"
                width={56}
                height={56}
                className="h-14 w-14 rounded-xl object-cover ring-2 ring-[var(--color-blaze-orange)]/25"
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-[0.6rem] font-semibold text-muted-foreground/60 uppercase">
                  Written by
                </span>
                <span className="font-heading text-base leading-tight font-semibold text-foreground">
                  Nicolas More
                </span>
                <span className="text-sm text-muted-foreground">
                  SEO strategist · 6+ years experience
                </span>
              </div>
              <a
                href="https://x.com/nicolasmore_"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/60 text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
              >
                <IconBrandX size={16} stroke={2} />
              </a>
            </div>
          </div>
        </section>

        {/* Comparisons grid */}
        <div className="container mx-auto max-w-5xl py-14 px-4 sm:px-6 lg:px-8">
          {comparisons.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {comparisons.map((comparison) => {
                const tools = getToolNames(comparison)
                return (
                  <Link
                    key={comparison.slug}
                    href={`/compare/${comparison.slug}`}
                    className="group flex flex-col rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-blaze-orange)]/30 hover:shadow-[0_8px_30px_-8px_rgba(255,133,0,0.14)]"
                  >
                    {/* VS header */}
                    <div className="flex items-center gap-3 rounded-t-2xl border-b border-border/60 bg-muted/30 px-6 py-5">
                      <div className="flex flex-1 items-center gap-2.5">
                        {comparison.toolAUrl && (
                          <Image
                            src={`https://www.google.com/s2/favicons?domain=${comparison.toolAUrl}&sz=32`}
                            alt={`${tools.a} favicon`}
                            width={18}
                            height={18}
                            className="h-[18px] w-[18px] rounded-sm object-contain"
                            unoptimized
                          />
                        )}
                        <span className="font-heading text-lg font-semibold tracking-[-0.02em] text-foreground">
                          {tools.a}
                        </span>
                      </div>

                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[var(--color-blaze-orange)]/30 bg-[var(--color-blaze-orange)]/8 text-[0.6rem] font-bold text-[var(--color-princeton-orange)] uppercase">
                        vs
                      </span>

                      <div className="flex flex-1 items-center justify-end gap-2.5">
                        <span className="font-heading text-lg font-semibold tracking-[-0.02em] text-foreground">
                          {tools.b}
                        </span>
                        {comparison.toolBUrl && (
                          <Image
                            src={`https://www.google.com/s2/favicons?domain=${comparison.toolBUrl}&sz=32`}
                            alt={`${tools.b} favicon`}
                            width={18}
                            height={18}
                            className="h-[18px] w-[18px] rounded-sm object-contain"
                            unoptimized
                          />
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 flex-col p-6">
                      <p className="line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">
                        {comparison.verdict ?? comparison.description}
                      </p>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <IconClock size={12} stroke={2} />
                            {getReadTimeLabel(comparison.readTime)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <IconCalendar size={12} stroke={2} />
                            {formatDate(comparison.date)}
                          </span>
                        </div>

                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-princeton-orange)] transition-all duration-200 group-hover:gap-1.5">
                          Full comparison
                          <IconArrowRight
                            size={12}
                            stroke={2.5}
                            className="transition-transform duration-200 group-hover:translate-x-0.5"
                          />
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-muted/40 px-8 py-10 text-sm leading-7 text-muted-foreground">
              <p className="font-medium text-foreground">
                Comparisons are coming soon.
              </p>
              <p className="mt-2">
                Add MDX files to <code>resources/compare</code> to publish
                comparisons here.
              </p>
            </div>
          )}

          {/* Bias note */}
          <div className="mt-14 rounded-2xl border border-border bg-muted/40 px-8 py-8">
            <p className="text-sm font-semibold text-foreground">
              A note on our bias
            </p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              We built Mentiohunt. We also used most of the tools we compare
              before building ours. These comparisons reflect our honest take on
              where each tool fits. When a competitor is genuinely the better
              choice, we say so.{" "}
              <Link
                href="/signup"
                className="font-medium text-[var(--color-princeton-orange)] underline decoration-[var(--color-princeton-orange)]/30 underline-offset-2 transition-colors hover:decoration-[var(--color-princeton-orange)]"
              >
                Try Mentiohunt free
              </Link>{" "}
              if you want a simpler alternative.
            </p>
          </div>
        </div>

        <RelatedHubsSection
          heading="See the full picture before you switch."
          subheading="A head-to-head tells you how two tools stack up. These guides help you decide what to replace them with, and how to fill the queue once you do."
          links={[
            {
              label: "Full landscape",
              title: "Link Building Tool Alternatives",
              href: "/alternatives",
              description:
                "Every tool we get compared against, reviewed on its own — including when it's genuinely the better fit.",
              cta: "Browse alternatives",
            },
            {
              label: "Pillar guide",
              title: "How to Find Backlink Opportunities",
              href: "/blog/how-to-find-backlink-opportunities",
              description:
                "The broader workflow for discovering, scoring, and prioritizing link opportunities before you commit to a tool.",
              cta: "Read the guide",
            },
            {
              label: "Platform guides",
              title: "Backlinks From Reddit, Quora, Pinterest & More",
              href: "/backlinks-from",
              description:
                "Founder-friendly playbooks for earning links from platforms where your audience already spends time.",
              cta: "Browse platform guides",
            },
          ]}
        />
      </main>

      <Footer />
    </div>
  )
}
