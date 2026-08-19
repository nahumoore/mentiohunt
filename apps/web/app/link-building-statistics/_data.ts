// MOCK DATA — placeholder for the design pass only.
// Real numbers will come from a cached aggregate computed by a scheduled
// job in apps/server (see todo/tickets/2026-08-18-link-building-statistics-page.md),
// reading `outreach_events`, `prospect_messages`, `backlink_prospects`,
// and `prospect_sequences`. Every figure below is hand-picked to be
// internally consistent with the real counts noted in the ticket
// (967 sends, 229 unique prospects replied, 1,399 tracked prospects,
// 45 customer products) so the layout reads believably.

export const MIN_SAMPLE_SIZE = 20

export const DATASET_META = {
  totalSent: 967,
  uniqueRepliedProspects: 229,
  totalInboundMessages: 271,
  totalProspects: 1399,
  prospectsWithDomainRating: 1393,
  prospectsWithRelevanceScore: 1372,
  distinctProducts: 45,
  dateRangeLabel: "Jan 2026 – Aug 2026",
  lastUpdatedLabel: "Aug 19, 2026",
}

export const OVERALL_REPLY_RATE =
  DATASET_META.uniqueRepliedProspects / DATASET_META.totalSent

export interface BucketStat {
  label: string
  sends: number
  replies: number
}

function rate(b: BucketStat) {
  return b.sends > 0 ? b.replies / b.sends : 0
}

export const REPLY_RATE_BY_DOMAIN_RATING: BucketStat[] = [
  { label: "DR 0–20", sends: 142, replies: 22 },
  { label: "DR 20–40", sends: 268, replies: 51 },
  { label: "DR 40–60", sends: 311, replies: 79 },
  { label: "DR 60+", sends: 246, replies: 77 },
]

export const REPLY_RATE_BY_RELEVANCE: BucketStat[] = [
  { label: "Very low fit (<0.2)", sends: 14, replies: 1 },
  { label: "Low fit (0.2–0.4)", sends: 47, replies: 5 },
  { label: "Medium fit (0.4–0.7)", sends: 289, replies: 52 },
  { label: "High fit (0.7–0.9)", sends: 412, replies: 108 },
  { label: "Very high fit (0.9+)", sends: 205, replies: 63 },
]

export const TIME_TO_FIRST_REPLY: { label: string; count: number }[] = [
  { label: "< 24 hours", count: 61 },
  { label: "1–3 days", count: 84 },
  { label: "3–7 days", count: 52 },
  { label: "7–14 days", count: 24 },
  { label: "14+ days", count: 8 },
]

export const REPLY_CLASSIFICATION: {
  label: string
  count: number
  tone: "success" | "critical" | "neutral"
}[] = [
  { label: "Interested", count: 118, tone: "success" },
  { label: "Not interested", count: 96, tone: "critical" },
  { label: "Auto-reply / OOO", count: 57, tone: "neutral" },
]

export const SEQUENCE_STEP_LIFT: BucketStat[] = [
  { label: "Step 1 · Initial email", sends: 967, replies: 129 },
  { label: "Step 2 · Follow-up 1", sends: 690, replies: 61 },
  { label: "Step 3 · Follow-up 2", sends: 481, replies: 28 },
  { label: "Step 4 · Follow-up 3", sends: 312, replies: 11 },
]

export { rate as bucketReplyRate }
