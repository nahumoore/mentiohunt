import Link from "next/link"
import { IconArrowRight } from "@tabler/icons-react"

import type { FreeToolName } from "@/consts/free-tools"
import {
  getFreeToolEntry,
  RELATED_FREE_TOOLS,
} from "@/consts/free-tools-directory"

export function RelatedFreeTools({ currentSlug }: { currentSlug: FreeToolName }) {
  const related = (RELATED_FREE_TOOLS[currentSlug] ?? [])
    .map((slug) => getFreeToolEntry(slug))
    .filter((tool) => tool !== undefined)

  if (related.length === 0) return null

  return (
    <section className="border-t border-border/60 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
            Keep going
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Related free tools
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Other free checks that pair well with this one.
          </p>
        </div>

        <div className="mx-auto mt-10 grid gap-5 sm:grid-cols-3">
          {related.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.slug}
                href={`/free-tools/${tool.slug}`}
                className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-blaze-orange/25 hover:bg-blaze-orange/[0.025]"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blaze-orange/8 text-(--color-princeton-orange)">
                  <Icon size={22} stroke={2} />
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                    {tool.eyebrow}
                  </p>
                  <h3 className="font-heading text-base font-semibold tracking-tight">
                    {tool.name}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {tool.description}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-(--color-princeton-orange)">
                  Try it
                  <IconArrowRight
                    size={14}
                    stroke={2.4}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
