import {
  IconArrowRight,
  IconBook2,
  IconCalendar,
  IconClock,
} from "@tabler/icons-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { Footer } from "@/components/landing/footer"
import { Navbar } from "@/components/landing/navbar"
import { RelatedHubsSection } from "@/components/resources/related-hubs-section"
import { getAllResources, type BlogPostMeta } from "@/lib/mdx"

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Practical backlink prospecting, opportunity scoring, and founder-led distribution guides from Mentiohunt.",
  openGraph: {
    title: "Blog — Mentiohunt",
    description:
      "Practical backlink prospecting, opportunity scoring, and founder-led distribution guides from Mentiohunt.",
    url: "https://mentiohunt.com/blog",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Mentiohunt",
    description:
      "Practical backlink prospecting, opportunity scoring, and founder-led distribution guides from Mentiohunt.",
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

export default function BlogPage() {
  const articles = getAllResources("articles")

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
          <div className="pointer-events-none absolute -top-16 right-0 h-96 w-96 rounded-full bg-[var(--color-princeton-orange)]/9 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 -left-24 h-72 w-72 rounded-full bg-[var(--color-amber-glow)]/7 blur-3xl" />

          <div className="relative container mx-auto max-w-5xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-princeton-orange)] uppercase">
              <IconBook2 size={14} stroke={2.5} />
              <span>Backlink Field Notes</span>
            </div>
            <h1 className="mt-4 max-w-4xl font-heading text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl lg:text-[3.4rem]">
              Practical playbooks for building a better outreach queue.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              How-tos, backlink strategies, prospecting workflows, and
              prioritization notes for founders who need to know what to do next.
            </p>
          </div>
        </section>

        <section className="container mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          {articles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {articles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/blog/${article.slug}`}
                  className="group overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-blaze-orange)]/30 hover:shadow-[0_14px_45px_-28px_rgba(255,133,0,0.42)]"
                >
                  {article.image && (
                    <div className="relative aspect-[16/9] overflow-hidden border-b border-border bg-muted">
                      <Image
                        src={article.image}
                        alt={article.imageAlt ?? article.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-[var(--color-princeton-orange)] uppercase">
                        {article.category ?? "Article"}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <IconClock size={12} stroke={2} />
                        {getReadTimeLabel(article.readTime)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <IconCalendar size={12} stroke={2} />
                        {formatDate(article.date)}
                      </span>
                    </div>

                    <h2 className="mt-3 font-heading text-2xl font-semibold tracking-[-0.03em] text-foreground transition-colors group-hover:text-[var(--color-princeton-orange)]">
                      {article.title}
                    </h2>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {getSummary(article)}
                    </p>

                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-princeton-orange)] transition-all duration-200 group-hover:gap-2">
                      Read article
                      <IconArrowRight size={14} stroke={2.5} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-muted/40 px-8 py-10 text-sm leading-7 text-muted-foreground">
              <p className="font-medium text-foreground">Articles are coming soon.</p>
              <p className="mt-2">
                Add MDX files to <code>resources/articles</code> to publish
                articles here.
              </p>
            </div>
          )}
        </section>

        <RelatedHubsSection
          heading="Turn a guide into a queue."
          subheading="These articles teach the workflow. The rest of the site helps you act on it — pick a channel, compare tools, or let Mentiohunt run the queue for you."
          links={[
            {
              label: "Platform guides",
              title: "Backlinks From Reddit, Quora, Pinterest & More",
              href: "/backlinks-from",
              description:
                "Founder-friendly playbooks for earning links from platforms where your audience already spends time.",
              cta: "Browse platform guides",
            },
            {
              label: "Tool alternatives",
              title: "Link Building Tool Alternatives",
              href: "/alternatives",
              description:
                "Honest comparisons of Pitchbox, BuzzStream, Ahrefs, and other outreach tools — including when they're the better fit.",
              cta: "See the comparisons",
            },
            {
              label: "Product angle",
              title: "Mentiohunt Discovery Queue",
              href: "/signup",
              description:
                "Turn your articles, keywords, and competitors into a recurring queue of backlink opportunities instead of starting research from zero.",
            },
          ]}
        />
      </main>

      <Footer />
    </div>
  )
}
