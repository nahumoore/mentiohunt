// The contract between the data layer and the report components. An "edition"
// is one year's worth of published numbers — see `2026.ts` for the current one
// and `index.ts` for how editions are registered.
//
// This file is also the contract the `/statistics-article` skill
// writes against (see .claude/skills/statistics-article/SKILL.md):
// it queries the database, computes everything below, and writes a whole
// `<year>.ts` file. Nothing here should require a database migration or a
// cron job to keep current — nothing here is invented, everything traces to
// a query result at the time the edition was written.

export type ChartId =
  | "reply-rate-trend"
  | "reply-rate-by-domain-rating"
  | "reply-rate-by-site-fit"
  | "time-to-first-reply"
  | "reply-classification"
  | "follow-up-lift"

/** Fixed chart set for every edition, in page order. */
export const ALL_CHART_IDS: ChartId[] = [
  "reply-rate-trend",
  "reply-rate-by-domain-rating",
  "reply-rate-by-site-fit",
  "time-to-first-reply",
  "reply-classification",
  "follow-up-lift",
]

/**
 * A bucketed reply-rate row. `sends` is the row's denominator — for the
 * per-email trend chart that's emails sent, for the DR/fit tier charts it's
 * contacted prospects. `bucketReplyRate` in `derive.ts` doesn't care which;
 * every chart spec says explicitly which one it's using.
 */
export interface BucketStat {
  label: string
  sends: number
  replies: number
}

export interface DatasetMeta {
  /** Emails sent (`prospect_sequences` rows with status = 'sent'). */
  totalSent: number
  /** Distinct prospects that received at least one send. */
  prospectsContacted: number
  /** Distinct prospects with a genuine reply (bounce/auto-reply excluded). */
  uniqueRepliedProspects: number
  /** Genuine inbound messages only — bounce/auto-reply excluded, matches the
   *  reply-classification chart's denominator. */
  totalInboundMessages: number
  totalProspects: number
  prospectsWithDomainRating: number
  prospectsWithRelevanceScore: number
  distinctProducts: number
  /** Human-readable range, e.g. "Jul 13 – Aug 19, 2026". */
  dateRangeLabel: string
  /** Human-readable "last refreshed" label shown in the masthead. */
  lastUpdatedLabel: string
  /** ISO date, used for JSON-LD `datePublished`/`dateModified`. */
  publishedLabel: string
}

export interface KeyFinding {
  stat: string
  body: string
}

/**
 * Editorial copy for one chart. Every figure quoted in `narrative`/`stat`/
 * `note` must trace to the numbers in `series` below — the skill regenerates
 * this text from the computed numbers each run rather than leaving stale
 * claims in place after a refresh.
 */
export interface ChartCopy {
  navLabel: string
  title: string
  subtitle: string
  narrative: string
  stat: string
  sourceLine: string
  note?: string
}

export interface EditionSeries {
  monthlyTrend: { label: string; sends: number; replies: number }[]
  replyRateByDomainRating: BucketStat[]
  replyRateByRelevance: BucketStat[]
  timeToFirstReply: { label: string; count: number }[]
  replyClassification: {
    label: string
    count: number
    tone: "good" | "info" | "bad"
  }[]
  sequenceStepLift: BucketStat[]
}

export interface Edition {
  year: number
  meta: DatasetMeta
  /** Sub-headline paragraph under the H1. */
  heroParagraph: string
  keyFindings: KeyFinding[]
  series: EditionSeries
  copy: Record<ChartId, ChartCopy>
}
