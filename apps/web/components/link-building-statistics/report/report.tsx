import type { Edition } from "@/content/link-building-statistics/types"
import { AutomationCta } from "@/components/free-tools"

import { buildChartSpecs } from "../shared/chart-specs"
import { CHART_SCOPE, ChartTokens } from "../shared/chart-tokens"
import { CiteBox } from "../shared/cite-box"
import { MIN_SAMPLE_SIZE } from "../shared/constants"
import { EditionProvider } from "../shared/edition-context"
import { ReportFigure } from "./figure"

/**
 * Reads like a research report: narrow measure, numbered sections, numbered
 * figures, citation apparatus — built so another blog can quote it and link back.
 */
export function StatisticsReport({ edition }: { edition: Edition }) {
  const { meta, heroParagraph, keyFindings } = edition
  const overallReplyRate = meta.uniqueRepliedProspects / meta.prospectsContacted
  const chartSpecs = buildChartSpecs(edition)

  const masthead = [
    { label: "Dataset", value: `${meta.totalSent.toLocaleString()} emails` },
    { label: "Reply rate", value: `${(overallReplyRate * 100).toFixed(1)}%` },
    { label: "Products", value: `${meta.distinctProducts}` },
    { label: "Updated", value: meta.lastUpdatedLabel },
  ]

  const methodNotes = [
    "Counted from platform logs, not self-reported by anyone. A send is a row in the outreach event log; a reply is an inbound message matched back to that prospect thread.",
    "Reply rate is replies per prospect contacted. Where a breakdown uses a different denominator — emails sent, or inbound messages — the chart says so.",
    "Bounces and automated out-of-office replies never count as a reply, in the headline rate or in any chart.",
    `Any bucket with fewer than ${MIN_SAMPLE_SIZE} contacted prospects is reported as insufficient sample instead of being given a rate.`,
    "Aggregates only. No customer, domain, or recipient is identifiable in any figure on this page.",
  ]

  return (
    <EditionProvider edition={edition}>
      <div className={CHART_SCOPE}>
        <ChartTokens />

        <header className="px-4 pt-28 sm:px-6 sm:pt-32 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="font-heading text-[0.68rem] font-bold uppercase tracking-[0.2em] text-(--color-princeton-orange)">
              Mentiohunt Research · Report 01
            </p>
            <h1 className="mt-4 max-w-3xl font-heading text-4xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl">
              Link building statistics from {meta.totalSent.toLocaleString()}{" "}
              real outreach emails
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              {heroParagraph}
            </p>

            <dl className="mt-9 grid grid-cols-2 gap-y-5 border-y border-border py-5 sm:grid-cols-4">
              {masthead.map((item) => (
                <div key={item.label}>
                  <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                    {item.label}
                  </dt>
                  <dd className="mt-1 font-heading text-xl font-semibold tracking-tight tabular-nums">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </header>

        <div className="px-4 pb-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-14">
            <aside className="hidden lg:block">
              <div className="sticky top-24 pt-12">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                  Contents
                </p>
                <ol className="mt-3 border-l border-border">
                  {chartSpecs.map((spec, index) => (
                    <li key={spec.id}>
                      <a
                        href={`#${spec.id}`}
                        className="-ml-px flex gap-2 border-l-2 border-transparent py-1.5 pl-3 text-xs leading-5 text-muted-foreground transition-colors hover:border-l-[var(--color-blaze-orange)] hover:text-foreground"
                      >
                        <span className="tabular-nums text-muted-foreground/50">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {spec.navLabel}
                      </a>
                    </li>
                  ))}
                </ol>
                <a
                  href="#cite"
                  className="mt-5 inline-block border-t border-border pt-4 text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
                >
                  How to cite this page
                </a>
              </div>
            </aside>

            <div className="min-w-0 max-w-[44rem] pt-12">
              <section>
                <h2 className="font-heading text-[0.7rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  What the data shows
                </h2>
                <ul className="mt-4 divide-y divide-border border-y border-border">
                  {keyFindings.map((finding) => (
                    <li
                      key={finding.stat}
                      className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-6"
                    >
                      <span className="w-24 shrink-0 font-heading text-2xl font-semibold tracking-[-0.03em] text-(--color-princeton-orange) tabular-nums">
                        {finding.stat}
                      </span>
                      <p className="text-sm leading-7 text-muted-foreground">
                        {finding.body}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>

              <aside className="mt-10 rounded-r-2xl border border-l-2 border-border border-l-[var(--color-blaze-orange)] bg-muted/25 p-5 sm:p-6">
                <h2 className="font-heading text-sm font-semibold tracking-tight">
                  How this data was collected
                </h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {meta.totalSent.toLocaleString()} outreach emails to{" "}
                  {meta.totalProspects.toLocaleString()} tracked prospects
                  across {meta.distinctProducts} customer products,{" "}
                  {meta.dateRangeLabel}.{" "}
                  {meta.uniqueRepliedProspects} of those prospects replied,
                  producing {meta.totalInboundMessages} genuine inbound messages
                  (bounces and auto-replies excluded).
                </p>
                <ul className="mt-3 space-y-2">
                  {methodNotes.map((note) => (
                    <li
                      key={note}
                      className="relative pl-4 text-xs leading-6 text-muted-foreground before:absolute before:left-0 before:top-[0.6em] before:size-1.5 before:rounded-full before:bg-(--color-princeton-orange)/60"
                    >
                      {note}
                    </li>
                  ))}
                </ul>
              </aside>

              {chartSpecs.map((spec, index) => (
                <section
                  key={spec.id}
                  id={spec.id}
                  className="mt-14 scroll-mt-24 first-of-type:mt-14"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-heading text-xs font-bold tabular-nums text-muted-foreground/50">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h2 className="font-heading text-2xl font-semibold tracking-[-0.035em] text-balance sm:text-[1.7rem]">
                      {spec.title}
                    </h2>
                  </div>
                  <p className="mt-3 text-[0.97rem] leading-8 text-muted-foreground">
                    {spec.narrative}
                  </p>
                  <ReportFigure spec={spec} index={index + 1} />
                </section>
              ))}

              <section id="cite" className="mt-16 scroll-mt-24">
                <h2 className="font-heading text-[0.7rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Citing this report
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Reuse any figure on this page, in any format, as long as the
                  number is credited to Mentiohunt with a link back. Every chart
                  above has a copy-stat button that includes the citation, and an
                  embed option that keeps the attribution attached.
                </p>
                <div className="mt-4">
                  <CiteBox />
                </div>
              </section>
            </div>
          </div>
        </div>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <AutomationCta
              eyebrow="Where this data comes from"
              heading="Every number above came out of Mentiohunt running outreach on autopilot."
              body="Mentiohunt finds sites where your article genuinely fits, writes and sends the outreach, and hands the conversation to you the moment a prospect replies."
              ctaLabel="See how it works"
              ctaHref="/#how-it-works"
            />
          </div>
        </section>
      </div>
    </EditionProvider>
  )
}
