# 01 — Fresh and intersection-prioritized competitor backlink lanes

- **Status:** Proposed — not started
- **Priority:** P1 (highest incremental yield for the least plumbing)
- **Depends on:** `todo/tickets/2026-08-27-fix-daily-opportunity-delivery.md` (shared stop controller,
  common funnel, `persist-and-enrich.ts`)
- **Adds enum value:** No. This is an expansion of `competitor_backlink`, not a new user-facing
  opportunity type. No migration, no `apps/web/lib/opportunity-types.ts` change.

## Why this one

Competitor backlinks are already the strongest engine: ~5.78 send-ready rows per run at 85.6% contact
success over the last 14 days. Auto-discovered competitors and page intersection already exist. The
one structural weakness is that every fetch sorts `rank,desc`, so runs keep re-surfacing the same
older, high-authority inventory. DataForSEO exposes `is_new` / `first_seen` / `last_seen`, which opens
a genuinely renewable lane against the same competitors we already pay to query.

## What exists today

- **Backlink fetch:** `apps/server/src/helpers/data-for-seo/get-backlinks.ts:29-67` — POSTs
  `backlinks/backlinks/live` with `mode: "one_per_domain"`, `backlinks_status_type: "live"`,
  `order_by: ["rank,desc"]`, `exclude_internal_backlinks: true`, filters limited to
  `["dofollow","=",true]` plus optional `domain_from_rank` bounds. Requested fields
  (`DataForSeoBacklinkItem`, `:3-12`): `url_from, url_to, anchor, domain_from_rank, page_from_title,
  text_pre, text_post, dofollow`. **`is_new` / `is_lost` / `first_seen` / `last_seen` /
  `backlinks_status_type: "lost"` appear nowhere in the repo.** Default `limit` 50; the daily adaptive
  run passes no `fetchLimit` so it uses 50.
- **Cursor:** DataForSEO's `search_after_token`, stored per competitor in
  `backlink_prospect_runs.metadata.moz_cursors` as `{ [competitorDomain]: token }`
  (`competitor-backlink/prospect-run-tracking.ts:8-26` read, `:119-143` write; in-memory
  `mozCursorsByDomain` at `competitor-backlink/index.ts:146`, persisted at `:256`).
- **Exhaustion:** a domain is marked exhausted when `nextCursor === null && funnel.extracted > 0`
  (`index.ts:167-169`), stored as `metadata.exhausted_competitor_domains`, re-checked after
  `EXHAUSTED_RECHECK_MS = 30 days` (`prospect-run-tracking.ts:6`, `:86-90`).
- **Page intersection:** `apps/server/src/helpers/data-for-seo/get-backlink-page-intersection.ts:38-86`
  — `backlinks/page_intersection/live`, up to 5 targets, `order_by: ["1.domain_from_rank,desc"]`,
  `limit` 200, rows with `intersections_count < 2` dropped. Called in
  `competitor-backlink/index.ts:200`, **after** the full per-competitor loop and only if
  `budget.remaining > 0 && !shouldStop() && allDomains.length >= 2` (`:191-196`). Results re-enter
  through `processCompetitor(..., prefetched)` (`:225`) so they skip the fetch and the cursor logic
  (`process-competitor.ts:58`) but get identical filtering/scoring/enrichment. Count recorded as
  `metadata.intersection_candidates`.
- **Origin is not distinguishable on the prospect:** both authority and intersection rows persist
  `tier: "competitor_backlink"` (`process-competitor.ts:236`). There is no lane/mode/source-detail
  column on `backlink_prospects`; the only per-prospect free-form slot is
  `raw_metadata.outreach_context`, written in `competitor-backlink/enrichment.ts:49-53` with
  `opportunityType, pageType, competitorDomain, competitorNamedInText`.

## Implementation

1. **Add freshness support to `get-backlinks.ts`.** Add `is_new`, `first_seen`, `last_seen` to the
   requested fields, and accept an optional `lane: "authority" | "fresh"` argument (not a second
   function — keep the filter/sort logic in one place). `fresh` sets `order_by: ["first_seen,desc"]`
   and adds `["first_seen", ">", <bounded recent date>]` to `filters`. `authority` keeps today's
   `rank,desc`.
2. **Three explicit lanes:** `authority` (today's behavior), `fresh`, `intersection`. Give each its
   own cursor and exhaustion state — change `metadata.moz_cursors` from `{ [domain]: token }` to
   `{ [domain]: { [lane]: token } }`, and `exhausted_competitor_domains` likewise from `string[]` to
   `{ [domain]: lane[] }`. Read defensively: a legacy string token is the `authority` cursor, a legacy
   array entry means `authority` is exhausted. One exhausted lane must never stop another.
3. **Run order:** intersection first, then fresh, then authority — all behind the same
   `stopController` / budget checks that guard the loop today (`index.ts:155-161`). Intersection is
   currently last and gets skipped whenever the budget drained during the competitor loop; promoting
   it means its higher-intent candidates are tried while budget remains.
4. **Persist the lane.** No column exists and none is needed for v1: write `lane` into
   `raw_metadata.outreach_context` (via `enrichment.ts`) and add per-lane counters to the run funnel
   (`backlink_prospect_runs.metadata`, alongside `intersection_candidates`). This makes incremental
   send-ready domains per lane queryable without a migration. If a first-class column is wanted later,
   file it as a follow-up.
5. **Wording:** fresh-lane framing may say the link was "recently picked up" / "recently discovered by
   the crawler". Never state or imply an exact publication date — `first_seen` is crawler discovery,
   not publish time.
6. **Cursors independent per lane** also means `getLastMozCursor` must be passed the lane and the
   completion writer must merge (not overwrite) the other lanes' tokens.

## Safety constraints

- Same DR filter, dofollow requirement, blocked-host list, and per-competitor cap
  (`CAP_PER_COMPETITOR = 15`) apply to every lane.
- Fresh links are more likely to be low-quality or spam-adjacent; keep the existing
  `score-backlink-relevance.ts` gate and consider a slightly higher minimum score for the `fresh`
  lane after reviewing a sample.
- Do not let intersection + fresh + authority for the same competitor collectively exceed the shared
  attempt or cost cap — the stop controller is the single authority.

## Evaluation / success signal

Meaningful incremental unique send-ready domains beyond today's authority-ranked pool, at comparable
contact success and relevance rates, with each lane's contribution attributable in the funnel. Track:
new unique domains after dedupe per lane, ready-per-attempt per lane, zero-result rate per lane, cost
per incremental send-ready row, and bounce/dismissal/reply signals after a safe observation window.
Promote a lane to adaptive allocation only if it clears that bar; keep it off if its yield is mostly
duplicates of the authority lane.

## Tests

- Lane cursors are read and written independently; completing a `fresh` run does not disturb the
  `authority` or `intersection` token for the same competitor.
- A competitor whose `authority` lane is exhausted still runs its `fresh` lane.
- Legacy `moz_cursors` string tokens are interpreted as the `authority` cursor; legacy
  `exhausted_competitor_domains` string entries are interpreted as `authority` exhaustion.
- A `fresh` row and an `authority` row for the same linking domain dedupe to a single prospect
  (`persist-and-enrich.ts` domain dedupe).
- Run funnel counters split gathered/fetched/qualified/attempted/ready by lane.
- Intersection runs before authority in the loop and still stops on `shouldStop()` / zero budget.
- Total attempts and cost across all three lanes for one product/day never exceed the shared caps.

## Relevant files

- `apps/server/src/helpers/data-for-seo/get-backlinks.ts`
- `apps/server/src/helpers/data-for-seo/get-backlink-page-intersection.ts`
- `apps/server/src/methods/prospect-generation-methods/competitor-backlink/index.ts`
- `apps/server/src/methods/prospect-generation-methods/competitor-backlink/process-competitor.ts`
- `apps/server/src/methods/prospect-generation-methods/competitor-backlink/prospect-run-tracking.ts`
- `apps/server/src/methods/prospect-generation-methods/competitor-backlink/enrichment.ts`
- `apps/server/src/methods/prospect-generation-methods/shared/persist-and-enrich.ts`
- `apps/server/src/jobs/daily-discovery-stop-controller.ts`

## Research references

- DataForSEO backlinks endpoint: https://docs.dataforseo.com/v3/backlinks-backlinks-live/
- DataForSEO backlink filters (`is_new`, `is_lost`, `first_seen`, `last_seen`):
  https://docs.dataforseo.com/v3/backlinks-filters/
- DataForSEO page intersection: https://docs.dataforseo.com/v3/backlinks-page_intersection-live/
