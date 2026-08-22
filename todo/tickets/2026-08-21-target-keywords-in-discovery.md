# Wire `products.target_keywords` into discovery

**Status: Phases 1–3 shipped (2026-08-22).** Verified against live Supabase: 55 of 57
products had zero `target_keywords` at ship time, so Phase 2's query-source fallbacks and
Phase 3's prompt anchors are guarded to no-op for them — behaviour is unchanged until
`backfill-target-keywords.ts` runs (tracked in
`todo/tickets/2026-08-21-reprocess-over-cap-product-pages.md`, not run in this change).
One correctness fix landed alongside Phase 2: `resource_page_inclusion`'s query planner
originally let every page fall back to the same `product.target_keywords` list with only
per-page dedup, so multiple pages produced identical queries — up to 3x the SERP/scrape/LLM
cost for one prospect. `buildQueryPlan` now tracks claimed queries across the whole plan.
**Effort: M** (three independently-shippable phases, no new vendor, no new DB table)

## Problem

`products.target_keywords` (added 2026-08-18, capped at 5 with array-order-as-priority on
2026-08-20) is the strongest commercial signal a customer gives us — the terms they actually
want to rank for. Right now it has **zero influence on discovery**.

Its only effect today is two hops removed from any prospect search: keywords decide which of
the customer's *own* sitemap pages get crawled and promoted to `is_target = true`
(`methods/product-pages/crawl-product-pages.ts:55`, bails entirely when empty); those pages
then get a separate, LLM-invented set of topics (`product_pages.keywords`,
`categorize-pages.ts:63`) that *is* what discovery actually queries on. `DiscoveryProduct`
(`jobs/daily-backlink-discovery.ts:39-46`) and every per-method `Product` type have no
keyword field at all, and the products query (`:287`) and the onboarding equivalent
(`processes/onboarding/run-onboarding-jobs.ts:46`) both omit the column outright.

Four concrete gaps follow from that:

### 1. `listicle_roundup` pays an LLM every run to re-invent what the keywords already say

`listicle-roundup/build-listicle-queries.ts:13-19` calls `qwen3.6-flash` (fallback
`deepseek-v4-pro`, `thinkingBudget: 1000`) on product name + description to produce
*"3 to 5 short category phrases (2-4 words)"*, then expands each into
`best {cat} -site:own`, `top {cat} -site:own`, `best {cat} after:{date} -site:own`.
`MAX_CATEGORIES = 5` is coincidentally the same cap as `MAX_TARGET_KEYWORDS`. This call is
billed on every run, its output is non-deterministic run to run, and it can drift from what
the customer actually confirmed.

### 2. `resource_page_inclusion` queries LLM-invented page topics, never the confirmed keywords

`resource-page-inclusion/query-planning.ts:31-41` crosses `page.keywords.slice(0, 8)` with 6
templates (`types.ts:41-48`), falling back to the page title
(`helpers.ts:22-26`, `fallbackKeywords`) when `keywords` is empty. Those page keywords come
from `categorize-pages.ts:63` — *"Extract 5–10 target keywords — the specific topics this
page is about."*

Meanwhile `product_pages.matched_keywords` already records **which of the customer's
target keywords each page genuinely serves** (`categorize-pages.ts:75`, guarded against the
model echoing a `"1. "` prefix by `sanitizeMatchedKeyword` at `:150-158`). It's persisted,
shown in the dashboard, and read by nothing in discovery.

Keyword hygiene downstream is also thin: `cleanKeyword` (`helpers.ts:18`) only strips
quotes/whitespace and truncates at 80 chars — no dedup across pages, no intent filter.

### 3. No relevance scorer sees the keywords

- `shared/score-site-relevance.ts:26` — product name + description only
- `competitor-backlink/score-backlink-relevance.ts:35` — same
- `listicle-roundup/score-listicle-relevance.ts` — same
- `resource-page-inclusion/score-resource-page-inclusion.ts:141` — the *only* relevance
  judgement anywhere that sees keywords, and they're the page's own extracted topics, not the
  customer's confirmed targets

This is the same failure class `ee2c798` (2026-08-18) patched by hand after a customer
flagged fluentu.com and copycatcafe.com as irrelevant competitor blogs. A prose product
description is a weak audience gate; a ranked, customer-confirmed keyword list is a
materially sharper one.

Related: `scoreSiteRelevance` runs on every candidate in every method and writes
`backlink_prospects.site_relevance_score` — nothing filters or ranks on that score today. We
already pay for a signal we discard; making it keyword-aware is what would make it trustworthy
enough to eventually gate on (see Non-goals — not proposed here).

### 4. Keyword priority is honoured for the customer's own pages, not for discovery

`methods/product-pages/rank-candidate-urls.ts:30-36` already weights keyword *i* by
`(len - i) / len` when ranking sitemap URLs. Nothing in discovery has an equivalent. This
matters because query budget is small and rotated: RPI runs only `maxQueriesPerPage = 2` of a
possible 8 keywords × 6 templates = 48 per page (`types.ts:50-59`), and
`selectQueriesForRun`'s LRU-then-alphabetical selection would give keyword #5 the same share
of that budget as keyword #1.

### Where keywords legitimately don't apply — leave alone

- `unlinked_mention` searches brand terms only (`unlinked-mention/index.ts:63-76`) — correct as-is.
- `competitor_backlink` is DataForSEO-driven with no query construction — keywords apply only
  to its relevance scorer (covered in Phase 3).
- The public free tools (`methods/guest-post-sites/derive-niches.ts` etc.) take a bare URL
  with no product record — re-deriving niches there is correct and out of scope.

## Resources used

| Resource | Where | Status |
|---|---|---|
| `products.target_keywords` (priority = array order) | `database-types.ts:804` | exists |
| `product_pages.matched_keywords` | `database-types.ts:739` | exists, unused downstream |
| Keyword-priority weighting formula | `rank-candidate-urls.ts:31-34` | exists — reuse, don't reinvent |
| Listicle query pool | `listicle-roundup/build-listicle-queries.ts` | exists — gate the LLM call, don't duplicate |
| RPI query planning | `resource-page-inclusion/query-planning.ts` | exists — change keyword source only |
| Four relevance scorers | see §3 above | exist — add keyword context to prompts only |

No new vendor spend, no new DB table, no new `prospect_tier` value.

## Phase 1 — plumbing (XS, provable no-op)

Add `target_keywords: string[]` to:
- `DiscoveryProduct` (`daily-backlink-discovery.ts:39`), the products `select` (`:287`), and
  the `withProfile` mapper (`:314`)
- each method's local `Product` type (`resource-page-inclusion/types.ts:5`,
  `broken-link-building/types.ts:1`, `listicle-roundup/enrichment.ts`,
  `unlinked-mention/enrichment.ts` — even though unlinked_mention won't consume it, for type
  consistency with the shared `DiscoveryProduct`)
- `processes/onboarding/run-onboarding-jobs.ts:46`, so first-run discovery matches the daily
  job

Ship this alone first. Nothing consumes the field yet, so this diff is behaviour-neutral and
independently reviewable/revertable.

## Phase 2 — query construction

- **`build-listicle-queries.ts`**: when `product.target_keywords` is non-empty, use it
  directly as the category list (already capped at 5, already priority-ordered) and **skip
  the LLM call**. Keep the existing LLM path as the fallback for products with no keywords
  set (older accounts pre-backfill, or ones that cleared their set). This removes one LLM
  call per listicle run and makes the query pool deterministic between runs for a given
  keyword set.
- **`query-planning.ts:31`**: change the keyword source preference to
  `page.matched_keywords` → `product.target_keywords` → `page.keywords` →
  `fallbackKeywords(page)`, so a page whose target-keyword match is known is queried on that
  match first.
- Weight query selection by keyword priority instead of pure LRU-then-alphabetical, reusing
  the `(len - i) / len` weight from `rank-candidate-urls.ts:31-34` rather than inventing a
  second priority scheme. Apply to both `listicle_roundup`'s `selectQueriesForRun` and RPI's
  `buildQueryPlan` sort.

## Phase 3 — scoring

Add the priority-ordered keyword list to the four scorer system prompts (§3 above) as an
explicit topical anchor, e.g.: *"This product's confirmed target keywords, most important
first: {list}. The site's audience should plausibly search for these terms — weight fit
toward the higher-priority ones."*

Model choice must respect `prospect-outreach-strategies/00-shared-groundwork.md` §4: anchor
on `deepseek-v4-pro`, do not add call sites to the already-congested `qwen3.6-flash` /
`glm-4.7-flash`. These scorers run inside the 07:00 UTC cron burst at
`PRODUCT_CONCURRENCY = 5` × each method's internal `pLimit` — adding prompt content doesn't
change call volume, so no new congestion, but keep it in mind if a future phase adds a new
scorer.

Not proposed here, but worth recording as the natural next step once scoring is
keyword-aware: `site_relevance_score` could become a real hard gate instead of a
write-only column. Introducing a new gate changes yield and needs its own before/after dry
run — separate ticket.

## Non-goals

- No change to `unlinked_mention`.
- No new discovery strategy (see `todo/tickets/prospect-outreach-strategies/` for that list).
- No new vendor spend.
- No keyword volume/difficulty enrichment — `target_keywords` carries no DataForSEO volume
  data today; that's a separate question from routing existing keywords into existing
  methods.
- No change to the public free tools (`guest-post-sites`, `directories`, etc.) — they operate
  on a bare URL with no product record.
- No new `prospect_tier` enum value, alert email, or web config entry — this ticket only
  changes inputs to strategies that already exist and are already wired into the rotation.

## Risks to record

- `matched_keywords` is a snapshot of keyword *strings*, not a live join. Renaming or
  reordering a target keyword does not update pages that already matched the old value; only
  a re-crawl reconciles it (`apps/web/app/api/pages/reselect/route.ts` is the existing
  trigger). Worth a line in the customer-facing copy if not already present.
- Editing keywords reshapes the listicle query pool immediately. Stale queries age out of
  `selectQueriesForRun`'s LRU tracking naturally — no invalidation logic is needed, and none
  should be added.
- Replacing the LLM-derived categories with the raw keyword set narrows the listicle pool to
  5 keywords × 3 templates + competitor-alternatives queries (currently the LLM can return
  fewer than 5, or phrase categories differently from the raw keywords). Don't assume this is
  strictly better yield — verify with a dry run first.

## Verification

Dry-run `listicle_roundup` and `resource_page_inclusion` against a product that has
`target_keywords` set, before and after each phase, and diff the generated query pool and
qualified-prospect list — the same before/after validation approach used for `ee2c798`.
Phase 1 should show zero diff. Phase 2 should show a different, keyword-anchored query pool
with unchanged downstream scoring behaviour. Phase 3 should show scoring picking up the new
prompt context without a change in which model handles the call.
