import {
  IconArrowLeft,
  IconBrandX,
  IconCalendar,
  IconClock,
  IconQuote,
  IconTrendingUp,
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
import { RelatedResourcesSection } from "@/components/resources/related-resources-section"
import {
  getPostBySlug,
  getRelatedWithFallback,
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

function getFaviconUrl(siteUrl: string): string {
  const domain = new URL(siteUrl).hostname
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

export async function generateStaticParams() {
  return getResourceSlugs("case-studies").map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug, "case-studies")

  if (!post) return {}

  const title = post.meta.metaTitle || post.meta.title
  const description = getSummary(post.meta)

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `/case-studies/${post.meta.slug}`,
    },
    robots: post.meta.draft
      ? { index: false, follow: false }
      : undefined,
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://mentiohunt.com/case-studies/${post.meta.slug}`,
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

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug, "case-studies")

  if (!post) notFound()

  const { meta, content } = post
  const articleBody = getArticleBody(content)
  const headings = getArticleHeadings(articleBody)
  const author = meta.author === "Unknown" ? "Nicolas More" : meta.author
  const relatedStudies = getRelatedWithFallback(slug, "case-studies")

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
    url: `https://mentiohunt.com/case-studies/${meta.slug}`,
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

      {meta.draft && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs font-semibold text-amber-700 dark:text-amber-400">
          Template placeholder — draft:true, excluded from the case studies
          index and marked noindex. Not a real customer story.
        </div>
      )}

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
              href="/case-studies"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <IconArrowLeft size={14} stroke={2} />
              Back to case studies
            </Link>

            <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(460px,560px)] lg:items-end lg:gap-16">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-princeton-orange)] uppercase">
                  <IconTrendingUp size={14} stroke={2.5} />
                  <span>{meta.industry ?? meta.category ?? "Case Study"}</span>
                </div>

                <h1 className="mt-4 max-w-4xl font-heading text-4xl leading-tight font-semibold tracking-[-0.05em] text-balance sm:text-5xl lg:text-[3.45rem]">
                  {meta.title}
                </h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
                  {getSummary(meta)}
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {meta.company && (
                    <a
                      href={meta.companyUrl ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                    >
                      {meta.companyUrl && (
                        <Image
                          src={getFaviconUrl(meta.companyUrl)}
                          alt=""
                          width={14}
                          height={14}
                          className="rounded-sm"
                          unoptimized
                        />
                      )}
                      {meta.company}
                    </a>
                  )}
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

              {meta.quote && (
                <div className="mt-10 rounded-[1.75rem] border border-border bg-muted/30 p-7">
                  <IconQuote
                    className="text-[var(--color-princeton-orange)]"
                    size={22}
                    stroke={2}
                  />
                  <p className="mt-3 font-heading text-xl leading-8 text-balance">
                    &ldquo;{meta.quote}&rdquo;
                  </p>
                  {meta.quoteAuthor && (
                    <p className="mt-4 text-sm font-semibold text-muted-foreground">
                      {meta.quoteAuthor}
                    </p>
                  )}
                </div>
              )}

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
                    Founder of Mentiohunt. Writes up real customer queues —
                    the discovery volume, the reply rate, and the links
                    earned — rather than generic SEO advice.
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
                  Want a queue like this one?
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Mentiohunt turns your article URLs, competitors, and
                  product context into qualified backlink opportunities with
                  fit rationale and outreach prep — same setup this founder
                  used.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/signup"
                    className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--color-princeton-orange)] px-5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:bg-[var(--color-blaze-orange-2)]"
                  >
                    Start your first queue
                  </Link>
                  <Link
                    href="/case-studies"
                    className="inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Browse all case studies
                  </Link>
                </div>
              </div>
            </article>

            <ArticleTableOfContents headings={headings} />
          </div>

          <RelatedResourcesSection
            eyebrow="More real numbers"
            heading="More case studies worth opening next."
            description="Other founders' queues, reply rates, and backlink counts."
            items={relatedStudies}
            basePath="/case-studies"
            browseAllHref="/case-studies"
            browseAllLabel="Browse all case studies"
          />
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
