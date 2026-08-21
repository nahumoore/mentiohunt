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

## Design pass 2 — research-report layout shipped (2026-08-19, mock data, no backend)

Three variants were built and compared (research report, insight dashboard,
shareable stat deck); the research report won and now lives at
`/link-building-statistics`. The other two were deleted along with the preview
switcher — see git history on this file for what they looked like if that's ever
worth revisiting.

Shape: narrow reading column, sticky contents rail, numbered sections and
numbered figures, a methodology aside, a citation section. Bets on being quoted
by other blogs and linked back to.

Implementation, still in place:

- Six charts, one source of truth (`app/link-building-statistics/_data.ts` for the
  numbers, `components/link-building-statistics/shared/chart-specs.ts` for the
  copy/tables, `shared/chart-body.tsx` for the rendering). Includes a monthly
  trend series and a follow-up-lift chart measured as *cumulative coverage* of
  contacted prospects, since per-step reply rates flatter later follow-ups.
- Every chart is a single self-contained SVG (labels, values and axes are SVG
  text), which is what makes the export work with no charting library.
- **Per-chart sharing:** copy stat with citation + link, copy chart image to
  clipboard, download PNG (2×) or SVG, copy an embed snippet, deep-link to the
  chart, post to X / LinkedIn. Exports are wrapped in a branded card with the
  title, sample size and page URL baked in, and follow the reader's light/dark
  theme.
- **Embed route:** `/embed/link-building-statistics/[chart]` — statically
  generated per chart, `noindex, follow`, renders the chart plus a live link back
  to the source page. This is the backlink mechanism; the snippet also ships a
  plain `<a>` fallback for CMSes that strip iframes.
- Chart colour tokens are scoped to the page (`shared/chart-tokens.tsx`) rather
  than added to the design system, since this is still a mock-data pass.
  Sequential orange ramp for magnitude, validated status trio for reply outcomes
  — checked for colour-blind separation and contrast in light *and* dark mode,
  with shape coding as secondary encoding on the status chart.
- Hover layer on every chart, a "show the numbers" table view under every chart,
  and buckets below `MIN_SAMPLE_SIZE` (20) rendered as hatched "insufficient
  sample" rather than given a rate.

Still to do: promote the chart tokens into `packages/ui/src/styles/globals.css`
if this page graduates past a design pass, and wire the real aggregate job
(below).

## Design pass 3 — bugfixes + copy pass (2026-08-19, still mock data)

- Chart tooltip no longer gets clipped/cut off, and no longer spawns a spurious
  horizontal scrollbar when it renders near the right edge of a chart
  (`components/link-building-statistics/shared/chart-tooltip.tsx` — the scroll
  container and the tooltip layer are now separate elements; previously
  `overflow-x-auto` on an ancestor was also clipping `overflow-y`, which cut the
  tooltip off, and the tooltip's own width could widen that same box).
- Removed the "Fig. N. \<subtitle\>." caption line from each chart's footer —
  only the "Show the numbers" accordion remains there now
  (`components/link-building-statistics/report/figure.tsx`). The inline
  `Mentiohunt · n=... · url` citation line (`ChartSource`) was removed with it;
  citation text still lives in the "Copy stat" share action and the
  exported/embedded chart cards, so charts stay citable, just not via that
  footer text.
- Title/description tightened to `Link Building Statistics 2026: Real Outreach
  Data` — keyword-first, year moved up front. Kept "products" as the
  dataset-scope metric label (not "companies" or "websites" — the latter would
  collide with the separate prospect-website counts elsewhere on the page).

## Real data migration plan (2026-08-19)

Everything below replaces the "backend" paragraph in the original proposal
above with concrete decisions, made ahead of actually wiring the page to real
data.

### Cadence: one page, refreshed monthly, plus a yearly dated edition

Not building separate monthly pages. Splitting into monthly URLs would
fragment backlink equity across many pages, and most monthly cuts (by DR tier,
by relevance-fit tier) would fall below the page's own `MIN_SAMPLE_SIZE` (20)
gate given current volume — monthly-per-bucket data would mostly be noise.

- **Monthly:** refresh the underlying aggregates (cheap), but only re-render
  sections whose sample size actually clears the gate. In practice this mostly
  moves the overall reply-rate number and the monthly trend chart, not every
  section.
- **Yearly:** a new dated edition (`2026 Link Building Statistics` →
  `2027 Link Building Statistics`) is the actual link-bait event — bigger
  dataset, a real "what changed this year" narrative, its own outreach push to
  the roundup sites listed above (Arvow, ReporterOutreach, LinkPanda,
  OutreachDesk, LinkBuild.agency, theStacc, Searchlab).

### Reply-classification taxonomy

Checked the real `prospect_messages.classification` values in production
(2026-08-19) against what the mock data assumed. Two problems surfaced:

1. `bounce` is 81% of all inbound messages (230 of 285) — using "any inbound
   message" as the reply-rate numerator (what the mock currently does) would
   be dominated by bounce noise, not real engagement.
2. The live classifier is internally inconsistent for the two patterns that
   matter most to this page's audience — the same "wants payment" or "wants a
   link swap" reply content landed under `human_reply`, `negative_reply`, and
   `needs_review` in different rows, sampled directly from
   `classification_reason`.

New locked taxonomy for `prospect_messages.classification`:

- `bounce` — unchanged, delivery failure, not a reply
- `auto_reply` — unchanged, out-of-office/automated
- `interested_no_ask` — genuine positive engagement, no commercial ask
  (includes clarifying questions that lean positive — deliberately not split
  out)
- `paid_placement_ask` — names a price, or asks for budget/payment without
  naming one yet (merged; split later only if negotiation-stage tracking is
  wanted)
- `link_exchange_ask` — proposes a reciprocal link swap (kept separate from
  `paid_placement_ask` — different monetization pattern, worth its own stat)
- `comp_ask` — wants a free product/service instead of cash or a swap
  (influencer-style ask, distinct from `link_exchange_ask`)
- `declined` — any explicit decline: plain no, process/eligibility gate, or
  unsubscribe-flagged (merged — the specific reason still lives in
  `classification_reason` free text)
- `other` — terminal fallback for genuinely ambiguous replies, replacing
  `needs_review` — "we looked, it doesn't fit" is an honest stats-page
  category; "needs review" is a pending workflow state and doesn't belong on a
  published page

`human_reply`, `negative_reply`, and `needs_review` (today's values) are
retired/absorbed into the set above. `reverse_pitch` and `wrong_person` were
considered and rejected as too niche — fold into `other`.

**Reply rate, defined:** filter out `bounce` and `auto_reply` first; every
remaining message counts as a reply (including `declined` — a decline is
still a reply, just not a positive one, matching the standard cold-email
definition of reply rate). `bounce`/`auto_reply` never compete for a slot in
the classification breakdown and must not land in `other`.

**Migration sequencing** (`classification` is a plain `string` column today,
not a Postgres enum, unlike `prospect_status`/`prospect_tier` elsewhere in
this schema):

1. Build the reclassification skill (user-owned, not this codebase) that reads
   real message content/reason from Supabase and re-labels each row into the
   new taxonomy — re-derive from content, don't trust the existing value,
   since the live data has real inconsistencies for the paid-ask and
   link-exchange cases specifically.
2. Run the backfill as a manually-triggered SQL update, while the column is
   still free text (retiring old values before adding the constraint, not
   after — an enum constraint added first would reject any row still carrying
   an old label like `human_reply`).
3. Only once the backfill is confirmed clean, promote the column to a proper
   enum for consistency with the rest of the schema and to catch
   typos/future drift:

   ```sql
   create type prospect_message_classification as enum (
     'bounce',
     'auto_reply',
     'interested_no_ask',
     'paid_placement_ask',
     'link_exchange_ask',
     'comp_ask',
     'declined',
     'other'
   );

   alter table prospect_messages
     alter column classification type prospect_message_classification
     using classification::prospect_message_classification;
   ```

**Sample size caveat:** as of 2026-08-19 there are only ~55 non-bounce/non-
auto messages total. Split across 5 substantive buckets, some (`comp_ask`,
`link_exchange_ask`) will likely land at n=1–3 — thin for a page whose pitch
is "trustworthy real data," and inconsistent with the `MIN_SAMPLE_SIZE = 20`
gate the DR/relevance charts already enforce. Decision: show this chart as
raw counts/shares of the observed sample (not a computed rate per bucket)
with a visible sample-size caveat, rather than gating or hiding it — a
composition breakdown of an actual observed sample is a different (and more
honest) claim than estimating a hidden population rate off n=2, which is what
the DR/relevance rate charts are gated against. Revisit if `other` ends up
carrying an unreasonably large share once the backfill runs — that would mean
the taxonomy or the reclassification prompt needs another pass.

### New table: cached aggregate snapshot

No source-table changes needed beyond the classification work above — every
other number on the page (`backlink_prospects.domain_rating`,
`.site_relevance_score`, `outreach_events` sends, `prospect_sequences` steps)
is already derivable from existing tables. What's missing is somewhere to
store the *computed* result, so the page doesn't run six live aggregations
per request and doesn't need a public API surface on top of raw prospect
data.

```sql
create table link_building_statistics_snapshots (
  id uuid primary key default gen_random_uuid(),
  computed_at timestamptz not null default now(),
  period_start date not null,
  period_end date not null,
  edition_year int not null,
  payload jsonb not null,
  is_current boolean not null default true
);

create unique index one_current_link_building_snapshot
  on link_building_statistics_snapshots (is_current)
  where is_current;

alter table link_building_statistics_snapshots enable row level security;
-- no policies added: service-role only. The web page reads this server-side
-- (via supabaseAdmin, same as the cron job that writes it) rather than
-- exposing a public-readable table.
```

- `payload` holds the whole computed tree in one shot (dataset meta + all six
  chart series), mirroring the shape `_data.ts` already has. One JSON blob is
  simpler than six new normalized tables that nothing else would ever query,
  and matches how it's consumed (straight into the page).
- `edition_year` + `is_current`: the monthly job writes a new row and flips
  the old one's `is_current` to `false`, so past yearly editions stay
  queryable without extra tables — feeds the yearly-edition plan above.

**Cron job:** follows the existing `apps/server/src/jobs/<name>.ts` +
`cron.schedule(...)` pattern (see `daily-link-tracker.ts` / `jobs/index.ts`
for the convention), using `supabaseAdmin` and `createLogger` from
`helpers/logger.ts` per the server rules in `CLAUDE.md`.

## Open questions (not decided yet — flagging for discussion)

- Whether `link_exchange_ask` and `comp_ask` stay separate buckets once more
  volume accumulates, or turn out rare enough to merge into one "barter"
  bucket.
- What triggers publishing a new yearly edition vs. just refreshing the
  current one — a fixed calendar date, or a "dataset has grown enough to be
  worth a new edition" judgment call?

## Design pass 4 — real data, year-versioned URL, skill-refreshed (2026-08-19)

Direction changed from the "Real data migration plan" above: no Supabase
snapshot table, no cron job. Reasoning — the page updates rarely enough
(monthly at most) that a human-in-the-loop refresh is simpler and safer than
standing up a public read path onto prospect data. The plan above stays as a
record of what was considered; this section is what actually shipped.

- **Route:** `/link-building-outreach-statistics-2026` (year in the URL, per
  request). Old `/link-building-statistics` 308-redirects to it. Title/H1
  still lead with "Link Building Statistics" (the term with search volume);
  the URL carries the longer phrase.
- **Data model:** `apps/web/content/link-building-statistics/` — `types.ts`
  defines the `Edition` contract, `2026.ts` is the current edition (a plain
  committed file, not a database read), `index.ts` registers editions by
  year. Components read the active edition via `EditionProvider`/`useEdition()`
  (`components/link-building-statistics/shared/edition-context.tsx`) instead
  of importing a fixed data file, so a 2027 edition is a new `2027.ts` plus a
  copied route folder — no component changes.
- **Refresh workflow:** `/statistics-article` skill
  (`.claude/skills/statistics-article/SKILL.md`). Reads Supabase
  read-only, recomputes every series and regenerates the prose from the new
  numbers, rewrites `<year>.ts` in full. Never writes to the database, never
  deploys — the user reviews the diff and pushes by hand. This replaces both
  the snapshot-table migration and the cron job from the plan above, and also
  replaces the separate "reclassification skill + backfill + enum migration"
  sequence: the skill classifies replies at read time from the raw
  classification values (see below), so the product-side migration only
  needs to happen once the locked 8-value taxonomy is actually needed
  elsewhere.
- **Real numbers (queried 2026-08-19):** the dataset turned out much thinner
  than this ticket's opportunity section assumed — 5 weeks old (Jul 13–Aug 19,
  2026), not 8 months; 33 genuine replies (7.6% of 434 contacted prospects),
  not 229 (23.7%) — the original number counted bounces as replies. The
  site-fit chart's low-fit tiers are genuinely empty (426 of 434 contacted
  score 0.9+) because Mentiohunt filters for fit before sending — a
  structural finding, not a sample-size gap that more time fixes. All six
  chart sections were kept; the thin ones render through the existing
  hatched "insufficient sample" treatment and their copy says so explicitly
  rather than repeating the mock's overstated claims. Shipped live and
  indexable, not gated behind noindex — small-sample caveats are stated
  inline instead.
- **Reply-classification caveat:** the taxonomy backfill described above
  under "Reply-classification taxonomy" has not run. The 2026 edition's
  classification chart uses the platform's current raw values (`human_reply`,
  `needs_review`, `negative_reply`) with a note saying so, pending that
  migration.
