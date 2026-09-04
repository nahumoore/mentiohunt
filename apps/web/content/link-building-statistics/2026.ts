// REAL DATA — queried directly from production Supabase on 2026-09-04.
// See todo/tickets/2026-08-18-link-building-statistics-page.md for the
// original proposal and the "Real data migration plan" section for how the
// numbers below were defined.
//
// This file is written by the `/statistics-article` skill
// (.claude/skills/statistics-article/SKILL.md) — regenerate it by
// running that skill rather than hand-editing individual numbers, so the
// prose in `copy` always traces to the numbers in `series`.
//
// Dataset is now about seven and a half weeks old (outreach started
// 2026-07-13, this refresh taken 2026-09-04, so September is only 4 days
// deep). Two structural findings still drive several sections:
//   - the classification taxonomy backfill described in the ticket has not
//     run yet, so `replyClassification` uses the platform's current raw
//     labels (human_reply / needs_review / negative_reply / wrong_person /
//     unsubscribe), not the locked 8-value taxonomy
//   - 1,023 of 1,042 contacted prospects still score 0.9+ on site-fit —
//     Mentiohunt filters for fit before sending, so the low/mid-fit tiers
//     remain genuinely near-empty rather than under-sampled

import type { Edition } from "./types"

export const EDITION_2026: Edition = {
  year: 2026,

  meta: {
    totalSent: 1873,
    prospectsContacted: 1042,
    uniqueRepliedProspects: 102,
    totalInboundMessages: 135,
    totalProspects: 2742,
    prospectsWithDomainRating: 2701,
    prospectsWithRelevanceScore: 2714,
    distinctProducts: 63,
    dateRangeLabel: "Jul 13 – Sep 4, 2026",
    lastUpdatedLabel: "Sep 4, 2026",
    publishedLabel: "2026-09-04",
  },

  heroParagraph:
    "Most backlink outreach statistics are surveys, or one blog quoting another. These are counted from the send and reply logs of a live outreach platform, about seven and a half weeks into tracking — including a fit-scored breakdown nobody else publishes, even though right now it mostly shows how tightly Mentiohunt filters before sending anything.",

  keyFindings: [
    {
      stat: "9.8%",
      body: "of prospects contacted reply — 102 of 1,042 — once bounces and automated out-of-office replies are excluded from what counts as a reply, over the first seven and a half weeks of tracked outreach.",
    },
    {
      stat: "98%",
      body: "of contacted prospects score 0.9+ on article-to-site fit — 1,023 of 1,042. Mentiohunt filters for topical fit before sending, so there still isn't a genuine low-fit cohort in this dataset to compare against.",
    },
    {
      stat: "62%",
      body: "of replies arrive within 24 hours of the email being sent, and 81% arrive within three days. Only 4 of 102 replies so far have taken longer than two weeks.",
    },
    {
      stat: "+1.9pt",
      body: "from the first follow-up email, on top of a 7.3% initial-email reply rate. The second follow-up adds another +0.6 points, to 9.8% overall — on a sample more than twice the size of the last refresh.",
    },
  ],

  series: {
    monthlyTrend: [
      { label: "Jul", sends: 273, replies: 12 },
      { label: "Aug", sends: 1265, replies: 71 },
      { label: "Sep", sends: 335, replies: 21 },
    ],
    replyRateByDomainRating: [
      { label: "DR 0–20", sends: 149, replies: 11 },
      { label: "DR 20–40", sends: 316, replies: 33 },
      { label: "DR 40–60", sends: 460, replies: 41 },
      { label: "DR 60+", sends: 105, replies: 15 },
      { label: "Unknown DR", sends: 12, replies: 2 },
    ],
    replyRateByRelevance: [
      { label: "Very low fit (<0.2)", sends: 16, replies: 1 },
      { label: "Low fit (0.2–0.4)", sends: 0, replies: 0 },
      { label: "Medium fit (0.4–0.7)", sends: 0, replies: 0 },
      { label: "High fit (0.7–0.9)", sends: 0, replies: 0 },
      { label: "Very high fit (0.9+)", sends: 1023, replies: 101 },
      { label: "Unknown fit", sends: 3, replies: 0 },
    ],
    timeToFirstReply: [
      { label: "< 24 hours", count: 63 },
      { label: "1–3 days", count: 20 },
      { label: "3–7 days", count: 11 },
      { label: "7–14 days", count: 4 },
      { label: "14+ days", count: 4 },
    ],
    replyClassification: [
      { label: "Needs review", count: 68, tone: "info" },
      { label: "Human reply", count: 57, tone: "good" },
      { label: "Negative reply", count: 8, tone: "bad" },
      { label: "Wrong person", count: 1, tone: "info" },
      { label: "Unsubscribe", count: 1, tone: "bad" },
    ],
    sequenceStepLift: [
      { label: "Step 1 · Initial email", sends: 1042, replies: 76 },
      { label: "Step 2 · Follow-up 1", sends: 574, replies: 20 },
      { label: "Step 3 · Follow-up 2", sends: 257, replies: 6 },
    ],
  },

  copy: {
    "reply-rate-trend": {
      navLabel: "Trend",
      title: "Reply rate month by month",
      subtitle: "Replies per email sent, Jul 13 – Sep 4, 2026",
      narrative:
        "Now three months of tracked outreach, though September is only four days old at the time of this refresh. The per-email reply rate moved from 4.4% in July to 5.6% in August — real volume growth, from 273 to 1,265 sends, without the rate falling apart, which is the more meaningful read than any single month's number. September's 6.3% is provisional: a four-day slice of a month will always move around, and shouldn't yet be read as a rate.",
      stat: "Backlink outreach's per-email reply rate rose from 4.4% in July to 5.6% in August, holding up as monthly send volume grew from 273 to 1,265 emails",
      sourceLine: "n = 1,873 sends · Jul 13 – Sep 4, 2026",
      note: "Three data points, the third only four days deep at time of writing — shown as columns, not a line, so it isn't read as an established trend.",
    },
    "reply-rate-by-domain-rating": {
      navLabel: "Domain Rating",
      title: "Reply rate by Domain Rating tier",
      subtitle: "Replies per contacted prospect, bucketed by the prospect site's DR",
      narrative:
        "All four known-DR tiers clear the 20-prospect minimum. DR 60+ now leads at 14.3%, ahead of DR 20-40 at 10.4%, DR 40-60 at 8.9%, and DR 0-20 at 7.4% — a rough upward slope with Domain Rating that wasn't visible in the earlier five-week dataset, though DR 40-60 sitting below DR 20-40 keeps it from being a clean monotonic trend. With 11-41 replies per tier on 105-460 sends, this is a stronger signal than before but still short of \"authority reliably predicts replies.\" A separate group of 12 prospects has no recorded Domain Rating and is too small to rate.",
      stat: "DR 60+ sites now reply at 14.3%, the highest of four Domain Rating tiers, with a rough — not fully monotonic — upward trend by DR",
      sourceLine: "n = 1,042 prospects contacted (1,030 with a known DR) · Jul 13 – Sep 4, 2026",
      note: "All four known-DR tiers clear the 20-prospect minimum and get a stated rate. A fifth group of 12 prospects has no recorded DR — shown with its raw counts, not a rate, since it's below the minimum.",
    },
    "reply-rate-by-site-fit": {
      navLabel: "Site fit",
      title: "Reply rate by article-to-site fit score",
      subtitle: "Contacted prospects, bucketed by how well the article fits the site",
      narrative:
        "Mentiohunt scores how well a specific article fits a specific site before any outreach goes out, and that filter is still doing its job almost too well to compare against: 1,023 of 1,042 contacted prospects (98%) score 0.9+ on fit. The three middle tiers remain at zero contacted prospects, and \"very low fit\" has grown from 5 to 16 but is still under the 20-prospect minimum. This isn't a sample-size problem more time will fix — it's the intended effect of screening for fit before sending. There's still no genuine low-fit cohort in the platform's outreach to compare the 0.9+ tier against.",
      stat: "98% of contacted prospects (1,023 of 1,042) score 0.9+ on article-to-site fit — the platform's fit filter still leaves no meaningful low-fit cohort to compare against",
      sourceLine: "n = 1,042 prospects contacted · Jul 13 – Sep 4, 2026",
      note: "Three of five fit tiers remain at zero contacted prospects; \"very low fit\" has grown to 16 but is still below the 20-prospect minimum. A separate 3 prospects have no recorded relevance score. This reflects Mentiohunt's fit filter, not a data gap.",
    },
    "time-to-first-reply": {
      navLabel: "Time to reply",
      title: "How long a reply takes to arrive",
      subtitle: "Distribution of first replies, n = 102",
      narrative:
        "62% of replies arrive within 24 hours of the email being sent, and 81% arrive inside three days. Only 4 of 102 replies — the same count as the 7-14 day bucket — have taken longer than two weeks. The shape has held steady as the sample nearly tripled from 33 to 102 replies since the last refresh: fast responses dominate, consistent with typical cold-outreach timing.",
      stat: "62% of backlink outreach replies arrive within 24 hours of sending, and 81% within three days, holding steady as the reply sample grew from 33 to 102",
      sourceLine: "n = 102 first replies · Jul 13 – Sep 4, 2026",
      note: "Sample nearly tripled since the last refresh (33 → 102 replies) and the shape held — directionally consistent with typical cold-outreach timing, and firmer than it was at n = 33.",
    },
    "reply-classification": {
      navLabel: "Reply types",
      title: "What the replies actually say",
      subtitle: "Classification of 135 genuine inbound messages",
      narrative:
        "Of 743 inbound messages received, 586 were bounces and 22 were automated out-of-office replies — both excluded here, since neither is a real reply. Of the 135 genuine messages left, 68 are logged as needing manual review, 57 as a human reply, 8 as a negative reply, and 2 more split evenly between a wrong-person contact and an unsubscribe request. Mentiohunt's migration to the locked 8-value classification (interested / paid-placement ask / link-exchange ask / free-product ask / declined / other) still hasn't run, so \"needs review\" remains the largest single bucket — these are the platform's current raw labels, not the final taxonomy.",
      stat: "Of 743 inbound messages, 586 were bounces and 22 were auto-replies — excluded here, leaving 135 genuine messages to classify, with \"needs review\" still the largest bucket at 68",
      sourceLine: "n = 135 genuine inbound messages · Jul 13 – Sep 4, 2026",
      note: "Counts and shares of the observed sample, not a rate. Labels are the platform's current raw classification values, pending the taxonomy migration already scoped internally.",
    },
    "follow-up-lift": {
      navLabel: "Follow-up lift",
      title: "What each follow-up email actually adds",
      subtitle: "Share of 1,042 contacted prospects that had replied, by step",
      narrative:
        "Measured against everyone contacted, not everyone still in the sequence: the initial email had produced replies from 7.3% of the 1,042 contacted prospects by the time each got a first follow-up, the first follow-up lifted that to 9.2%, and the second to 9.8%. Per step, replies arrived from 7.3% of the 1,042 who got the initial email, 3.5% of the 574 who reached a first follow-up, and 2.3% of the 257 who reached a second — the same declining-but-positive pattern seen in the earlier five-week dataset, now on a sample more than twice the size.",
      stat: "The first follow-up email lifted backlink outreach reply coverage from 7.3% to 9.2% of contacted prospects — the second follow-up added another 0.6 points, to 9.8%",
      sourceLine: "n = 1,042 prospects contacted · Jul 13 – Sep 4, 2026",
      note: "Cumulative, not per-step: each bar is the share of contacted prospects that had replied by the end of that step. Per-step reply rates were 7.3%, 3.5%, 2.3% of that step's own sends (1,042 / 574 / 257). Only 3 sequence steps exist in this window.",
    },
  },
}
