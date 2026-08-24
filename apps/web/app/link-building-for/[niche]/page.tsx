import {
  IconArrowLeft,
  IconBrandX,
  IconCalendar,
  IconClock,
  IconTargetArrow,
} from "@tabler/icons-react"
import type { Metadata } from "next"
import { MDXRemote } from "next-mdx-remote/rsc"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import Script from "next/script"
import remarkGfm from "remark-gfm"

import { getNicheCardIcon } from "@/components/link-building-for/data"
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

type Props = { params: Promise<{ niche: string }> }

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

export async function generateStaticParams() {
  return getResourceSlugs("link-building-for").map((slug) => ({ niche: slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche } = await params
  const post = getPostBySlug(niche, "link-building-for")

  if (!post) return {}

  const title = post.meta.metaTitle || post.meta.title
  const description = getSummary(post.meta)

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `/link-building-for/${post.meta.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://mentiohunt.com/link-building-for/${post.meta.slug}`,
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

export default async function LinkBuildingForArticlePage({ params }: Props) {
  const { niche } = await params
  const post = getPostBySlug(niche, "link-building-for")

  if (!post) notFound()

  const { meta, content } = post
  const articleBody = getArticleBody(content)
  const headings = getArticleHeadings(articleBody)
  const author = meta.author === "Unknown" ? "Nicolas More" : meta.author
  const relatedGuides = getRelatedWithFallback(niche, "link-building-for")
  const NicheIcon = getNicheCardIcon(niche)

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
    url: `https://mentiohunt.com/link-building-for/${meta.slug}`,
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
              href="/link-building-for"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <IconArrowLeft size={14} stroke={2} />
              Back to link building for
            </Link>

            <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(460px,560px)] lg:items-end lg:gap-16">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-princeton-orange)] uppercase">
                  <NicheIcon size={14} stroke={2.5} />
                  <span>{meta.category ?? "Industry Playbook"}</span>
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
                    Founder of Mentiohunt. Built the company&apos;s own backlink
                    pipeline across multiple industries before turning it into
                    a product. Writes about link prospecting and founder-led
                    distribution.
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
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-princeton-orange)] uppercase">
                  <IconTargetArrow size={14} stroke={2.5} />
                  <span>Built for founders</span>
                </div>
                <p className="mt-3 font-heading text-2xl font-semibold tracking-[-0.03em] text-balance">
                  Turn this playbook into a recurring opportunity queue.
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Mentiohunt turns your article URLs, competitors, and keywords
                  into a scored queue of backlink opportunities with contact
                  details and outreach drafts ready to send.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/signup"
                    className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--color-princeton-orange)] px-5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:bg-[var(--color-blaze-orange-2)]"
                  >
                    Start your first queue
                  </Link>
                  <Link
                    href="/link-building-for"
                    className="inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Browse all industry playbooks
                  </Link>
                </div>
              </div>
            </article>

            <ArticleTableOfContents headings={headings} />
          </div>

          <RelatedResourcesSection
            eyebrow="Keep the queue moving"
            heading="More industry playbooks worth opening next."
            description="Jump to adjacent industries to see how the same tactics adapt to a different audience and site ecosystem."
            items={relatedGuides}
            basePath="/link-building-for"
            browseAllHref="/link-building-for"
            browseAllLabel="Browse all industry playbooks"
            getItemIcon={getNicheCardIcon}
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
