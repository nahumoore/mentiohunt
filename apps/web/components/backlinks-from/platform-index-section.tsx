import Image from "next/image"
import Link from "next/link"

import type { BlogPostMeta } from "@/lib/mdx"

import { getPlatformCardIcon, IconArrowRight } from "./data"

function getSummary(post: BlogPostMeta): string {
  return post.description || post.excerpt || ""
}

export function BacklinksFromPlatformIndexSection({
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
          <span className="text-[0.7rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
            Platform Index
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            Platform-specific guides built from the resource library.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Each article in <code>resources/backlinks-from</code> becomes a
            spoke page here. Starting with Reddit first.
          </p>
        </div>

        {guides.length > 0 ? (
          <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-2 xl:grid-cols-3">
            {guides.map((guide) => {
              const Icon = getPlatformCardIcon(guide.slug)

              return (
                <Link
                  key={guide.slug}
                  href={`/backlinks-from/${guide.slug}`}
                  className="group relative overflow-hidden rounded-[1.85rem] border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-blaze-orange)]/25 hover:shadow-[0_24px_70px_-40px_rgba(255,96,0,0.4)]"
                >
                  {guide.image && (
                    <div className="relative -mx-6 -mt-6 mb-6 aspect-[16/9] overflow-hidden border-b border-border bg-muted">
                      <Image
                        src={guide.image}
                        alt={guide.imageAlt ?? guide.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  )}

                  <div className="flex size-12 items-center justify-center rounded-2xl border border-[var(--color-blaze-orange)]/18 bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)] transition-colors group-hover:bg-[var(--color-blaze-orange)] group-hover:text-white">
                    <Icon size={24} stroke={2.1} />
                  </div>

                  <h3 className="mt-6 font-heading text-[1.65rem] font-semibold tracking-[-0.04em] text-foreground">
                    {guide.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {getSummary(guide)}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4">
                    <span className="text-xs font-medium text-muted-foreground">
                      Read guide
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-princeton-orange)] transition-all duration-200 group-hover:gap-1.5">
                      Open article
                      <IconArrowRight size={13} stroke={2.4} />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="mx-auto mt-14 max-w-4xl rounded-[1.85rem] border border-border bg-muted/35 px-8 py-10 text-sm leading-7 text-muted-foreground">
            <p className="font-medium text-foreground">
              No platform guides published yet.
            </p>
            <p className="mt-2">
              Add MDX files to <code>resources/backlinks-from</code> to publish
              spoke pages here.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
