# Reprocess existing products' pages against the new 5-page priority cap

## Background

The pages feature was just changed to match how target keywords already work: a
product tracks at most 5 pages (`MAX_TRACKED_PAGES` in `apps/web/consts/billing.ts`),
each with a distinct `product_pages.priority` 1-5 that the user drags into rank order
— 1 is now the highest priority, matching `products.target_keywords`' array-index
convention. Discovery methods (`resource_page_inclusion`, `broken_link_building`,
the user-submitted-URL picker) were updated to read priority the same way.

That change was shipped **without a data migration**, deliberately — see the plan
this shipped under. It only affects new/newly-touched products going forward.
Existing products are left exactly as they were and need a one-off reprocess pass,
run manually with Claude Code, before the old inverted/duplicated priority values
stop being noise.

## Why this can't just run automatically

Before this change, `product_pages.priority` was **machine-derived, inverted, and
duplicated**: `crawlProductPages` computed it from the LLM's `relevanceScore` via a
`scoreToPriority()` bucket (`≥80 → 5`, `≥60 → 4`, `≥40 → 3`, else floored up to a
minimum of 3), so higher number meant more important, and most pages collapsed into
just 3/4/5. After the flip, the same column means the opposite (1 = best) — so for
every untouched product, priority now reads backwards, and up to 50 pages can share
one priority value.

## Measured data (queried 2026-08-21, before this reprocess ran)

```sql
select count(*) as products_with_pages,
       count(*) filter (where target_pages > 5) as products_over_five,
       sum(target_pages) as total_target_pages,
       sum(greatest(target_pages - 5, 0)) as pages_over_cap,
       max(target_pages) as max_pages_on_one_product
from (
  select p.id, count(pp.id) filter (where pp.is_target) as target_pages
  from products p left join product_pages pp on pp.product_id = p.id
  group by p.id
) t where target_pages > 0;
```

| products_with_pages | products_over_five | total_target_pages | pages_over_cap | max_pages_on_one_product |
|---|---|---|---|---|
| 46 | **37** | 1,469 | **1,252** | 50 |

By tier:

| tier | products | products_over_five | pages_over_cap |
|---|---|---|---|
| free | 44 | 35 | 1,168 |
| **pro** | **2** | **2** | **84** |

Both `pro` products are over cap — do those first.

Current priority distribution, showing the duplication problem directly:

| priority | pages | manual |
|---|---|---|
| 1 | 305 | 0 |
| 3 | 492 | 1 |
| 4 | 12 | 0 |
| 5 | 660 | 0 |

Prospect attachment (the thing that makes deletion unsafe to do blindly):

```sql
select count(distinct pp.id) as target_pages_total,
       count(distinct pp.id) filter (where bp.id is not null) as pages_with_prospects,
       count(bp.id) as prospects_attached
from product_pages pp left join backlink_prospects bp on bp.product_page_id = pp.id
where pp.is_target;
```

Only **66 of 1,469** target pages have any `backlink_prospects` attached (151
prospects total). `backlink_prospects.product_page_id` is `ON DELETE SET NULL`, so
untargeting (`is_target = false`) rather than deleting is the safe move for those 66
— consistent with what `reconcileTargetPages` in
`apps/server/src/methods/product-pages/crawl-product-pages.ts` already does for the
live pipeline's own soft-retire path.

## Proposed pass

For each of the 37 over-cap products (paid tier first):

1. **Re-rank**, don't just trim by existing priority — the existing values are
   inverted/duplicated noise, not a real ranking. Re-score each target page's
   `relevance_score` against the product's `target_keywords` (already priority-
   ordered — index 0 is the product's top keyword). Reuse `categorizePages` from
   `apps/server/src/methods/product-pages/categorize-pages.ts`, the same scorer the
   live pipeline uses, so the ranking logic doesn't diverge. There's already a
   script that does almost exactly this —
   `apps/server/src/scripts/backfill-target-pages.ts` (`--dry-run` flag supported) —
   it was written for an earlier version of this same problem and has just been
   updated in this change to assign dense unique 1..5 priorities instead of the old
   score-bucket. Start there rather than writing a new pass from scratch.
2. **Always keep `is_manual` pages** — they were explicitly chosen by the user, not
   auto-discovered. If a product has more than 5 manual pages (shouldn't happen post-
   cap, but check), that itself needs a judgment call rather than an automatic drop.
3. **Keep the best 5** (manual + top-scoring auto, manual pages taking priority for
   slots), `is_target = false` on the rest. Do not delete rows that have
   `backlink_prospects` attached — soft-retire only, matching `reconcileTargetPages`.
4. **Renumber the 5 survivors 1..5**, dense and unique, best first.
5. Spot-check a handful of results against each product's actual `target_keywords`
   before considering the pass complete — this is exactly the kind of "does this
   ranking make sense for a real business" judgment a scripted pass can get
   structurally right but semantically wrong on.

## Cleanup once this pass is done

- `apps/web/components/pages/pages-client.tsx` has an `overCap` fallback (the old
  sortable/paginated table with no drag-to-rank) that only exists because products
  could have more than 5 target pages. Once every product is at ≤5, that branch and
  its supporting code (mobile card grid, `PageRow`, pagination) can be deleted and
  `/dashboard/pages` can always render the `PriorityReorderList`.
- A `unique (product_id, priority) where is_target` index becomes safe to add at that
  point — right now nothing enforces uniqueness, by design, so this reprocess pass
  (and the live pipeline's own upserts) can't fail on a transient collision.

## Open question

Whether to also run this for products that are exactly at or under 5 pages but still
carry old inverted priority values (their pages aren't "over cap" so they weren't
counted above, but their priority order is still backwards until touched). Cheapest
fix is probably to just widen the reprocess pass to all products with `target_keywords`
set, not only the 37 over-cap ones — the script change already applies to any product
with more than `KEEP_TOP` crawled pages, so this may already be moot for most; worth
confirming counts again once the over-cap pass has run.

## Dependency: `backfill-target-keywords.ts` must run first

Re-confirmed 2026-08-22 during the Targets/target-keywords readiness review: **55 of 57
products have zero `target_keywords`** (only the 2 paid products have any set). Since this
reprocess pass re-ranks each page's `relevance_score` against `target_keywords`
(`categorizePages`), those 55 products have nothing to re-rank against — running the
over-cap pass on them without keywords first would just re-apply the same
score-bucket noise this ticket exists to remove.

`apps/server/src/scripts/backfill-target-keywords.ts` already exists for this (frequency-
ranks the union of each product's crawled `product_pages.keywords`, LLM fallback only for
products with zero crawled pages, never overwrites an existing set, `--dry-run` supported)
and has not been run. Order: run the backfill (dry-run reviewed first, especially for the
2 paid products) before `backfill-target-pages.ts`'s reprocess pass, not after.
