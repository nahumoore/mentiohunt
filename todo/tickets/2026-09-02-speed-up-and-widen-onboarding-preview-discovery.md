# Speed up and widen onboarding preview discovery

- **Status:** Not started
- **Priority:** P0
- **Scope:** The preview-mode discovery pass behind `/onboarding/preview` — how long it
  takes, how many opportunities it returns, and how much it spends. Covers the page
  crawl/categorization stage, the per-strategy candidate caps, where the DR filter runs,
  duplicated DataForSEO fetches, and how results reach the preview page.
- **Related ticket:** `2026-09-02-async-onboarding-preview-before-card-trial.md` owns the
  preview flow, its lifecycle states, emails, and checkout. This ticket only fixes the
  discovery pass that feeds it.
- **Out of scope:** Contact enrichment, email verification, and outreach drafting. The
  preview must continue to produce **no** outreach detail until the user activates a trial.
  New discovery strategies. Changing the activated (post-checkout) discovery defaults
  except where explicitly stated.

## Outcome

A first-time visitor should see a meaningful set of real opportunities within roughly
**3–4 minutes**, not 14, and the preview should surface most of what the run already paid
DataForSEO to find rather than a small fraction of it.

Targets for a product of comparable size to the reference run below:

- wall-clock time to `ready`: **≤ 4 minutes** (was 14m26s);
- opportunities shown: **15+** (was 6);
- cost per preview: **no higher than today's ~$0.22**, ideally lower.

## Evidence — reference run

Product `reddinbox.com`, preview `4abb6e28-b42c-409f-87c1-aa79c665c9fd`, log
`apps/server/.logs/onboarding-preview-4abb6e28-b42c-409f-87c1-aa79c665c9fd-2026-09-02T22-29-23-448Z.txt`.
Total 866s, 6 opportunities, $0.2186.

### Where the time went

| Stage | Finished at | Duration |
|---|---|---|
| Unlinked mentions | 1m49s | 108s |
| Listicle roundups | 3m20s | 199s |
| Competitor backlinks | 4m40s | 279s |
| Page crawl + categorization | 11m55s | **714s** |
| Stage 2 (resource pages + broken links) | 14m26s | 151s |

The crawl itself took 3 seconds. The remaining 711s was `categorize-pages` on one batch of
15 pages: it failed across all three models twice and only succeeded on the third attempt
(242s + 242s + 214s, with 3s and 10s backoff). Because `run-onboarding-jobs.ts` gates stage 2
on the whole crawl promise, that single stuck batch delayed resource-page and broken-link
discovery by ~7 minutes — and resource pages produced **3 of the 6** opportunities.

### Where the opportunities went

| Strategy | Found | Examined | Passed relevance | Survived DR | Opportunities |
|---|---|---|---|---|---|
| Resource pages | 76 | 20 (cap) | 9 | 3 | 3 |
| Listicles | 218 | 25 (cap) | 4 | 1 | 1 |
| Unlinked mentions | 45 | 15 (cap) | 6 → 1 scored | 4 | 1 |
| Competitor backlinks | 88 | 37 | 1 | — | 1 |
| Broken links | 118 | 2 dead targets | 0 | — | 0 |

### Wasted spend

- Broken-link building re-fetched the same three competitors' backlinks that
  competitor-backlink discovery had already fetched 8 minutes earlier (gummysearch,
  gigabrain, kurationai — twice each). ~$0.077 for 0 opportunities.
- Two of the three competitors returned backlink profiles that were entirely link-farm
  spam (titles such as `🏆🏆Boost your Google rankings with Premium PBN` and
  `Where to buy 🚀 aged domains and backlinks`). 24 LLM scoring calls, 0 passes. The
  existing `isNoisyUrl` noise filter dropped none of them.

## Root causes

1. **Page categorization can block the entire run.** `categorize-pages.ts` uses
   `BATCH_SIZE = 15` with a `60_000 + pages.length * 4_000` timeout and the default
   three-retry `withLlmRetries` ladder. A slow batch costs up to ~6 minutes per attempt
   across the model fallback chain, and there is no cheap fallback — the run just waits.
2. **Stage 2 waits for full categorization even though it only needs the top pages.**
   `run-onboarding-jobs.ts` awaits the whole `crawlProductPages` promise before starting
   resource-page and broken-link discovery.
3. **The DR filter runs after the expensive work.** In listicle, unlinked-mention and
   resource-page discovery, candidates are fetched and LLM-scored first, and only then
   checked against `dr_min`/`dr_max`. Listicles paid to score 25 candidates, qualified 4,
   and lost 3 of those 4 to the DR gate. Domain ratings come from Ahrefs'
   `domain-rating-free` endpoint (`helpers/ahrefs/get-domain-rating.ts`), so checking
   earlier costs nothing extra.
4. **Preview caps are far below the search results already paid for.** The SERP spend has
   already happened by the time `maxCandidates` applies: listicles examined 25 of 218
   unique URLs, resource pages 20 of 76, mentions 15 of 45.
5. **`dr_max = 60` is applied to the preview.** That ceiling is a deliberate outreach
   reply-rate decision (see `dr-max-warning-dialog.tsx`), but the preview shows
   opportunities with no outreach attached, and the ceiling removed several of the most
   impressive finds (Lotame 78, Slashdot 87, Guideflow 62).
6. **Competitor backlinks are fetched twice** — once by `competitor-backlink` and again by
   `broken-link-building`, for the same competitor set in the same run.
7. **Listicle queries are too broad.** Queries built from `target_keywords` categories
   ("audience intelligence platform") returned enterprise pages — Gartner, Zendesk,
   Sprinklr, Lotame — that will not link to a small Reddit tool. 21 of 25 were rejected.

## Required changes

### 1. Categorization must never gate the run (P0)

- Reduce `BATCH_SIZE` in `categorize-pages.ts` from 15 to 6–8 so a batch fits comfortably
  inside its timeout.
- In preview mode, use a single retry rather than the full `LLM_RETRY_DELAYS_MS` ladder.
- Fail open: when a batch exhausts its retries, fall back to the existing keyword/URL
  ranker (`rank-candidate-urls.ts`) plus a path-based page-type guess instead of dropping
  the pages. A preview must never stall because one classification batch is slow.
- In preview mode, only categorize the top ~15 ranked candidates. `DEFAULT_KEEP_TOP` is 5;
  classifying all 39 crawled pages buys nothing for the preview.

### 2. Start stage 2 as soon as target pages exist (P0)

Have `crawlProductPages` signal target-page selection separately from full completion, and
start resource-page and broken-link discovery on that signal in
`run-onboarding-jobs.ts`. Keep the existing guard that skips stage 2 when no pages were
selected.

### 3. Move the DR check before fetch + scoring (P0)

In `listicle-roundup`, `unlinked-mention` and `resource-page-inclusion`, resolve domain
ratings on the deduped candidate list first and drop out-of-range domains before spending
page fetches and LLM scoring on them. Keep concurrency bounded (`enrich-domain-ratings.ts`
currently uses `pLimit(5)`) and handle the null/failed-lookup case explicitly — a domain
whose DR cannot be resolved must not be silently dropped in preview mode.

Consider a shared domain→DR cache so the same domain is not looked up once per product per
run; there is currently no cross-product cache table.

### 4. Raise the preview candidate caps (P0)

In `run-onboarding-jobs.ts`:

- `ONBOARDING_LISTICLE_LIMITS.maxCandidates`: 25 → 75
- `ONBOARDING_MENTION_LIMITS.maxCandidates`: 15 → 30
- resource-page `maxCandidates`: 20 → 50 (pass an explicit override rather than relying on
  `DEFAULT_LIMITS`)

These only widen the post-SERP scoring pool; no additional DataForSEO/SERP calls are
incurred. Verify the added fetch + scoring time stays within the 4-minute target and adjust
if a strategy becomes the new critical path.

### 5. Widen the DR band for preview only (P1)

Use `dr_max = 80` (or drop the ceiling entirely) in preview mode while leaving the stored
`backlink_prospects_settings` value untouched for activated discovery. If a shown
opportunity is above the user's configured ceiling, mark it honestly in the UI as harder to
win rather than hiding it.

### 6. Share one competitor backlink fetch (P1)

Fetch each competitor's backlinks once per run and let both `competitor-backlink` and
`broken-link-building` read from that result. Removes a duplicated DataForSEO spend of
~$0.077 per preview.

### 7. Screen out link-farm competitors early (P1)

- Extend the noise filter with cheap spam signals (PBN/aged-domain/backlink-selling
  phrases in `page_from_title`, emoji-stuffed titles, hashed/opaque path patterns such as
  `/page-<32 hex>.html` and `/all/<n>/<n>.html`).
- Skip a competitor for the rest of the run once its first scored batch returns zero
  passes, instead of paying for the next batch.
- With the screen in place, raise preview `maxCompetitors` from 3 to 5.

### 8. Improve listicle query construction (P1)

Add competitor-anchored query templates — `best <competitor> alternatives`,
`<competitor> vs`, `<competitor> alternatives <year>` — alongside the current
category-keyword templates. These surface roundups that already list small tools, which is
the segment that actually accepts additions.

### 9. Stream results into the preview page (P1)

Show opportunities as each strategy completes rather than only at the end. In the reference
run, mentions were ready at 1m49s and listicles at 3m20s while the user saw nothing for
14 minutes. The preview lifecycle already has a `processing` state; it needs to render
partial results while still processing.

## Explicitly unchanged

Preview mode must keep producing zero outreach detail before activation. The reference run
is already correct here (`enrichmentBudget = { remaining: 0 }`, `enrichmentAttempts: 0`,
`contactReady: 0`, no sequences, no summary email) and nothing in this ticket may weaken
it. Every change above must preserve:

- no contact enrichment or email verification;
- no outreach copy generation;
- no sequence creation or sending-account allocation;
- no entry into recurring discovery or the outreach sender.

## Acceptance criteria

- A preview for a product comparable to `reddinbox.com` reaches `ready` in ≤ 4 minutes and
  returns 15+ opportunities.
- A categorization batch that exhausts its retries degrades to heuristic categorization and
  does not delay the run by more than its own timeout.
- Resource-page and broken-link discovery start within seconds of target-page selection,
  not after full categorization.
- For listicles, mentions and resource pages, no candidate is page-fetched or LLM-scored
  after being excluded by the DR range.
- Each competitor's backlinks are fetched at most once per preview run.
- A competitor whose first scored batch yields zero passes is not scored again in that run.
- Preview cost per run does not exceed the current ~$0.22 baseline.
- The preview page renders opportunities from completed strategies while later strategies
  are still running.
- A preview run still creates no contact data, no outreach copy, and no sequences.

## Tests

- Re-run the preview for `reddinbox.com` and compare duration, opportunity count, and cost
  against the reference run above.
- Force every categorization model to fail and verify the run completes with heuristic
  categories, target pages selected, and stage 2 still executing.
- Verify with a product whose candidates are mostly above `dr_max` that no fetch/scoring
  cost is incurred for them.
- Verify the DataForSEO call count per competitor per run is 1, using the run digest logs.
- Feed a competitor with a known link-farm backlink profile and verify it is dropped before
  LLM scoring.
- Verify a preview run produces zero rows with contact data, zero outreach drafts, and zero
  sequences, including when a shared sending account is resolvable.
- Verify a preview that finds nothing still reports `partial`/zero-result honestly.

## Relevant files

- `apps/server/src/processes/onboarding/run-onboarding-jobs.ts` — preview limits, stage
  gating, preview-mode DR override
- `apps/server/src/methods/product-pages/categorize-pages.ts` — batch size, retry policy,
  fail-open fallback
- `apps/server/src/methods/product-pages/crawl-product-pages.ts` — signal target-page
  selection before full completion; preview-mode categorization subset
- `apps/server/src/methods/product-pages/rank-candidate-urls.ts` — heuristic fallback source
- `apps/server/src/helpers/llm-retry.ts` — preview-mode retry ladder
- `apps/server/src/methods/prospect-generation-methods/listicle-roundup/index.ts` — caps,
  DR-first ordering, competitor-anchored queries
- `apps/server/src/methods/prospect-generation-methods/unlinked-mention/index.ts` — caps,
  DR-first ordering
- `apps/server/src/methods/prospect-generation-methods/resource-page-inclusion/index.ts` and
  `types.ts` — caps, DR-first ordering
- `apps/server/src/methods/prospect-generation-methods/competitor-backlink/index.ts`,
  `process-competitor.ts`, `extract-backlinks.ts`, `filter-backlinks.ts` — shared fetch,
  spam screen, competitor count
- `apps/server/src/methods/prospect-generation-methods/broken-link-building/index.ts` and
  `process-competitor.ts` — consume the shared competitor backlink fetch
- `apps/server/src/methods/prospect-generation-methods/shared/url-filters.ts` — spam signals
- `apps/server/src/methods/prospect-generation-methods/shared/enrich-domain-ratings.ts` —
  DR-first lookups and optional cache
- `apps/web/app/onboarding/preview/` — render partial results while processing
