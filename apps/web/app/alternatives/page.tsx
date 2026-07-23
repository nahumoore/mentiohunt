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
  title: "Link Building Tool Alternatives",
  description:
    "Honest comparisons of link building and backlink outreach tools — Pitchbox, BuzzStream, Ahrefs, Semrush, Respona, and more. We'll tell you when the other tool is actually better.",
  openGraph: {
    title: "Link Building Tool Alternatives — Mentiohunt",
    description:
      "Honest comparisons of link building and backlink outreach tools — Pitchbox, BuzzStream, Ahrefs, Semrush, Respona, and more. We'll tell you when the other tool is actually better.",
    url: "https://mentiohunt.com/alternatives",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Link Building Tool Alternatives — Mentiohunt",
    description:
      "Honest comparisons of link building and backlink outreach tools — Pitchbox, BuzzStream, Ahrefs, Semrush, Respona, and more. We'll tell you when the other tool is actually better.",
  },
}

function getSummary(post: BlogPostMeta): string {
  return post.description || post.excerpt || ""
}

function getReadTimeLabel(readTime?: string): string {
  if (!readTime) return "1 min read"
  return readTime.endsWith("read") ? readTime : `${readTime} read`
}

function formatDate(date: string): string {
  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate)
}

export default function AlternativesPage() {
  const alternatives = getAllResources("alternatives")

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
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
              <span>Link Building Tool Comparisons</span>
            </div>
            <h1 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl lg:text-[3.25rem]">
              Link building and backlink outreach tools,{" "}
              <span className="bg-gradient-to-r from-[var(--color-blaze-orange-2)] via-[var(--color-harvest-orange)] to-[var(--color-amber-flame)] bg-clip-text text-transparent">
                compared honestly.
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Yes, we built Mentiohunt. Yes, we have an obvious bias. We also
              used most of these backlink prospecting and outreach tools before
              building ours. We&apos;ll tell you honestly when a competitor is
              actually the better choice for your link building workflow.
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

        <div className="container mx-auto max-w-5xl py-14">
          {alternatives.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {alternatives.map((alternative) => (
                <Link
                  key={alternative.slug}
                  href={`/alternatives/${alternative.slug}`}
                  className="group flex flex-col rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-blaze-orange)]/30 hover:shadow-[0_8px_30px_-8px_rgba(255,133,0,0.14)]"
                >
                  {alternative.image && (
                    <div className="relative aspect-video overflow-hidden rounded-t-2xl">
                      <Image
                        src={alternative.image}
                        alt={alternative.imageAlt ?? alternative.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  )}
                  <div className="p-6">
                  <div>
                    <span className="text-[0.65rem] font-semibold text-muted-foreground/60 uppercase">
                      {alternative.category ?? "Alternative"}
                    </span>
                    <h2 className="mt-2 font-heading text-xl font-semibold tracking-[-0.02em] text-foreground transition-colors group-hover:text-[var(--color-princeton-orange)]">
                      {alternative.title}
                    </h2>
                  </div>

                  <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">
                    {getSummary(alternative)}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border/60 pt-5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <IconClock size={12} stroke={2} />
                      {getReadTimeLabel(alternative.readTime)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <IconCalendar size={12} stroke={2} />
                      {formatDate(alternative.date)}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                    <span className="text-xs font-medium text-muted-foreground">
                      Founder-led distribution
                    </span>
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
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-muted/40 px-8 py-10 text-sm leading-7 text-muted-foreground">
              <p className="font-medium text-foreground">
                Alternative comparisons are coming soon.
              </p>
              <p className="mt-2">
                Add MDX files to <code>resources/alternatives</code> to publish
                comparisons here.
              </p>
            </div>
          )}

          <div className="mt-14 rounded-2xl border border-border bg-muted/40 px-8 py-8">
            <p className="text-sm font-semibold text-foreground">
              A note on our bias
            </p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              We built Mentiohunt because we couldn&apos;t find a tool that gave
              us a daily queue of qualified backlink targets without requiring a
              full SEO analyst workflow. These comparisons reflect our honest
              take on where each tool fits. If you&apos;re running a larger SEO
              operation, a campaign-heavy outreach suite may be the right call.
              If you&apos;re a founder doing your own distribution, we think
              Mentiohunt is worth trying —{" "}
              <Link
                href="/signup"
                className="font-medium text-[var(--color-princeton-orange)] underline decoration-[var(--color-princeton-orange)]/30 underline-offset-2 transition-colors hover:decoration-[var(--color-princeton-orange)]"
              >
                free to start
              </Link>
              .
            </p>
          </div>
        </div>

        <RelatedHubsSection
          heading="Pick a tool, then pick a channel."
          subheading="A comparison tells you which tool fits. These guides help you turn that decision into an actual queue of backlink opportunities."
          links={[
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
            {
              label: "Head-to-head",
              title: "Tool Comparisons",
              href: "/compare",
              description:
                "Direct comparisons between the tools on this page — Pitchbox vs BuzzStream, Respona vs Pitchbox, and more.",
              cta: "See the comparisons",
            },
          ]}
        />
      </main>

      <Footer />
    </div>
  )
}
