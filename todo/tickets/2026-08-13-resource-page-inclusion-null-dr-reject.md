# Resource page inclusion: unknown domain rating auto-rejects already-scored candidates

## Effort: XS — 1 file, ~15 min

## Background

`resource_page_inclusion` found 0 prospects in 3 of its last 8 runs for Mentiohunt (product_id `c73dce3c-b3b3-4633-b772-4150a9cde654`, settings `dr_min=5, dr_max=60`). One of those zero-runs (2026-07-30) still cost $0.024 — the highest per-run cost in the batch — meaning candidates made it all the way through LLM relevance scoring before being discarded.

## Root cause

Confirmed at `apps/server/src/methods/prospect-generation-methods/resource-page-inclusion/index.ts:252-263`:

```ts
if (settings.dr_min > 0 || settings.dr_max !== null) {
  ...
  qualified = qualified
    .map((q) => ({ ...q, domainRating: drByDomain.get(q.domain) ?? null }))
    .filter((q) => {
      const dr = q.domainRating
      if (dr === null) return false   // <-- unknown rating treated as failed
      if (dr < settings.dr_min) return false
      if (settings.dr_max !== null && dr > settings.dr_max) return false
      return true
    })
```

This runs *after* the LLM relevance scoring batch (`scoreResourcePageInclusion`, line 232) has already scored and cost money on these candidates. A `null` domain rating — Ahrefs/Moz has no data for that domain — is exactly what you'd expect from small niche curator sites, which is precisely the kind of site this method is supposed to find. Treating "unknown" the same as "failed the DR check" throws away paid-for work and matches the 2026-07-30 zero-prospect run.

## Fix

Don't hard-reject on `dr === null`. Either let unknown-DR candidates through unfiltered, or fall back to the already-computed site-relevance score as the gate for those. No new calls — the scoring cost was already spent regardless of outcome.

## Also worth doing while in this file (lower priority, same zero-cost bar)

- `query-planning.ts` selects only 3 pages × 2 queries per run against a ~40-page eligible pool (`DEFAULT_PAGE_TYPES`/`minPriority` filtering, `types.ts:39,51-52`) — full-catalog coverage takes ~65-70 days. Rebalancing to e.g. 6 pages × 1 query keeps the same 6-query SERP cost but halves the cycle time and diversifies domains per run.
- The pre-scoring candidate cap (`index.ts:198-200`) slices candidates in raw insertion order, so one broad query can crowd out the other 2 pages' candidates before scoring runs at all (seen in the 08-04 run: 68 gathered, only 20 scored). Round-robining across page/query groups before the slice costs nothing extra.

Neither of these is required to land the main fix above — flagging so they're not lost, revisit after the null-DR fix has enough new run history to show whether it alone moved the needle.
