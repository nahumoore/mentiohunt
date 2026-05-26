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
import remarkGfm from "remark-gfm"

import { Footer } from "@/components/landing/footer"
import { Navbar } from "@/components/landing/navbar"
import { ArticleTableOfContents } from "@/components/resources/article-table-of-contents"
import BlogStylings from "@/components/resources/blog-stylings"
import { getArticleHeadings } from "@/lib/mdx-headings"
import { getPostBySlug, getResourceSlugs, type BlogPostMeta } from "@/lib/mdx"

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

  return (
    <div className="flex min-h-screen flex-col bg-background">
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
                <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-[var(--color-princeton-orange)] uppercase">
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
                    {formatDate(meta.date)}
                  </span>
                  <a
                    href="https://x.com/nicolasmore_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                  >
                    <IconBrandX size={14} stroke={2} />
                    Nicolas More
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
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-[var(--color-blaze-orange)]/35 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-background)_80%,var(--color-amber-glow)_20%),var(--color-background))] text-[0.65rem] font-bold tracking-[0.14em] text-[var(--color-princeton-orange)] shadow-[0_0_16px_-4px_rgba(255,133,0,0.3)] uppercase">
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

              {/* CTA */}
              <div className="mt-14 rounded-2xl border border-[var(--color-blaze-orange)]/20 bg-[linear-gradient(135deg,var(--color-background)_0%,color-mix(in_oklab,var(--color-background)_82%,var(--color-amber-glow)_18%)_100%)] p-7 shadow-[0_8px_40px_-12px_rgba(255,133,0,0.16)]">
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
