import { IconCheck, IconMinus } from "@tabler/icons-react"

import type { FeaturePage } from "@/consts/features"

type Props = {
  feature: Pick<FeaturePage, "comparison">
}

export function FeatureComparison({ feature }: Props) {
  const { comparison } = feature

  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 top-20 h-80 w-80 rounded-full bg-princeton-orange/7 blur-[100px]" />
        <div className="absolute -left-24 bottom-20 h-72 w-72 rounded-full bg-amber-glow/7 blur-[100px]" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
            How it compares
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            {comparison.caption}
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Not every tool built for this problem is actually built for founders.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-border bg-muted/40">
            <div className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">
              Factor
            </div>
            <div className="border-l border-border px-6 py-4 text-xs font-bold text-muted-foreground uppercase">
              Others
            </div>
            <div className="border-l border-[var(--color-blaze-orange)]/30 bg-[var(--color-blaze-orange)]/5 px-6 py-4">
              <span className="text-xs font-bold text-(--color-blaze-orange) uppercase">
                Mentiohunt
              </span>
            </div>
          </div>

          {/* Rows */}
          {comparison.rows.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-[1fr_1fr_1fr] border-b border-border last:border-b-0 ${
                i % 2 === 1 ? "bg-muted/20" : ""
              }`}
            >
              <div className="flex items-center px-6 py-4">
                <span className="text-sm font-medium text-foreground">
                  {row.label}
                </span>
              </div>
              <div className="flex items-center gap-2.5 border-l border-border px-6 py-4">
                <IconMinus
                  size={15}
                  stroke={2.5}
                  className="shrink-0 text-muted-foreground/50"
                />
                <span className="text-sm text-muted-foreground">{row.others}</span>
              </div>
              <div className="flex items-center gap-2.5 border-l border-[var(--color-blaze-orange)]/30 bg-[var(--color-blaze-orange)]/5 px-6 py-4">
                <IconCheck
                  size={15}
                  stroke={2.5}
                  className="shrink-0 text-(--color-blaze-orange)"
                />
                <span className="text-sm font-medium text-foreground">
                  {row.mentiohunt}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
