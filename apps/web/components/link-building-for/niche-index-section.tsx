import { IconCalendar, IconClock } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"

import type { BlogPostMeta } from "@/lib/mdx"

import { getNicheCardIcon, IconArrowRight } from "./data"

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
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate)
}

export function LinkBuildingForNicheIndexSection({
  guides,
}: {
  guides: BlogPostMeta[]
}) {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-10 right-10 h-64 w-64 rounded-full bg-princeton-orange/7 blur-[100px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
            Industry Index
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            Pick the playbook built for your industry.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Each guide covers the sites, tactics, and outreach angles that
            actually work for founders in that niche.
          </p>
        </div>

        {guides.length > 0 ? (
          <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-2 xl:grid-cols-3">
            {guides.map((guide) => {
              const Icon = getNicheCardIcon(guide.slug)

              return (
                <Link
                  key={guide.slug}
                  href={`/link-building-for/${guide.slug}`}
                  className="group relative overflow-hidden rounded-[1.9rem] border border-border/80 bg-card/95 shadow-[0_20px_70px_-48px_rgba(17,17,17,0.35)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--color-blaze-orange)]/28 hover:shadow-[0_28px_90px_-44px_rgba(255,96,0,0.38)]"
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/5 to-transparent" />
                    </div>
                  )}

                  <div className="relative p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-blaze-orange)]/18 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-[0.68rem] font-bold text-[var(--color-princeton-orange)] uppercase">
                        <Icon className="h-4 w-4" />
                        {guide.category ?? "Industry Playbook"}
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

                    <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <IconClock size={12} stroke={2} />
                        {getReadTimeLabel(guide.readTime)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <IconCalendar size={12} stroke={2} />
                        {formatDate(guide.date)}
                      </span>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4">
                      <span className="text-xs font-medium text-muted-foreground">
                        Industry playbook
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-princeton-orange)] transition-all duration-200 group-hover:gap-1.5">
                        Open guide
                        <IconArrowRight size={13} stroke={2.4} />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="mx-auto mt-14 max-w-4xl rounded-[1.85rem] border border-border bg-muted/35 px-8 py-10 text-sm leading-7 text-muted-foreground">
            <p className="font-medium text-foreground">
              No industry playbooks published yet.
            </p>
            <p className="mt-2">
              Add MDX files to <code>resources/link-building-for</code> to
              publish spoke pages here.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
