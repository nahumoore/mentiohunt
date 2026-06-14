"use client"

import { Highlighter } from "@workspace/ui/components/highlighter"
import { IconCircleCheckFilled, IconExternalLink } from "@tabler/icons-react"

type Factor = {
  label: string
  sublabel: string
  value: number
}

const factors: Factor[] = [
  {
    label: "Mentions across blogs, forums & news",
    sublabel: "Product web mentions",
    value: 0.664,
  },
  {
    label: "Editorial backlinks citing your product",
    sublabel: "Product anchor text",
    value: 0.527,
  },
  {
    label: "Product search volume",
    sublabel: "People searching for your product",
    value: 0.392,
  },
  {
    label: "Domain authority (DR)",
    sublabel: "Overall site authority",
    value: 0.326,
  },
  {
    label: "Backlink diversity",
    sublabel: "Number of referring domains",
    value: 0.295,
  },
]


function isCoveredIndex(index: number): boolean {
  return index === 0 || index >= 3
}

function getBarClass(index: number): string {
  if (index === 0)
    return "bg-[var(--color-blaze-orange)] shadow-[0_2px_18px_-4px_rgba(255,84,0,0.55)]"
  if (index >= 3) return "bg-[var(--color-blaze-orange)]/70"
  return "bg-muted-foreground/25"
}

function getValueClass(index: number): string {
  if (isCoveredIndex(index)) return "text-[var(--color-blaze-orange)]"
  return "text-muted-foreground/60"
}

function getLabelClass(index: number): string {
  if (isCoveredIndex(index)) return "text-foreground"
  return "text-muted-foreground/70"
}

function FactorRow({ factor, index }: { factor: Factor; index: number }) {
  const pct = Math.round(factor.value * 100)
  const isCovered = isCoveredIndex(index)

  return (
    <div className={`py-3.5 ${index > 0 ? "border-t border-border/50" : ""}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
        <div className="sm:w-64 sm:shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 shrink-0">
              {isCovered && (
                <IconCircleCheckFilled className="h-3.5 w-3.5 text-[var(--color-blaze-orange)]" />
              )}
            </div>
            <p className={`text-sm font-semibold ${getLabelClass(index)}`}>
              {factor.label}
            </p>
          </div>
          <p className="mt-0.5 pl-5 text-[0.68rem] font-medium text-muted-foreground/60">
            {factor.sublabel}
          </p>
        </div>

        <div className="flex flex-1 items-center gap-3">
          <div className="relative h-7 flex-1 overflow-hidden rounded-full bg-muted/50">
            <div
              className={`h-full rounded-full ${getBarClass(index)}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span
            className={`w-10 shrink-0 text-right text-sm font-bold tabular-nums ${getValueClass(index)}`}
          >
            {factor.value}
          </span>
        </div>
      </div>
    </div>
  )
}

export function BrandMentionSources() {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-princeton-orange)]/6 blur-[120px]" />
        <div className="absolute top-0 right-0 h-[20rem] w-[20rem] translate-x-1/3 -translate-y-1/4 rounded-full bg-[var(--color-amber-flame)]/7 blur-[90px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
            AI Visibility
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-[var(--color-blaze-orange)]/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            <Highlighter color="#ff540033" animationDuration={800} isView>
              Product mentions
            </Highlighter>{" "}
            are the #1 signal for appearing in AI answers
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Ahrefs analyzed 75,000 brands to find what most predicts whether AI
            mentions your product. One signal stood above DR, backlinks, and
            search volume combined.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-4xl">
          {factors.map((factor, index) => (
            <FactorRow key={factor.label} factor={factor} index={index} />
          ))}

          <div className="relative mt-8 overflow-hidden rounded-xl ring-1 ring-[var(--color-blaze-orange)]/12">
            <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-[var(--color-blaze-orange)] via-[var(--color-pumpkin-spice)]/70 to-[var(--color-blaze-orange)]/20" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--color-blaze-orange)]/[0.07] to-transparent" />
            <div className="relative flex flex-col gap-3 py-4 pl-6 pr-5 sm:flex-row sm:items-center sm:gap-8">
              <p className="shrink-0 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--color-blaze-orange)]">
                Mentiohunt covers
              </p>
              <div className="h-px bg-[var(--color-blaze-orange)]/15 sm:hidden" />
              <div className="flex flex-wrap gap-2">
                {[
                  "Web mentions",
                  "Domain authority",
                  "Backlink diversity",
                ].map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-blaze-orange)]/10 px-3 py-1 text-[0.72rem] font-semibold text-[var(--color-blaze-orange)] ring-1 ring-[var(--color-blaze-orange)]/25"
                  >
                    <IconCircleCheckFilled className="h-3 w-3 shrink-0" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center border-t border-border/50 pt-4">
            <p className="text-[0.65rem] text-muted-foreground">
              Source:{" "}
              <a
                href="https://ahrefs.com/blog/ai-overview-brand-correlation/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
              >
                Ahrefs AI Overview Brand Correlation Study
                <IconExternalLink className="h-2.5 w-2.5" />
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
