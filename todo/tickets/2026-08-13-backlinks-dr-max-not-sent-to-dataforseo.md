# DR ceiling never reaches the DataForSEO backlink query — only applied after fetch

## Effort: S — 3 files, ~30-45 min

## Background

`broken_link_building` is new to Mentiohunt's rotation and has run twice (2026-08-08, 2026-08-13), finding 0 prospects both times. Small sample, but the audit turned up a verifiable code-level gap shared with `competitor_backlink` too, worth fixing regardless of sample size.

## Root cause

`GetBacklinksParams` (`apps/server/src/helpers/data-for-seo/get-backlinks.ts:21-26`) only has a `drMin` field — there's no `drMax` at all. The filter actually sent to DataForSEO (`get-backlinks.ts:34-36`) is `domain_from_rank >= drMin` only:

```ts
const filters: unknown[] = [["dofollow", "=", true]]
if (drMin > 0) {
  filters.push("and", ["domain_from_rank", ">=", drMin])
}
```

`dr_max` is enforced only afterward, client-side, in both callers of this shared helper:
- `broken-link-building/filter-dead-link-candidates.ts:21` — `if (settings.dr_max !== null && item.domainRating > settings.dr_max) return false`
- `competitor-backlink/filter-backlinks.ts:26` — same pattern

The fetch itself is `order_by: rank,desc`, `limit=50`, `mode: one_per_domain` — sorted highest-DR-first. For Mentiohunt's DR-90+ competitors (ahrefs.com, semrush.com, moz.com), the top 50 unique-domain backlinks by rank skew heavily above `dr_max=60` (this product's setting), so a large share of each 50-item fetch window is spent on backlinks that get thrown away client-side before dead-link checking (`broken-link-building`) or qualification (`competitor-backlink`) ever runs.

`competitor_backlink` is likely masked from the impact by sheer backlink volume — it still lands 8-21 prospects/run. `broken_link_building` has no such cushion.

## Fix

Add a `drMax` param to `GetBacklinksParams` and push `["domain_from_rank", "<=", drMax]` into the same filter array in `get-backlinks.ts`. Then pass `drMax: filters.dr_max` from both existing call sites:
- `broken-link-building/extract-dead-targets.ts:25` (already threads `dr_max` through its own `filters` type, just needs to forward it to `getBacklinks`)
- `competitor-backlink/extract-backlinks.ts:41-43` (same)

Same API call, same cost — just spends the existing fetch window on backlinks that can actually survive the DR filter instead of discarding them after paying for the fetch. The existing client-side `dr_max` filters can stay as a safety net; no need to remove them.
