import {
  IconArrowRight,
  IconArrowLeft,
  IconBrandX,
  IconCalendar,
  IconClock,
  IconLink,
} from "@tabler/icons-react"
import type { Metadata } from "next"
import { MDXRemote } from "next-mdx-remote/rsc"
import Image from "next/image"
import Link from "next/link"
import Script from "next/script"
import { notFound } from "next/navigation"
import remarkGfm from "remark-gfm"

import { Footer } from "@/components/landing/footer"
import { Navbar } from "@/components/landing/navbar"
import { getPlatformCardIcon } from "@/components/backlinks-from/data"
import { ArticleTableOfContents } from "@/components/resources/article-table-of-contents"
import BlogStylings from "@/components/resources/blog-stylings"
import { getArticleHeadings } from "@/lib/mdx-headings"
import {
  getAllResources,
  getPostBySlug,
  getRelatedResources,
  getResourceSlugs,
  type BlogPostMeta,
} from "@/lib/mdx"

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

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate)
}

function getArticleBody(source: string): string {
  return source.replace(/^#\s+.+(?:\r?\n)+/, "")
}

function getRelatedPlatformGuides(slug: string): BlogPostMeta[] {
  const relatedGuides = getRelatedResources(slug, "backlinks-from")

  if (relatedGuides.length > 0) {
    return relatedGuides.slice(0, 3)
  }

  return getAllResources("backlinks-from")
    .filter((guide) => guide.slug !== slug)
    .slice(0, 3)
}

export async function generateStaticParams() {
  return getResourceSlugs("backlinks-from").map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug, "backlinks-from")

  if (!post) return {}

  const title = post.meta.metaTitle || post.meta.title
  const description = getSummary(post.meta)

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `/backlinks-from/${post.meta.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://mentiohunt.com/backlinks-from/${post.meta.slug}`,
      publishedTime: post.meta.date,
      modifiedTime: post.meta.dateModified ?? post.meta.date,
      authors: post.meta.author ? [post.meta.author] : ["Nicolas More"],
      images: post.meta.image ? [post.meta.image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.meta.image ? [post.meta.image] : undefined,
    },
  }
}

export default async function BacklinksFromArticlePage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug, "backlinks-from")

  if (!post) notFound()

  const { meta, content } = post
  const articleBody = getArticleBody(content)
  const headings = getArticleHeadings(articleBody)
  const author = meta.author === "Unknown" ? "Nicolas More" : meta.author
  const relatedGuides = getRelatedPlatformGuides(slug)

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
    url: `https://mentiohunt.com/backlinks-from/${meta.slug}`,
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
        <section className="relative overflow-hidden border-b border-border/60 pt-12 pb-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
          />
          <div className="pointer-events-none absolute -top-24 right-8 h-96 w-96 rounded-full bg-[var(--color-princeton-orange)]/9 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 -left-24 h-72 w-72 rounded-full bg-[var(--color-amber-glow)]/7 blur-3xl" />

          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/backlinks-from"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <IconArrowLeft size={14} stroke={2} />
              Back to backlinks from
            </Link>

            <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(460px,560px)] lg:items-end lg:gap-16">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-princeton-orange)] uppercase">
                  <IconLink size={14} stroke={2.5} />
                  <span>{meta.category ?? "Platform Guide"}</span>
                </div>

                <h1 className="mt-4 max-w-4xl font-heading text-4xl leading-tight font-semibold tracking-[-0.05em] text-balance sm:text-5xl lg:text-[3.45rem]">
                  {meta.title}
                </h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
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

              {meta.image && (
                <div className="relative aspect-video overflow-hidden rounded-[1.75rem] border border-border bg-muted shadow-[0_28px_90px_-48px_rgba(255,133,0,0.58)]">
                  <Image
                    src={meta.image}
                    alt={meta.imageAlt ?? meta.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,740px)_360px] xl:items-start xl:justify-between xl:gap-16">
            <article className="text-foreground lg:max-w-[740px]">
              <MDXContent source={articleBody} />

              <div className="mt-12 flex items-start gap-4 rounded-2xl border border-border bg-muted/30 p-5">
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-border">
                  <Image
                    src="/founder.webp"
                    alt={author ?? "Nicolas More"}
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
                    building, community monitoring, and founder-led growth.
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

              <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-[var(--color-blaze-orange)]/20 bg-[linear-gradient(135deg,var(--color-background)_0%,color-mix(in_oklab,var(--color-background)_80%,var(--color-amber-glow)_20%)_100%)] p-7 shadow-[0_18px_70px_-34px_rgba(255,133,0,0.5)]">
                <p className="font-heading text-2xl font-semibold tracking-[-0.03em] text-balance">
                  Turn platform research into a recurring opportunity queue.
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Mentiohunt helps founders turn article URLs, competitors,
                  keywords, and product context into qualified backlink
                  opportunities with fit rationale and outreach prep.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/signup"
                    className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--color-princeton-orange)] px-5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:bg-[var(--color-blaze-orange-2)]"
                  >
                    Start your first queue
                  </Link>
                  <Link
                    href="/backlinks-from"
                    className="inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Browse all platform guides
                  </Link>
                </div>
              </div>
            </article>

            <ArticleTableOfContents headings={headings} />
          </div>

          {relatedGuides.length > 0 && (
            <section className="mt-20 border-t border-border/60 pt-14 sm:pt-16">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 text-[0.68rem] font-bold text-[var(--color-princeton-orange)] uppercase">
                    <IconLink size={13} stroke={2.4} />
                    Keep the queue moving
                  </div>
                  <h2 className="mt-4 font-heading text-3xl font-semibold tracking-[-0.04em] text-balance">
                    More platform guides worth opening next.
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                    Jump to the adjacent surfaces where this same article could
                    create fit, context, or a cleaner outreach angle.
                  </p>
                </div>

                <Link
                  href="/backlinks-from"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Browse all platform guides
                  <IconArrowRight size={14} stroke={2.2} />
                </Link>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {relatedGuides.map((guide) => {
                  const Icon = getPlatformCardIcon(guide.slug)

                  return (
                    <Link
                      key={guide.slug}
                      href={`/backlinks-from/${guide.slug}`}
                      className="group relative overflow-hidden rounded-[1.9rem] border border-border/80 bg-card/95 shadow-[0_20px_70px_-48px_rgba(17,17,17,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-blaze-orange)]/28 hover:shadow-[0_28px_90px_-44px_rgba(255,96,0,0.38)]"
                    >
                      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_right,var(--color-amber-glow)_0%,transparent_70%)] opacity-20" />
                        <div className="absolute right-0 bottom-0 h-24 w-24 rounded-full bg-[var(--color-princeton-orange)]/8 blur-3xl" />
                      </div>

                      {guide.image && (
                        <div className="relative aspect-[16/9] overflow-hidden border-b border-border/70 bg-muted">
                          <Image
                            src={guide.image}
                            alt={guide.imageAlt ?? guide.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
                        </div>
                      )}

                      <div className="relative p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-blaze-orange)]/18 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-[0.68rem] font-bold text-[var(--color-princeton-orange)] uppercase">
                            <Icon className="h-4 w-4 fill-current" />
                            {guide.category ?? "Platform Guide"}
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2.5 py-1 text-[0.7rem] font-medium text-muted-foreground">
                            {getReadTimeLabel(guide.readTime)}
                          </span>
                        </div>

                        <h3 className="mt-5 font-heading text-[1.55rem] leading-tight font-semibold tracking-[-0.04em] text-foreground transition-colors group-hover:text-[var(--color-princeton-orange)]">
                          {guide.title}
                        </h3>
                        <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">
                          {getSummary(guide)}
                        </p>

                        <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4 text-sm">
                          <span className="text-muted-foreground">
                            {formatDate(guide.date)}
                          </span>
                          <span className="inline-flex items-center gap-1 font-medium text-[var(--color-princeton-orange)] transition-all duration-200 group-hover:gap-2">
                            Open guide
                            <IconArrowRight size={14} stroke={2.4} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </div>
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
