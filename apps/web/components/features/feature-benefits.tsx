import { IconChecks } from "@tabler/icons-react"

import type { FeaturePage } from "@/consts/features"

// ─── Preview card illustration ────────────────────────────────────────────────

function PreviewCard({
  preview,
}: {
  preview: FeaturePage["benefits"][number]["preview"]
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-[0_18px_60px_-32px_rgba(0,0,0,0.45)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/60 to-transparent" />
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[var(--color-princeton-orange)]/12 blur-3xl" />

      <div className="relative space-y-3">
        <p className="text-[0.62rem] font-bold text-muted-foreground uppercase">
          {preview.label}
        </p>
        <div className="space-y-2">
          {preview.items.map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-xl border border-[var(--color-blaze-orange)]/20 bg-[var(--color-blaze-orange)]/6 px-3.5 py-3"
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-blaze-orange)]/15 text-[var(--color-princeton-orange)]">
                <IconChecks size={12} stroke={2.5} />
              </span>
              <span className="text-xs leading-5 text-foreground/80">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Benefit row ──────────────────────────────────────────────────────────────

function BenefitRow({
  benefit,
  flip,
}: {
  benefit: FeaturePage["benefits"][number]
  flip: boolean
}) {
  return (
    <article className="grid gap-8 border-t border-border/70 py-10 first:border-t-0 first:pt-0 last:pb-0 lg:grid-cols-2 lg:items-center lg:gap-20">
      <div className={flip ? "lg:order-last" : ""}>
        <p className="mb-4 text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
          {benefit.eyebrow}
        </p>
        <h3 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {benefit.title}
        </h3>
        <p className="mt-3 max-w-lg text-base leading-7 text-muted-foreground">
          {benefit.description}
        </p>
      </div>

      <div className={flip ? "lg:order-first" : ""}>
        <PreviewCard preview={benefit.preview} />
      </div>
    </article>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

type Props = {
  feature: Pick<FeaturePage, "benefits">
}

export function FeatureBenefits({ feature }: Props) {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-24 -right-32 h-[420px] w-[420px] rounded-full bg-[var(--color-princeton-orange)]/7 blur-[100px]" />
        <div className="absolute bottom-20 -left-32 h-[360px] w-[360px] rounded-full bg-[var(--color-amber-flame)]/6 blur-[90px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
            Why it works
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            A better starting point for every outreach.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Content-first matching, rationale included, outreach draft ready. No
            spreadsheets. No guesswork.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-6xl">
          {feature.benefits.map((benefit, i) => (
            <BenefitRow key={benefit.title} benefit={benefit} flip={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  )
}
