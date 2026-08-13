# Unlinked mention: query rotation locks into 3 dead-weight pairs

## Effort: XS — 1 file, ~15 min

## Background

Mentiohunt's own `unlinked_mention` discovery runs found 0, 0, 2, 1, 0, 0, 1, 0 prospects over its last 8 runs (product_id `c73dce3c-b3b3-4633-b772-4150a9cde654`) — half the runs found nothing, far below what `competitor_backlink` finds per run (8-21) from a different data source. Investigated whether this is inherent to a young brand's web presence or a code-level bug worth fixing without adding API/LLM cost.

## Root cause (verified against `backlink_prospect_runs`)

`index.ts:60-67` defines a 6-query pool: bare brand name, `+review`, `+alternatives`, `+vs`, `+pricing`, `+tutorial`. `selectQueriesForRun` (`prospect-run-tracking.ts:38-44`) picks the 2 least-recently-run queries each time via a plain sort-and-slice.

Because pool size (6) is exactly `3 × MAX_QUERIES_PER_RUN` (2), this selection is mathematically periodic with period 3 — every run swaps the *entire* 2-query window rather than sliding by one slot, so the same three pairs cycle forever:

- `[brand-alone, +review]` → ran 07-17, 07-31, 08-10 → **0, 0, 0**
- `[+alternatives, +vs]` → ran 07-22, 08-02 → 2, 0
- `[+pricing, +tutorial]` → ran 07-26, 08-05 → 1, 1

That lines up exactly with the reported per-run counts, confirming this isn't chance. `[brand-alone, +review]` is structurally dead for Mentiohunt right now (a bare-brand search is dominated by stable/already-seen domains, and "Mentiohunt review" has no indexed content yet) — and it consumes a full third of this method's entire search budget, forever, because the rotation can never break that pair apart to try a more promising combination.

## Fix

In `prospect-run-tracking.ts`, change `selectQueriesForRun` so the LRU rotation advances by 1 query per run instead of swapping the full `maxQueries`-sized window — i.e. still pick the 2 stalest queries each run, but let each run's picks overlap the previous run's rather than only recurring as a fixed pair. Same 2 rotating + 1 freshness query per run (`index.ts:68-73`), same SERP/LLM cost — pure selection-order change.

## Not in scope here

`NOISE_DOMAINS` in `shared/url-filters.ts` blocklists `medium.com` wholesale across all discovery methods. Medium hosts genuine author-editable posts, not just an aggregator, so it may be discarding real unlinked-mention candidates — flagged for a separate look since it's shared code touching other methods too and needs run-history evidence before recommending a change.
