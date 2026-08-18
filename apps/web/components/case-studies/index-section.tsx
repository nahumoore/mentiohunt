import {
  IconArrowRight,
  IconCalendar,
  IconTrendingUp,
} from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"

import type { BlogPostMeta } from "@/lib/mdx"

function getSummary(post: BlogPostMeta): string {
  return post.description || post.excerpt || ""
}

function getFaviconUrl(siteUrl: string): string {
  const domain = new URL(siteUrl).hostname
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
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

export function CaseStudiesIndexSection({
  studies,
}: {
  studies: BlogPostMeta[]
}) {
  return (
    <section className="relative overflow-hidden bg-background py-10 sm:py-12 lg:py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-10 right-10 h-64 w-64 rounded-full bg-princeton-orange/7 blur-[100px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {studies.length > 0 ? (
          <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-2 xl:grid-cols-3">
            {studies.map((study) => (
              <Link
                key={study.slug}
                href={`/case-studies/${study.slug}`}
                className="group relative overflow-hidden rounded-[1.9rem] border border-border/80 bg-card/95 shadow-[0_20px_70px_-48px_rgba(17,17,17,0.35)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--color-blaze-orange)]/28 hover:shadow-[0_28px_90px_-44px_rgba(255,96,0,0.38)]"
              >
                {study.image && (
                  <div className="relative aspect-[16/9] overflow-hidden border-b border-border/70 bg-muted">
                    <Image
                      src={study.image}
                      alt={study.imageAlt ?? study.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
                  </div>
                )}

                <div className="relative px-6 pt-4 pb-6">
                  <div className="flex items-start gap-4">
                    {study.metric && (
                      <span className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-muted/70 px-2.5 py-1 text-[0.7rem] font-semibold text-foreground">
                        <IconTrendingUp size={12} stroke={2.4} />
                        {study.metric}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 font-heading text-[1.55rem] leading-tight font-semibold tracking-[-0.04em] text-foreground transition-colors group-hover:text-[var(--color-princeton-orange)]">
                    {study.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">
                    {getSummary(study)}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <IconCalendar size={12} stroke={2} />
                      {formatDate(study.date)}
                    </span>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      {study.companyUrl && (
                        <Image
                          src={getFaviconUrl(study.companyUrl)}
                          alt=""
                          width={14}
                          height={14}
                          className="rounded-sm"
                          unoptimized
                        />
                      )}
                      {study.company ?? "Customer story"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-princeton-orange)] transition-all duration-200 group-hover:gap-1.5">
                      Read case study
                      <IconArrowRight size={13} stroke={2.4} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mx-auto mt-14 max-w-4xl rounded-[1.85rem] border border-border bg-muted/35 px-8 py-10 text-sm leading-7 text-muted-foreground">
            <p className="font-medium text-foreground">
              No published case studies yet.
            </p>
            <p className="mt-2">
              Add a non-draft MDX file to <code>resources/case-studies</code>{" "}
              to publish the first one here. See{" "}
              <Link
                href="/case-studies/template-placeholder"
                className="text-[var(--color-princeton-orange)] underline underline-offset-2"
              >
                the template placeholder
              </Link>{" "}
              for the fields and sections each case study needs.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
