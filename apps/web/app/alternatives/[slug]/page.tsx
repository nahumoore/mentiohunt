import {
  IconArrowLeft,
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
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate)
}

export async function generateStaticParams() {
  return getResourceSlugs("alternatives").map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug, "alternatives")

  if (!post) return {}

  const title = post.meta.metaTitle || post.meta.title
  const description = getSummary(post.meta)

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `/alternatives/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://mentiohunt.com/alternatives/${slug}`,
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

export default async function AlternativePage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug, "alternatives")

  if (!post) notFound()

  const { meta, content } = post
  const headings = getArticleHeadings(content)
  const author =
    meta.author === "Unknown" ? "Nicolas More" : (meta.author ?? "Nicolas More")
  const relatedAlternatives = getRelatedWithFallback(slug, "alternatives")

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
    url: `https://mentiohunt.com/alternatives/${meta.slug}`,
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
          <div className="pointer-events-none absolute top-0 -right-32 h-80 w-80 rounded-full bg-[var(--color-blaze-orange)]/8 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 -left-20 h-56 w-56 rounded-full bg-[var(--color-amber-glow)]/6 blur-3xl" />

          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/alternatives"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <IconArrowLeft size={14} stroke={2} />
              Back to alternatives
            </Link>

            <div className="mt-9 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-princeton-orange)] uppercase">
                  <IconScale size={13} stroke={2.5} />
                  <span>Honest Comparison</span>
                </div>

                <h1 className="mt-4 font-heading text-4xl leading-tight font-semibold tracking-[-0.045em] text-balance sm:text-5xl">
                  {meta.title}
                </h1>
                <p className="mt-5 text-lg leading-8 text-muted-foreground">
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
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-border">
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

        <div className="container mx-auto px-4 pb-14 sm:px-6 lg:px-8">
          <RelatedResourcesSection
            eyebrow="Pick a tool, then pick a channel"
            heading="More alternatives worth comparing."
            description="See how the other tools in this space stack up before you commit to a switch."
            items={relatedAlternatives}
            basePath="/alternatives"
            browseAllHref="/alternatives"
            browseAllLabel="Browse all alternatives"
            showImages={false}
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
