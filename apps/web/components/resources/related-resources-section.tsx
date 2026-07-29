import { IconArrowRight, IconLink } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import type { ComponentType } from "react"

import type { BlogPostMeta } from "@/lib/mdx"

type IconComponent = ComponentType<{ className?: string }>

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

export function RelatedResourcesSection({
  eyebrow = "Keep reading",
  heading,
  description,
  items,
  basePath,
  browseAllHref,
  browseAllLabel = "Browse all",
  showImages = true,
  getItemIcon,
}: {
  eyebrow?: string
  heading: string
  description: string
  items: BlogPostMeta[]
  basePath: string
  browseAllHref?: string
  browseAllLabel?: string
  showImages?: boolean
  getItemIcon?: (slug: string) => IconComponent
}) {
  if (items.length === 0) return null

  return (
    <section className="mt-20 border-t border-border/60 pt-14 sm:pt-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-[0.68rem] font-bold text-[var(--color-princeton-orange)] uppercase">
            <IconLink size={13} stroke={2.4} />
            {eyebrow}
          </div>
          <h2 className="mt-4 font-heading text-3xl font-semibold tracking-[-0.04em] text-balance">
            {heading}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>

        {browseAllHref && (
          <Link
            href={browseAllHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {browseAllLabel}
            <IconArrowRight size={14} stroke={2.2} />
          </Link>
        )}
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const Icon = getItemIcon?.(item.slug) ?? IconLink

          return (
            <Link
              key={item.slug}
              href={`${basePath}/${item.slug}`}
              className="group relative overflow-hidden rounded-[1.9rem] border border-border/80 bg-card/95 shadow-[0_20px_70px_-48px_rgba(17,17,17,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-blaze-orange)]/28 hover:shadow-[0_28px_90px_-44px_rgba(255,96,0,0.38)]"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_right,var(--color-amber-glow)_0%,transparent_70%)] opacity-20" />
                <div className="absolute right-0 bottom-0 h-24 w-24 rounded-full bg-[var(--color-princeton-orange)]/8 blur-3xl" />
              </div>

              {showImages && item.image && (
                <div className="relative aspect-[16/9] overflow-hidden border-b border-border/70 bg-muted">
                  <Image
                    src={item.image}
                    alt={item.imageAlt ?? item.title}
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
                    {item.category ?? "Resource"}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2.5 py-1 text-[0.7rem] font-medium text-muted-foreground">
                    {getReadTimeLabel(item.readTime)}
                  </span>
                </div>

                <h3 className="mt-5 font-heading text-[1.55rem] leading-tight font-semibold tracking-[-0.04em] text-foreground transition-colors group-hover:text-[var(--color-princeton-orange)]">
                  {item.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">
                  {getSummary(item)}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4 text-sm">
                  <span className="text-muted-foreground">
                    {formatDate(item.date)}
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
  )
}
