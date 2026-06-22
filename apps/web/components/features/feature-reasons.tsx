import { IconArrowRight, IconMessage2 } from "@tabler/icons-react"
import Link from "next/link"

import type { FeaturePage } from "@/consts/features"

type Props = {
  feature: Pick<FeaturePage, "h2" | "reasons" | "relatedArticle">
}

export function FeatureReasons({ feature }: Props) {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 top-20 h-80 w-80 rounded-full bg-princeton-orange/7 blur-[100px]" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
            Why founders use it
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            {feature.h2}
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Mentiohunt gives you enough context to decide what deserves your
            time and what should stay out of the queue.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-5 lg:grid-cols-3">
          {feature.reasons.map((reason) => (
            <div
              key={reason}
              className="rounded-[1.7rem] border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                <IconMessage2 size={22} stroke={2.4} />
              </div>
              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                {reason}
              </p>
            </div>
          ))}
        </div>

        {feature.relatedArticle && (
          <div className="mx-auto mt-12 max-w-6xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Related reading
            </p>
            <Link
              href={feature.relatedArticle.href}
              className="group flex items-center justify-between gap-4 rounded-[1.5rem] border border-border bg-card px-6 py-4 shadow-sm transition-colors hover:border-[var(--color-princeton-orange)]/40 hover:bg-[var(--color-blaze-orange)]/5"
            >
              <span className="text-sm font-medium leading-6 text-foreground group-hover:text-[var(--color-princeton-orange)]">
                {feature.relatedArticle.title}
              </span>
              <IconArrowRight
                size={16}
                stroke={2.5}
                className="shrink-0 text-muted-foreground group-hover:text-[var(--color-princeton-orange)]"
              />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
