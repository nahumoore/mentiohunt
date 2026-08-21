// REAL DATA — queried directly from production Supabase on 2026-08-19.
// See todo/tickets/2026-08-18-link-building-statistics-page.md for the
// original proposal and the "Real data migration plan" section for how the
// numbers below were defined.
//
// This file is written by the `/statistics-article` skill
// (.claude/skills/statistics-article/SKILL.md) — regenerate it by
// running that skill rather than hand-editing individual numbers, so the
// prose in `copy` always traces to the numbers in `series`.
//
// Dataset is five weeks old (outreach started 2026-07-13). Every rate below
// is small-sample; the copy says so rather than overstating it. Two
// structural findings drive several of the sections:
//   - the classification taxonomy backfill described in the ticket has not
//     run yet, so `replyClassification` uses the platform's current raw
//     labels (human_reply / needs_review / negative_reply), not the locked
//     8-value taxonomy
//   - 426 of 434 contacted prospects score 0.9+ on site-fit — Mentiohunt
//     filters for fit before sending, so the low-fit tiers are genuinely
//     empty rather than under-sampled

import type { Edition } from "./types"

export const EDITION_2026: Edition = {
  year: 2026,

  meta: {
    totalSent: 815,
    prospectsContacted: 434,
    uniqueRepliedProspects: 33,
    totalInboundMessages: 44,
    totalProspects: 1452,
    prospectsWithDomainRating: 1446,
    prospectsWithRelevanceScore: 1424,
    distinctProducts: 48,
    dateRangeLabel: "Jul 13 – Aug 19, 2026",
    lastUpdatedLabel: "Aug 19, 2026",
    publishedLabel: "2026-08-19",
  },

  heroParagraph:
    "Most backlink outreach statistics are surveys, or one blog quoting another. These are counted from the send and reply logs of a live outreach platform, five weeks into tracking — including a fit-scored breakdown nobody else publishes, even though right now it mostly shows how tightly Mentiohunt filters before sending anything.",

  keyFindings: [
    {
      stat: "7.6%",
      body: "of prospects contacted reply — 33 of 434 — once bounces and automated out-of-office replies are excluded from what counts as a reply, in the first five weeks of tracked outreach.",
    },
    {
      stat: "98%",
      body: "of contacted prospects score 0.9+ on article-to-site fit. Mentiohunt filters for topical fit before sending, so there isn't yet a genuine low-fit cohort in this dataset to compare against.",
    },
    {
      stat: "61%",
      body: "of replies arrive within 24 hours of the email being sent. Only 1 of 33 replies so far has taken longer than two weeks.",
    },
    {
      stat: "+1.4pt",
      body: "from the first follow-up email, on top of a 5.8% initial-email reply rate. The second follow-up adds another +0.5 points — real, but this is still a five-week, 434-prospect sample.",
    },
  ],

  series: {
    monthlyTrend: [
      { label: "Jul", sends: 273, replies: 12 },
      { label: "Aug", sends: 542, replies: 21 },
    ],
    replyRateByDomainRating: [
      { label: "DR 0–20", sends: 50, replies: 2 },
      { label: "DR 20–40", sends: 96, replies: 12 },
      { label: "DR 40–60", sends: 225, replies: 13 },
      { label: "DR 60+", sends: 63, replies: 6 },
    ],
    replyRateByRelevance: [
      { label: "Very low fit (<0.2)", sends: 5, replies: 1 },
      { label: "Low fit (0.2–0.4)", sends: 0, replies: 0 },
      { label: "Medium fit (0.4–0.7)", sends: 0, replies: 0 },
      { label: "High fit (0.7–0.9)", sends: 0, replies: 0 },
      { label: "Very high fit (0.9+)", sends: 426, replies: 32 },
    ],
    timeToFirstReply: [
      { label: "< 24 hours", count: 20 },
      { label: "1–3 days", count: 5 },
      { label: "3–7 days", count: 4 },
      { label: "7–14 days", count: 3 },
      { label: "14+ days", count: 1 },
    ],
    replyClassification: [
      { label: "Human reply", count: 19, tone: "good" },
      { label: "Needs review", count: 19, tone: "info" },
      { label: "Negative reply", count: 6, tone: "bad" },
    ],
    sequenceStepLift: [
      { label: "Step 1 · Initial email", sends: 434, replies: 25 },
      { label: "Step 2 · Follow-up 1", sends: 236, replies: 6 },
      { label: "Step 3 · Follow-up 2", sends: 145, replies: 2 },
    ],
  },

  copy: {
    "reply-rate-trend": {
      navLabel: "Trend",
      title: "Reply rate month by month",
      subtitle: "Replies per email sent, Jul 13 – Aug 19, 2026",
      narrative:
        "Outreach only started in mid-July, so this is two months, not a year — shown as two bars rather than a line so it isn't read as a trend it can't yet support. The reply rate held roughly flat, 4.4% in July and 3.9% in August, while send volume roughly doubled. There isn't enough history yet to say whether the rate holds as volume keeps scaling; this section will read very differently once a full year of months exist.",
      stat: "Backlink outreach reply rates held at 3.9–4.4% per email across the first two months of tracked outreach, while monthly volume roughly doubled",
      sourceLine: "n = 815 sends · Jul 13 – Aug 19, 2026",
      note: "Two months of data. Shown as columns, not a line — a two-point trend line would overstate what two months can show.",
    },
    "reply-rate-by-domain-rating": {
      navLabel: "Domain Rating",
      title: "Reply rate by Domain Rating tier",
      subtitle: "Replies per contacted prospect, bucketed by the prospect site's DR",
      narrative:
        "Every tier here clears the 20-prospect minimum, but the relationship with Domain Rating is not monotonic in this dataset: DR 20–40 leads at 12.5%, ahead of DR 60+ at 9.5%, DR 40–60 at 5.8%, and DR 0–20 at 4.0%. With 2–13 replies per tier, this is too little data to claim DR predicts reply rate one way or the other yet — the honest read is \"no clear pattern so far,\" not \"authority wins\" or \"authority doesn't matter.\"",
      stat: "In the first five weeks of tracked outreach, DR 20-40 sites replied at 12.5%, the highest of four Domain Rating tiers — with no monotonic relationship to DR evident yet",
      sourceLine: "n = 434 prospects contacted · Jul 13 – Aug 19, 2026",
      note: "All four tiers clear the 20-prospect minimum, so all four get a rate — but with 2–13 replies per tier, treat these as directional, not conclusive.",
    },
    "reply-rate-by-site-fit": {
      navLabel: "Site fit",
      title: "Reply rate by article-to-site fit score",
      subtitle: "Contacted prospects, bucketed by how well the article fits the site",
      narrative:
        "Mentiohunt scores how well a specific article fits a specific site before any outreach goes out — and in this dataset, that filter is doing its job almost too well to compare against: 426 of 434 contacted prospects (98%) score 0.9+ on fit. The three middle tiers have zero contacted prospects, and \"very low fit\" has only 5. This isn't a sample-size problem that more time will fix — it's the intended effect of screening for fit before sending. There's no genuine low-fit cohort in the platform's outreach to compare the 0.9+ tier against yet.",
      stat: "98% of contacted prospects in Mentiohunt's outreach score 0.9+ on article-to-site fit — the platform filters out lower-fit sites before outreach starts, leaving no low-fit cohort to compare against",
      sourceLine: "n = 434 prospects contacted · Jul 13 – Aug 19, 2026",
      note: "Three of five fit tiers have zero contacted prospects; \"very low fit\" has 5. Shown as insufficient sample rather than given a rate — this reflects Mentiohunt's fit filter, not a data gap.",
    },
    "time-to-first-reply": {
      navLabel: "Time to reply",
      title: "How long a reply takes to arrive",
      subtitle: "Distribution of first replies, n = 33",
      narrative:
        "Just over 60% of replies arrive within 24 hours of the email being sent, and 76% inside three days. Only one reply so far — of 33 — has arrived after two weeks. Early days, but the shape already matches what's typically seen in cold outreach: if someone is going to answer, it usually happens fast.",
      stat: "61% of backlink outreach replies arrive within 24 hours of sending; only 1 of 33 replies so far has arrived after two weeks",
      sourceLine: "n = 33 first replies · Jul 13 – Aug 19, 2026",
      note: "Early sample — 33 replies total. Directionally consistent with typical cold-outreach timing, not yet large enough to be a firm benchmark.",
    },
    "reply-classification": {
      navLabel: "Reply types",
      title: "What the replies actually say",
      subtitle: "Classification of 44 genuine inbound messages",
      narrative:
        "Of 285 inbound messages received, 230 were bounces and 11 were automated out-of-office replies — both excluded here, since neither is a real reply. Of the 44 genuine messages left, 19 are logged as a human reply, 19 as needing manual review, and 6 as a negative reply. Mentiohunt is mid-migration to a more specific 8-value classification (interested / paid-placement ask / link-exchange ask / free-product ask / declined / other) that will replace \"needs review\" with an honest category once the backfill runs — until then, these are the platform's current raw labels, not the final taxonomy.",
      stat: "Of 285 inbound messages, 230 were bounces and 11 were auto-replies — excluded here, leaving 44 genuine replies to classify",
      sourceLine: "n = 44 genuine inbound messages · Jul 13 – Aug 19, 2026",
      note: "Counts and shares of the observed sample, not a rate — a composition breakdown of 44 real messages is a more honest claim than estimating a hidden rate off this few. Labels are the platform's current classification values, pending a taxonomy migration already scoped internally.",
    },
    "follow-up-lift": {
      navLabel: "Follow-up lift",
      title: "What each follow-up email actually adds",
      subtitle: "Share of 434 contacted prospects that had replied, by step",
      narrative:
        "Measured against everyone contacted, not everyone still in the sequence: the initial email had produced replies from 5.8% of the 434 contacted prospects by the time each got a first follow-up, the first follow-up lifted that to 7.1%, and the second to 7.6%. The lift is real but small in this window — 434 prospects and 33 total replies is not enough to say with confidence how much of that first-follow-up lift will hold as volume grows, but it's already enough to say the first follow-up is worth sending.",
      stat: "The first follow-up email lifted backlink outreach reply coverage from 5.8% to 7.1% of contacted prospects in the first five weeks of tracked outreach — the second follow-up added another 0.5 points",
      sourceLine: "n = 434 prospects contacted · Jul 13 – Aug 19, 2026",
      note: "Cumulative, not per-step: each bar is the share of contacted prospects that had replied by the end of that step. Per-step reply rates were 5.8%, 2.5%, 1.4%. Only 3 sequence steps exist in this window, not 4.",
    },
  },
}
