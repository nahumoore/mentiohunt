import { bucketReplyRate, deriveSequenceCumulative } from "@/content/link-building-statistics/derive"
import type { ChartId, Edition } from "@/content/link-building-statistics/types"

export type { ChartId }

import { MIN_SAMPLE_SIZE } from "./constants"
import { num, pct } from "./svg-geometry"

export interface ChartTable {
  columns: string[]
  rows: string[][]
}

export interface ChartSpec {
  id: ChartId
  /** Short label for the table of contents. */
  navLabel: string
  title: string
  /** One line, also printed on the exported image. */
  subtitle: string
  /** Longer prose — used by the editorial layout. */
  narrative: string
  /** The single citable claim this chart supports. */
  stat: string
  /** Sample size / range line, printed on the exported image. */
  sourceLine: string
  /** Caveat shown under the chart, where one is needed. */
  note?: string
  table: ChartTable
}

/**
 * Builds every chart's presentation spec for one edition: authored/generated
 * copy from `edition.copy` merged with a table whose rows are always
 * recomputed straight from `edition.series` — so a table can never drift
 * out of sync with the prose that quotes it, even if the copy text does.
 */
export function buildChartSpecs(edition: Edition): ChartSpec[] {
  const { series, copy } = edition
  const cumulative = deriveSequenceCumulative(series.sequenceStepLift)

  const specs: ChartSpec[] = [
    {
      id: "reply-rate-trend",
      ...copy["reply-rate-trend"],
      table: {
        columns: ["Month", "Emails sent", "Replies", "Reply rate"],
        rows: series.monthlyTrend.map((m) => [
          `${m.label} ${edition.year}`,
          num(m.sends),
          num(m.replies),
          pct(m.sends > 0 ? m.replies / m.sends : 0),
        ]),
      },
    },
    {
      id: "reply-rate-by-domain-rating",
      ...copy["reply-rate-by-domain-rating"],
      table: {
        columns: ["Domain Rating tier", "Prospects contacted", "Replies", "Reply rate"],
        rows: series.replyRateByDomainRating.map((b) => [
          b.label,
          num(b.sends),
          num(b.replies),
          pct(bucketReplyRate(b)),
        ]),
      },
    },
    {
      id: "reply-rate-by-site-fit",
      ...copy["reply-rate-by-site-fit"],
      table: {
        columns: ["Site fit score", "Prospects contacted", "Replies", "Reply rate"],
        rows: series.replyRateByRelevance.map((b) => [
          b.label,
          num(b.sends),
          num(b.replies),
          b.sends < MIN_SAMPLE_SIZE ? "Insufficient sample" : pct(bucketReplyRate(b)),
        ]),
      },
    },
    {
      id: "time-to-first-reply",
      ...copy["time-to-first-reply"],
      table: {
        columns: ["Time to first reply", "First replies", "Share of replies"],
        rows: series.timeToFirstReply.map((d) => [
          d.label,
          num(d.count),
          pct(d.count / edition.meta.uniqueRepliedProspects),
        ]),
      },
    },
    {
      id: "reply-classification",
      ...copy["reply-classification"],
      table: {
        columns: ["Reply type", "Messages", "Share of replies"],
        rows: series.replyClassification.map((d) => [
          d.label,
          num(d.count),
          pct(d.count / edition.meta.totalInboundMessages),
        ]),
      },
    },
    {
      id: "follow-up-lift",
      ...copy["follow-up-lift"],
      table: {
        columns: [
          "Sequence step",
          "Prospects replied (cumulative)",
          "Share of contacted",
          "Added by this step",
        ],
        rows: cumulative.map((step, index) => {
          const previous = cumulative[index - 1]
          const denominator = edition.meta.prospectsContacted
          const share = step.replies / denominator
          const previousShare = previous ? previous.replies / denominator : 0
          return [
            step.label,
            num(step.replies),
            pct(share),
            index === 0 ? "—" : `+${((share - previousShare) * 100).toFixed(1)}pt`,
          ]
        }),
      },
    },
  ]

  return specs
}

export function getChartSpec(edition: Edition, id: string): ChartSpec | undefined {
  return buildChartSpecs(edition).find((spec) => spec.id === id)
}
