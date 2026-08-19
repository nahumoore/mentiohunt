import {
  IconCalendarStats,
  IconChartHistogram,
  IconDatabase,
  IconServer2,
} from "@tabler/icons-react"

import { DATASET_META, OVERALL_REPLY_RATE } from "@/app/link-building-statistics/_data"

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-6 pt-28 sm:px-6 sm:pt-36 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-princeton-orange/5 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blaze-orange/25 bg-blaze-orange/7 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-(--color-princeton-orange)">
          <IconChartHistogram size={13} stroke={2.4} />
          Proprietary outreach data
        </span>

        <h1 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl lg:text-[3.25rem]">
          Link Building{" "}
          <span className="bg-gradient-to-r from-[var(--color-blaze-orange-2)] via-[var(--color-harvest-orange)] to-[var(--color-amber-flame)] bg-clip-text text-transparent">
            Statistics
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          Real backlink outreach statistics pulled from live campaigns, not
          survey responses. Every number below comes from outreach Mentiohunt
          has actually sent, tracked, and classified.
        </p>
      </div>

      {/* Hero stat callout */}
      <div className="mx-auto mt-10 max-w-2xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/25 bg-card p-8 text-center shadow-[0_28px_90px_-54px_rgba(255,96,0,0.75)] sm:p-10">
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/80 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--color-amber-glow)_0,transparent_17rem)] opacity-[0.10]" />

          <p className="relative text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            Overall cold outreach reply rate
          </p>
          <p className="relative mt-2 font-heading text-6xl font-semibold tracking-[-0.06em] text-(--color-princeton-orange) sm:text-7xl">
            {(OVERALL_REPLY_RATE * 100).toFixed(1)}%
          </p>
          <p className="relative mt-2 text-sm text-muted-foreground">
            {DATASET_META.uniqueRepliedProspects.toLocaleString()} unique
            prospects replied out of{" "}
            {DATASET_META.totalSent.toLocaleString()} emails sent
          </p>
        </div>
      </div>

      {/* Methodology box */}
      <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-border bg-muted/30 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <IconDatabase size={16} className="text-muted-foreground/70" stroke={2.2} />
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
            Methodology
          </p>
        </div>
        <p className="mt-2.5 text-sm leading-7 text-muted-foreground">
          Sourced directly from Mentiohunt&apos;s outreach platform —{" "}
          <strong className="text-foreground">
            {DATASET_META.totalSent.toLocaleString()} emails
          </strong>{" "}
          sent to{" "}
          <strong className="text-foreground">
            {DATASET_META.totalProspects.toLocaleString()} prospects
          </strong>{" "}
          across{" "}
          <strong className="text-foreground">
            {DATASET_META.distinctProducts} customer products
          </strong>
          , {DATASET_META.dateRangeLabel}. Not a survey, not aggregated from
          third-party reports — every figure below reflects real automated
          backlink outreach and its actual reply outcomes.
        </p>
        <div className="mt-3.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground/80">
          <span className="inline-flex items-center gap-1.5">
            <IconServer2 size={13} stroke={2.2} />
            n = {DATASET_META.totalSent.toLocaleString()} sends
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="inline-flex items-center gap-1.5">
            <IconCalendarStats size={13} stroke={2.2} />
            Last updated {DATASET_META.lastUpdatedLabel}
          </span>
        </div>
      </div>
    </section>
  )
}
