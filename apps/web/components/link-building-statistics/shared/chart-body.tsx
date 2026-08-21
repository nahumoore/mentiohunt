"use client"

import { deriveSequenceCumulative } from "@/content/link-building-statistics/derive"

import type { ChartId } from "./chart-specs"
import { ClassificationBar } from "./charts/classification-bar"
import { CumulativeSteps } from "./charts/cumulative-steps"
import { RateBars } from "./charts/rate-bars"
import { ReplyColumns } from "./charts/reply-columns"
import { TrendColumns } from "./charts/trend-columns"
import { TrendLine } from "./charts/trend-line"
import { useEdition } from "./edition-context"

/** Below this many months, a line chart implies a trajectory the data can't
 *  support yet — render columns instead. See `TrendColumns`. */
const MIN_MONTHS_FOR_LINE = 4

/**
 * Single place that maps a chart id to its rendered form, so all three page
 * layouts — and the embeddable route — draw the exact same chart from the exact
 * same data. Kept separate from chart-specs.ts because the specs are plain data a
 * server component can read, while these are client components.
 */
export function ChartBody({ chartId }: { chartId: ChartId }) {
  const edition = useEdition()
  const { series, meta } = edition

  switch (chartId) {
    case "reply-rate-trend":
      return series.monthlyTrend.length >= MIN_MONTHS_FOR_LINE ? (
        <TrendLine
          data={series.monthlyTrend}
          gradientId="lbs-grad-trend"
          year={edition.year}
        />
      ) : (
        <TrendColumns data={series.monthlyTrend} />
      )
    case "reply-rate-by-domain-rating":
      return (
        <RateBars data={series.replyRateByDomainRating} hatchId="lbs-hatch-dr" />
      )
    case "reply-rate-by-site-fit":
      return <RateBars data={series.replyRateByRelevance} hatchId="lbs-hatch-fit" />
    case "time-to-first-reply":
      return <ReplyColumns data={series.timeToFirstReply} unit="replies" />
    case "reply-classification":
      return <ClassificationBar data={series.replyClassification} />
    case "follow-up-lift":
      return (
        <CumulativeSteps
          data={deriveSequenceCumulative(series.sequenceStepLift)}
          denominator={meta.prospectsContacted}
        />
      )
  }
}
