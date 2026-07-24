# Known issue: unrounded Ahrefs domain rating fails integer column insert, drops prospect

## Summary

`getDomainRating()` (`apps/server/src/helpers/ahrefs/get-domain-rating.ts:48-49`) returns
the raw Ahrefs free-tier `domain_rating` value with no rounding:

```ts
const value = json.domain_rating?.domain_rating
return typeof value === "number" && Number.isFinite(value) ? value : null
```

Ahrefs' free DR endpoint returns decimals for low-authority/new domains (not just whole
numbers). Observed on Railway `server` during the 2026-07-24 07:00 UTC daily discovery
cron: `error: 'invalid input syntax for type integer: "2.8"'`, immediately after a
`[check-listicle-client]` scraper burst in the same run.

## Root cause

`backlink_prospects.domain_rating` is a Postgres `integer` column. The unrounded float
from `get-domain-rating.ts` flows through `enrichDomainRatings()` → a per-domain
`drByDomain` map → straight into the `domain_rating` field of the upsert/insert payload
at five call sites, all gated behind "only fetch DR when the product has a DR filter
configured" (`settings.dr_min > 0`):

- `apps/server/src/methods/prospect-generation-methods/listicle-roundup/index.ts:279`
- `apps/server/src/methods/prospect-generation-methods/resource-page-inclusion/index.ts:305`
- `apps/server/src/methods/prospect-generation-methods/competitor-backlink/process-competitor.ts:173`
- `apps/server/src/methods/prospect-generation-methods/unlinked-mention/index.ts:263`
- `apps/server/src/jobs/update-directory-seo-metrics.ts:115` and `:193`

None of these round or floor the value before writing it. The insert fails at the DB
layer, gets caught, and logged as a warning (e.g. listicle-roundup's `log.warn("bare
prospect insert failed", { error: insertError.message })` at index.ts:295) — so it never
crashes, it just silently fails per-row.

## Impact

Whenever Ahrefs returns a fractional DR for a candidate domain on a product with a DR
filter set, that single prospect's insert fails and the row is dropped — silent data
loss, same shape as the other known "caught-and-skip" issues in this codebase (no
alert, no user-visible signal). Recurring, not one-off: any product with `dr_min > 0`
running discovery against a domain that happens to score a decimal DR hits this every
time. Reduces discovery yield specifically for DR-filtered products, which are likely
the users who care most about DR accuracy in the first place.

## Recommendation (not yet actioned)

Fix at the single source rather than patching five call sites: round in
`getDomainRating()` (`get-domain-rating.ts:49`), e.g. `Math.round(value)`, before
returning. Confirm with Ahrefs' docs/samples whether fractional values are the norm
(not just an edge case) so the rounding choice (round vs. floor) matches how DR is
displayed/compared elsewhere in the product (e.g. `dr_min`/`dr_max` filter semantics in
`filter-backlinks.ts`).
