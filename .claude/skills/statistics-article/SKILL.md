---
name: statistics-article
description: Recomputes the numbers behind the Link Building Statistics page from live Supabase data and rewrites the edition file the page reads from. Use when asked to "refresh the link building stats", "update the statistics page numbers", "re-run the stats article skill", or when starting the yearly edition for this page. Never writes to the database and never deploys — it rewrites one TypeScript file for the user to review and push.
metadata:
  audience: internal, run by the site owner
  workflow: read-only aggregate query, then rewrite a static content file
---

# Statistics Article

Recomputes every number and every piece of prose on the `/link-building-outreach-statistics-<year>`
page from live production Supabase data, and rewrites
`apps/web/content/link-building-statistics/<year>.ts` in full.

This intentionally does **not** write a Supabase table, does **not** run as a
cron job, and does **not** touch the `prospect_messages.classification`
column. The page is a static committed file; refreshing it is something the
user runs by hand and reviews before pushing. See
`todo/tickets/2026-08-18-link-building-statistics-page.md` ("Real data
migration plan") for why this replaced the original snapshot-table/cron
proposal.

## Before running

1. Read `apps/web/content/link-building-statistics/types.ts` — this is the
   `Edition` shape you must produce. Do not deviate from it or the page
   won't compile.
2. Read the current `apps/web/content/link-building-statistics/<year>.ts`
   for the target year, if it exists, so you can print a before/after diff
   at the end.
3. Confirm which year you're refreshing. Default to the current calendar
   year unless the user says otherwise. If the file doesn't exist yet for
   that year, you're starting a new edition — also add it to the
   `EDITIONS` registry in `apps/web/content/link-building-statistics/index.ts`
   and update `LATEST_YEAR`, and tell the user a new route folder
   (`apps/web/app/link-building-outreach-statistics-<year>/` +
   `apps/web/app/embed/link-building-outreach-statistics-<year>/[chart]/`)
   needs to be created by hand, copied from the previous year's — this skill
   does not create routes.

## Step 1 — Query

Run these against the production Supabase project (`mcp__supabase__execute_sql`,
read-only). Restrict every query to the edition's date window — for the
current edition that's "since outreach started"; for a later yearly edition,
scope to that calendar year. Do not use `outreach_events` for send counts —
it only has `created_at`, not a reliable per-step timestamp; `prospect_sequences`
is the source of truth for sends because it has `sent_at` and `step`.

```sql
-- Headline counts
select
  (select count(*) from prospect_sequences where status = 'sent') as total_sent,
  (select count(distinct prospect_id) from prospect_sequences where status = 'sent') as prospects_contacted,
  (select count(*) from backlink_prospects) as total_prospects,
  (select count(*) from backlink_prospects where domain_rating is not null) as with_dr,
  (select count(*) from backlink_prospects where site_relevance_score is not null) as with_relevance,
  (select count(distinct product_id) from backlink_prospects) as distinct_products,
  (select min(sent_at)::date from prospect_sequences where status = 'sent') as first_send,
  (select max(sent_at)::date from prospect_sequences where status = 'sent') as last_send;

-- All inbound messages, so bounce/auto-reply can be reported and excluded
select classification, count(*) as n
from prospect_messages
where direction = 'inbound'
group by 1 order by n desc;

-- Genuine (non-bounce, non-auto) replying prospects
with real_replies as (
  select distinct prospect_id from prospect_messages
  where direction = 'inbound' and classification not in ('bounce', 'auto_reply')
)
select count(*) as unique_replied_prospects from real_replies;

-- Reply rate by Domain Rating tier (denominator = contacted prospects)
with contacted as (select distinct prospect_id from prospect_sequences where status = 'sent'),
replied as (
  select distinct prospect_id from prospect_messages
  where direction = 'inbound' and classification not in ('bounce', 'auto_reply')
)
select
  case
    when bp.domain_rating is null then 'unknown'
    when bp.domain_rating < 20 then 'DR 0-20'
    when bp.domain_rating < 40 then 'DR 20-40'
    when bp.domain_rating < 60 then 'DR 40-60'
    else 'DR 60+' end as dr_bucket,
  count(*) as contacted,
  count(*) filter (where r.prospect_id is not null) as replies
from contacted c
join backlink_prospects bp on bp.id = c.prospect_id
left join replied r on r.prospect_id = c.prospect_id
group by 1 order by 1;

-- Reply rate by site-fit score — same shape as DR, five buckets, so an
-- empty bucket reads as "genuinely zero contacted" rather than being folded
-- into "unknown"
with contacted as (select distinct prospect_id from prospect_sequences where status = 'sent'),
replied as (
  select distinct prospect_id from prospect_messages
  where direction = 'inbound' and classification not in ('bounce', 'auto_reply')
)
select
  case
    when bp.site_relevance_score is null then 'unknown'
    when bp.site_relevance_score < 0.2 then 'a <0.2'
    when bp.site_relevance_score < 0.4 then 'b 0.2-0.4'
    when bp.site_relevance_score < 0.7 then 'c 0.4-0.7'
    when bp.site_relevance_score < 0.9 then 'd 0.7-0.9'
    else 'e 0.9+' end as fit_bucket,
  count(*) as contacted,
  count(*) filter (where r.prospect_id is not null) as replies
from contacted c
join backlink_prospects bp on bp.id = c.prospect_id
left join replied r on r.prospect_id = c.prospect_id
group by 1 order by 1;

-- Time to first reply (n = unique_replied_prospects above)
with first_send as (
  select prospect_id, min(sent_at) as sent_at from prospect_sequences where status = 'sent' group by 1
),
first_reply as (
  select prospect_id, min(received_at) as replied_at from prospect_messages
  where direction = 'inbound' and classification not in ('bounce', 'auto_reply') group by 1
)
select
  case
    when extract(epoch from (r.replied_at - s.sent_at)) / 3600 < 24 then 'a <24h'
    when extract(epoch from (r.replied_at - s.sent_at)) / 86400 < 3 then 'b 1-3d'
    when extract(epoch from (r.replied_at - s.sent_at)) / 86400 < 7 then 'c 3-7d'
    when extract(epoch from (r.replied_at - s.sent_at)) / 86400 < 14 then 'd 7-14d'
    else 'e 14d+' end as bucket,
  count(*) as n
from first_reply r join first_send s using (prospect_id)
group by 1 order by 1;

-- Follow-up step attribution: which step had already been sent when each
-- prospect's first genuine reply arrived. Sums to unique_replied_prospects.
with fr as (
  select prospect_id, min(received_at) as replied_at
  from prospect_messages
  where direction = 'inbound' and classification not in ('bounce', 'auto_reply')
  group by 1
),
steps_before_reply as (
  select fr.prospect_id, max(ps.step) as step_reached
  from fr
  join prospect_sequences ps
    on ps.prospect_id = fr.prospect_id and ps.status = 'sent' and ps.sent_at <= fr.replied_at
  group by 1
)
select step_reached, count(*) as replies from steps_before_reply group by 1 order by 1;

-- Sends and distinct prospects per step (denominator for sequenceStepLift)
select step, count(*) as sends, count(distinct prospect_id) as prospects
from prospect_sequences where status = 'sent' group by 1 order by 1;

-- Monthly trend: sends per month, and genuine replies received per month
select to_char(date_trunc('month', sent_at), 'YYYY-MM') as month, count(*) as sends
from prospect_sequences where status = 'sent' group by 1 order by 1;

select to_char(date_trunc('month', received_at), 'YYYY-MM') as month,
  count(distinct prospect_id) as replies
from prospect_messages
where direction = 'inbound' and classification not in ('bounce', 'auto_reply')
group by 1 order by 1;
```

## Step 2 — Classify replies

The `prospect_messages.classification` column still uses the platform's
original raw values (`bounce`, `auto_reply`, `human_reply`, `needs_review`,
`negative_reply`, etc.), not the locked 8-value taxonomy recorded in the
ticket (`interested_no_ask`, `paid_placement_ask`, `link_exchange_ask`,
`comp_ask`, `declined`, `other`). Do not invent a mapping from raw values to
the locked taxonomy by guessing from the label alone — the ticket's own
research found the raw labels inconsistent for the paid-ask and
link-exchange cases specifically (the same reply content landed under
different raw labels). Two options, in order of preference:

1. **If the user has separately run the reclassification skill** described
   in the ticket (reading real message content and re-labeling into the
   locked taxonomy), use those relabeled values for `replyClassification`.
2. **Otherwise, use the raw classification values as-is** (`human_reply`,
   `needs_review`, `negative_reply`, ...), grouped into the existing
   good/info/bad tone buckets by best judgement, and say explicitly in the
   chart's `note` that these are the platform's current raw labels pending
   the taxonomy migration — do not present them as the final 8-value
   taxonomy. This is what the 2026 edition currently does; keep doing it
   until the reclassification work happens.

Never fold `bounce` or `auto_reply` into this breakdown — they're excluded
from the reply-rate definition entirely (see ticket) and must not appear in
`replyClassification` or count toward `meta.totalInboundMessages`.

## Step 3 — Compute and gate

- Apply `MIN_SAMPLE_SIZE` from `apps/web/components/link-building-statistics/shared/constants.ts`
  (20 as of writing — read the file, don't hardcode it) to
  `replyRateByDomainRating` and `replyRateByRelevance`. A bucket under that
  threshold still goes in the array with its real `sends`/`replies` — the
  chart component (`RateBars`) renders it hatched automatically. Do not drop
  the bucket or fake a number for it.
- If a fit or DR bucket is genuinely zero (nobody contacted, not "no data
  yet"), still include it at `sends: 0, replies: 0` — that's a structural
  finding, not missing data, and the copy should say so explicitly (see the
  2026 site-fit chart's `note` for the pattern).
- `sequenceStepLift.replies` is the step-attribution count from the
  "follow-up step attribution" query, not a raw per-step message count —
  don't confuse this with `outreach_events` counts, which can double-count.
- `meta.totalInboundMessages` must equal the sum of every
  `replyClassification[].count` — it is the classification chart's
  denominator, not the raw inbound row count (which includes bounces).

## Step 4 — Write the prose

Every number that appears in `heroParagraph`, `keyFindings[].body`, or any
chart's `narrative`/`stat`/`note` must trace to a value computed in Step 1–3.
Regenerate all of it from the new numbers rather than patching the old
edition's text — this is the failure mode the original mock data fell into
(narratives asserting "17.7% to 26.9%" and a "3× fit lift" that the real
data didn't support once it existed). Follow the tone and structure of the
existing `apps/web/content/link-building-statistics/2026.ts` file: state the
number, then one sentence of honest interpretation, including the caveat
when the sample is thin. Don't round up small-sample claims into confident
claims — "no clear pattern yet" is a fine thing for a chart to say.

## Step 5 — Write and report

1. Write `apps/web/content/link-building-statistics/<year>.ts` in full,
   matching the exact shape of `types.ts` and the style of the existing
   `2026.ts` (module doc comment explaining what changed, `EDITION_<year>`
   export).
2. Print a before/after table: every `meta` field, every headline chart stat,
   old value next to new value, so the user can eyeball the diff before
   committing. Flag anything that moved by more than what a normal refresh
   would explain (e.g. a rate that flipped direction, a bucket that stopped
   being gated).
3. Do not run `git commit`, do not deploy, do not touch any other file
   unless this is a new year's edition (see "Before running" above).

## Guardrails

- Never invent or round-trip a number that wasn't returned by a query this
  run.
- Refuse to write the file if any required query returns zero rows —
  surface the empty query to the user instead of writing zeros into the
  edition.
- Never state a rate for a bucket under `MIN_SAMPLE_SIZE` — only counts.
- Every `sourceLine` states its sample size and date range.
- Bounce and auto-reply messages never count toward a reply, in the
  headline rate or in any chart.
