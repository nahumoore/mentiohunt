import {
  IconArrowLeft,
  IconArrowRight,
  IconBrandX,
  IconCalendar,
  IconClock,
  IconScale,
} from "@tabler/icons-react"
import type { Metadata } from "next"
import { MDXRemote } from "next-mdx-remote/rsc"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import Script from "next/script"
import remarkGfm from "remark-gfm"

import { Footer } from "@/components/landing/footer"
import { Navbar } from "@/components/landing/navbar"
import { ArticleTableOfContents } from "@/components/resources/article-table-of-contents"
import BlogStylings from "@/components/resources/blog-stylings"
import {
  getAllResources,
  getPostBySlug,
  getResourceSlugs,
  type BlogPostMeta,
} from "@/lib/mdx"
import { getArticleHeadings } from "@/lib/mdx-headings"

type Props = { params: Promise<{ slug: string }> }

function getSummary(post: BlogPostMeta): string {
  return post.metaDescription || post.description || post.excerpt || ""
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

function getToolNames(meta: BlogPostMeta): { a: string; b: string } {
  if (meta.toolA && meta.toolB) return { a: meta.toolA, b: meta.toolB }
  const parts = meta.slug.split("-vs-")
  if (parts.length === 2) {
    return {
      a: parts[0]!.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      b: parts[1]!.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }
  }
  return { a: "Tool A", b: "Tool B" }
}

export async function generateStaticParams() {
  return getResourceSlugs("compare").map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug, "compare")

  if (!post) return {}

  const title = post.meta.metaTitle || post.meta.title
  const description = getSummary(post.meta)

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/compare/${slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://mentiohunt.com/compare/${slug}`,
      publishedTime: post.meta.date,
      modifiedTime: post.meta.dateModified ?? post.meta.date,
      authors: post.meta.author ? [post.meta.author] : ["Nicolas More"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function ComparePage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug, "compare")

  if (!post) notFound()

  const { meta, content } = post
  const headings = getArticleHeadings(content)
  const tools = getToolNames(meta)
  const related = getAllResources("compare")
    .filter((c) => c.slug !== slug)
    .slice(0, 3)
  const author =
    meta.author === "Unknown" ? "Nicolas More" : (meta.author ?? "Nicolas More")

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: getSummary(meta),
    datePublished: meta.date,
    dateModified: meta.dateModified ?? meta.date,
    author: {
      "@type": "Person",
      name: author,
      url: "https://x.com/nicolasmore_",
    },
    publisher: {
      "@type": "Organization",
      name: "Mentiohunt",
      url: "https://mentiohunt.com",
    },
    url: `https://mentiohunt.com/compare/${meta.slug}`,
    ...(meta.image ? { image: `https://mentiohunt.com${meta.image}` } : {}),
  }

  const faqSchema =
    meta.faqs && meta.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: meta.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }
      : null

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Script
        id="article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <Script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60 pt-12 pb-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
          />
          <div className="pointer-events-none absolute top-0 -right-32 h-80 w-80 rounded-full bg-[var(--color-blaze-orange)]/8 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 -left-20 h-56 w-56 rounded-full bg-[var(--color-amber-glow)]/6 blur-3xl" />

          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/compare"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <IconArrowLeft size={14} stroke={2} />
              Back to comparisons
            </Link>

            <div className="mt-9 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
              {/* Left: text */}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-princeton-orange)] uppercase">
                  <IconScale size={13} stroke={2.5} />
                  <span>Tool Comparison</span>
                </div>

                <h1 className="mt-4 font-heading text-4xl leading-tight font-semibold tracking-[-0.045em] text-balance sm:text-5xl">
                  {meta.title}
                </h1>

                {meta.verdict && (
                  <p className="mt-4 text-base font-medium text-[var(--color-princeton-orange)]">
                    {meta.verdict}
                  </p>
                )}

                <p className="mt-4 text-lg leading-8 text-muted-foreground">
                  {getSummary(meta)}
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <IconClock size={14} stroke={2} />
                    {getReadTimeLabel(meta.readTime)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <IconCalendar size={14} stroke={2} />
                    {meta.dateModified
                      ? `Updated ${formatDate(meta.dateModified)}`
                      : formatDate(meta.date)}
                  </span>
                  <a
                    href="https://x.com/nicolasmore_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                  >
                    <IconBrandX size={14} stroke={2} />
                    {author}
                  </a>
                </div>
              </div>

              {/* Right: VS split */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
                {/* Tool A */}
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card px-4 py-8 text-center shadow-sm">
                  {meta.toolAUrl && (
                    <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-border/60 bg-muted/40 shadow-sm">
                      <Image
                        src={`https://www.google.com/s2/favicons?domain=${meta.toolAUrl}&sz=128`}
                        alt={`${tools.a} logo`}
                        fill
                        className="object-contain p-1.5"
                        unoptimized
                      />
                    </div>
                  )}
                  <span className="font-heading text-xl font-semibold tracking-[-0.03em] text-foreground">
                    {tools.a}
                  </span>
                  {meta.toolAUrl && (
                    <span className="text-xs text-muted-foreground/60">
                      {meta.toolAUrl}
                    </span>
                  )}
                </div>

                {/* VS badge */}
                <div className="flex flex-col items-center justify-center gap-2 px-1">
                  <div className="h-px w-px flex-1 bg-border/60" />
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-[var(--color-blaze-orange)]/35 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-background)_80%,var(--color-amber-glow)_20%),var(--color-background))] text-[0.65rem] font-bold text-[var(--color-princeton-orange)] uppercase shadow-[0_0_16px_-4px_rgba(255,133,0,0.3)]">
                    vs
                  </div>
                  <div className="h-px w-px flex-1 bg-border/60" />
                </div>

                {/* Tool B */}
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card px-4 py-8 text-center shadow-sm">
                  {meta.toolBUrl && (
                    <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-border/60 bg-muted/40 shadow-sm">
                      <Image
                        src={`https://www.google.com/s2/favicons?domain=${meta.toolBUrl}&sz=128`}
                        alt={`${tools.b} logo`}
                        fill
                        className="object-contain p-1.5"
                        unoptimized
                      />
                    </div>
                  )}
                  <span className="font-heading text-xl font-semibold tracking-[-0.03em] text-foreground">
                    {tools.b}
                  </span>
                  {meta.toolBUrl && (
                    <span className="text-xs text-muted-foreground/60">
                      {meta.toolBUrl}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,720px)_360px] xl:items-start xl:justify-between xl:gap-16">
            <article className="text-foreground lg:max-w-[720px]">
              <MDXContent source={content} />

              <div className="mt-12 flex items-start gap-4 rounded-2xl border border-border bg-muted/30 p-5">
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-border">
                  <Image
                    src="/founder.webp"
                    alt={author}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <a
                    href="https://x.com/nicolasmore_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
                  >
                    {author}
                  </a>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Founder at Mentiohunt. Building distribution tools for
                    founders and small marketing teams. Writes about backlink
                    building and founder-led growth.
                  </p>
                  <a
                    href="https://x.com/nicolasmore_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <IconBrandX size={12} stroke={2} />
                    @nicolasmore_
                  </a>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8 rounded-2xl border border-[var(--color-blaze-orange)]/20 bg-[linear-gradient(135deg,var(--color-background)_0%,color-mix(in_oklab,var(--color-background)_82%,var(--color-amber-glow)_18%)_100%)] p-7 shadow-[0_8px_40px_-12px_rgba(255,133,0,0.16)]">
                <p className="font-heading text-xl font-semibold tracking-[-0.02em]">
                  Want one queue for backlink opportunities and community
                  mentions?
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Mentiohunt helps founders turn articles, keywords,
                  competitors, and product context into distribution
                  opportunities they can review and act on.
                </p>
                <Link
                  href="/signup"
                  className="mt-5 inline-flex rounded-full bg-[var(--color-princeton-orange)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-blaze-orange-2)]"
                >
                  Start free
                </Link>
              </div>
            </article>

            <ArticleTableOfContents headings={headings} />
          </div>
        </div>
        {/* Related comparisons */}
        {related.length > 0 && (
          <section className="border-t border-border/60 bg-muted/20 py-14">
            <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
              <h2 className="font-heading text-xl font-semibold tracking-[-0.03em] text-foreground">
                More comparisons
              </h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((comparison) => {
                  const relatedTools = getToolNames(comparison)
                  return (
                    <Link
                      key={comparison.slug}
                      href={`/compare/${comparison.slug}`}
                      className="group flex flex-col rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-blaze-orange)]/30 hover:shadow-[0_8px_30px_-8px_rgba(255,133,0,0.14)]"
                    >
                      {/* VS header */}
                      <div className="flex items-center gap-3 rounded-t-2xl border-b border-border/60 bg-muted/30 px-5 py-4">
                        <div className="flex flex-1 items-center gap-2">
                          {comparison.toolAUrl && (
                            <Image
                              src={`https://www.google.com/s2/favicons?domain=${comparison.toolAUrl}&sz=32`}
                              alt={`${relatedTools.a} favicon`}
                              width={16}
                              height={16}
                              className="h-4 w-4 rounded-sm object-contain"
                              unoptimized
                            />
                          )}
                          <span className="truncate font-heading text-sm font-semibold tracking-[-0.02em] text-foreground">
                            {relatedTools.a}
                          </span>
                        </div>

                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[var(--color-blaze-orange)]/30 bg-[var(--color-blaze-orange)]/8 text-[0.5rem] font-bold text-[var(--color-princeton-orange)] uppercase">
                          vs
                        </span>

                        <div className="flex flex-1 items-center justify-end gap-2">
                          <span className="truncate text-right font-heading text-sm font-semibold tracking-[-0.02em] text-foreground">
                            {relatedTools.b}
                          </span>
                          {comparison.toolBUrl && (
                            <Image
                              src={`https://www.google.com/s2/favicons?domain=${comparison.toolBUrl}&sz=32`}
                              alt={`${relatedTools.b} favicon`}
                              width={16}
                              height={16}
                              className="h-4 w-4 rounded-sm object-contain"
                              unoptimized
                            />
                          )}
                        </div>
                      </div>

                      {/* Body */}
                      <div className="flex flex-1 flex-col p-5">
                        <p className="line-clamp-2 flex-1 text-xs leading-5 text-muted-foreground">
                          {comparison.verdict ?? comparison.description}
                        </p>

                        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                          <span className="text-xs text-muted-foreground">
                            {comparison.readTime
                              ? getReadTimeLabel(comparison.readTime)
                              : null}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-princeton-orange)] transition-all duration-200 group-hover:gap-1.5">
                            Read
                            <IconArrowRight
                              size={11}
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
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}

const MDXContent = ({ source }: { source: string }) => {
  const components = BlogStylings()

  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [],
        },
      }}
    />
  )
}
