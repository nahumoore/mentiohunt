# Feature idea: "Link Building Statistics" page for backlinks/SEO

## Problem

Mentiohunt has no linkbait content — nothing designed to earn backlinks from other
sites/blogs citing it as a data source. This is a gap: the platform sits on
proprietary outreach data (send/reply/placement) that most competing "statistics"
pages don't have (they aggregate survey data or cite each other).

## Opportunity (researched 2026-08-18)

SERP check: "cold email benchmark" space is saturated by big-DR players (Instantly,
Mailshake, Hunter.io, Belkins, Cleverly) who publish yearly reports off huge
datasets — not realistic to rank there.

"Link building statistics" / "backlink outreach statistics" space is less crowded —
ranking pages (Arvow, ReporterOutreach, LinkPanda, OutreachDesk, LinkBuild.agency,
theStacc, Searchlab) are mid-DR and mostly compile *other* sources' stats, not
proprietary data. This is the gap to fill.

DataForSEO keyword check (US, Google Ads volume):
- `link building statistics` — 90/mo
- `seo statistics` — 260/mo
- `backlink data` — 110/mo, CPC $19.66
- `link building report` — 40/mo
- `backlink outreach statistics` — no volume (0 direct search demand)

Per-niche variants (saas/b2b/ecommerce/agency/startup/founder × link-building /
backlink / outreach statistics) all returned **zero search volume** — no demand for
a per-niche split. Build **one flagship page**, not a page-per-niche series.

Direct search traffic will be modest (page isn't meant to rank #1 for huge volume —
value is in being a citable source other blogs link to, similar to how the existing
mid-DR competitor pages already get cited).

## Data available (checked 2026-08-18, current DB counts)

- 967 emails sent (`outreach_events` where `event_type = 'sent'`)
- 271 inbound replies / 229 unique prospects replied (`prospect_messages` where
  `direction = 'inbound'`) → ~23.7% reply rate
- 1,399 total prospects (`backlink_prospects`), 1,393 with `domain_rating`, 1,372
  with `site_relevance_score`
- 45 distinct customer products/niches — thin per-niche, fine in aggregate

Small next to Instantly's millions, but real/proprietary — the differentiator, not
the size.

## Proposed page

Route: `/link-building-statistics` (or `/backlink-outreach-statistics` — pick
whichever term is the primary H1/title based on final positioning; use the other as
secondary phrasing in body copy to catch both).

Structure:
1. Hero stat callout (biggest single number, e.g. overall reply rate)
2. Methodology box right under hero — dataset size, date range, how sourced (real
   platform outreach, not survey) — this is what makes it more citable than the
   aggregator pages that just compile others' numbers
3. TOC / anchor nav
4. Data sections (grounded in real schema):
   - Reply rate by domain rating tier (bucket `domain_rating`: 0-20/20-40/40-60/60+)
   - Reply rate by `site_relevance_score` — unique angle, nobody else has this since
     it's specific to how Mentiohunt matches article-to-site fit
   - Time-to-first-reply distribution (`outreach_events` sent timestamp vs
     `prospect_messages.received_at`)
   - Reply classification split (interested/not-interested/auto-reply, from
     `prospect_messages.classification`)
   - Follow-up step lift — does 2nd/3rd sequence email add replies
     (`email_sequences` / `prospect_sequences`)
5. "Last updated [date]" badge — refresh quarterly as data volume grows
6. Copy-stat/embed button next to each chart — copies stat + attribution link back.
   This is the actual backlink mechanism: make citing effortless, embed forces the
   link back.
7. Soft CTA at the very bottom only ("these prospects came from Mentiohunt") — not
   before, don't poison the trust/citation page with a sales pitch.

Backend: new aggregate query job in `apps/server` (weekly/monthly cron), computing
anonymized aggregates only — no customer domains or PII exposed, cached result
served to the page rather than live DB reads.

Distribution after publish: pitch inclusion to the existing "link building
statistics" roundup pages found in the SERP check (Arvow, ReporterOutreach,
LinkPanda, OutreachDesk, LinkBuild.agency, theStacc, Searchlab) — they already
curate/cite stat sources, easiest first backlinks.

## Open questions (not decided yet — flagging for discussion)

- Final primary keyword/title: `link building statistics` vs
  `backlink outreach statistics`?
- Refresh cadence for the cron aggregate — weekly vs monthly vs quarterly, balanced
  against how fast the dataset grows?
- Any minimum-sample-size gating per breakout (e.g. don't show a DR-tier reply rate
  if that tier has <20 sends) to avoid noisy/misleading segments as data is still
  fairly thin (967 sends total)?
- Embed/copy-stat widget — build custom or keep it simple (styled blockquote with a
  "copy" button) for v1?
