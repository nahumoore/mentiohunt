import {
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
  return getResourceSlugs("backlinks-from").map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug, "backlinks-from")

  if (!post) return {}

  const title = post.meta.metaTitle || `${post.meta.title} — Mentiohunt`
  const description = getSummary(post.meta)

  return {
    title,
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
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
                <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-[var(--color-princeton-orange)] uppercase">
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
                    {formatDate(meta.date)}
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

              <div className="mt-14 overflow-hidden rounded-[1.75rem] border border-[var(--color-blaze-orange)]/20 bg-[linear-gradient(135deg,var(--color-background)_0%,color-mix(in_oklab,var(--color-background)_80%,var(--color-amber-glow)_20%)_100%)] p-7 shadow-[0_18px_70px_-34px_rgba(255,133,0,0.5)]">
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
