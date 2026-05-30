# Competitor backlink discovery — apps/server

## Context

Mentiohunt's Backlink Building engine already discovers **directory** opportunities for each product via `apps/server/src/methods/directories/check-product-directories.ts` and upserts them into `backlink_prospects`. The same table's `tier` enum already supports `competitor_backlink` (see `packages/supabase/database-types.ts:333`), and onboarding already collects each product's competitor URLs (`products.competitors: string[]`, stored as fully-qualified homepage URLs from `apps/web/app/api/onboarding/complete/route.ts:65-71`).

What's missing: a server-side flow that, for each product, pulls the referring domains/pages linking to its competitors, filters them by the user's quality bar (DR range, traffic, dofollow, language — already in `backlink_prospects_settings`), enriches contacts, and upserts the survivors as `tier="competitor_backlink"` prospects. This doc plans that flow, scheduled-only, mirroring the existing directory discovery pattern.

Decisions captured up front:
- **Apify actor (backlinks)**: `pro100chok~ahrefs-seo-tools` — Ahrefs All-in-One SEO Scraper, searchType="backlinks". $5/1k results, no Ahrefs subscription needed. Confirm exact output field names from live run before wiring filters.
- **Trigger**: scheduled cron only (no manual UI button this iteration)
- **Onboarding/settings**: no new fields — reuse `competitors[]` + `backlink_prospects_settings`
- **Contacts**: in scope, basic enrichment

## Approach

### 1. Apify fetch abstraction
- New file `apps/server/src/helpers/apify.ts`: `runApifyActor<TInput, TItem>(actorId, input, opts?)` wraps the existing fetch-to-`run-sync-get-dataset-items` pattern (timeout 360s, `APIFY_TOKEN` env, error parsing). Refactor existing call sites at `apps/server/src/jobs/update-directory-seo-metrics.ts:45` and `apps/server/src/methods/directories/serp-check.ts:39,95` to use it.
- Extend `apps/server/src/actors/apify.ts:12` with two new constants (placeholder IDs, filled at impl time):
  - `COMPETITOR_BACKLINKS_SCRAPER`
  - `CONTACT_ENRICHMENT`

### 2. Discovery method
`apps/server/src/methods/competitor-backlinks/discover-competitor-backlinks.ts` — entry `discoverCompetitorBacklinks(productId: string)`:
1. Load `products.competitors, website_url` (specific columns per AGENTS.md DB rule)
2. Load `backlink_prospects_settings` row; **skip** if `opportunity_types` does not include `"competitor_backlink"` (mirrors gate at `check-product-directories.ts:42-46`)
3. For each competitor URL → call `runApifyActor(COMPETITOR_BACKLINKS_SCRAPER, { url })` via `p-limit` (concurrency 3) + `p-retry` on 429/5xx (reuse `apps/server/src/helpers/rate-limit.ts`)
4. Normalize each result into `{ referring_domain, referring_page_url, dr, traffic, dofollow, language }`

### 3. Filter pipeline
`apps/server/src/methods/competitor-backlinks/filters.ts` — pure functions, easy to unit-test:
- `dr` ∈ `[dr_min, dr_max ?? Infinity]`
- `traffic ≥ traffic_min`
- if `dofollow_only` → `dofollow === true`
- if `languages.length > 0` → `language ∈ languages`
- exclude user's own domain (parsed from `products.website_url`)
- exclude domains already present in `backlink_prospects` for this `product_id`
- dedupe per run by `referring_domain`, keep highest-DR row → that page's URL becomes `target_url`

### 4. Contact enrichment
`apps/server/src/methods/competitor-backlinks/enrich-contact.ts` — `enrichContact(domain)` calls `runApifyActor(CONTACT_ENRICHMENT, { domain })`, returns `{ contact_email?: string, contact_name?: string }`.
- Cost control: enrich only top **N=20** survivors per product per run, sorted by DR desc. Lower-ranked prospects upsert with `action_type="self_service"`.
- Top-N with contact found → `action_type="email_outreach"`.

### 5. Upsert
Mirror `check-product-directories.ts:130-146`:
```ts
await supabaseAdmin.from("backlink_prospects").upsert(rows, { ignoreDuplicates: true })
```
Row shape:
- `product_id`, `domain` (referring_domain), `target_url` (referring_page_url)
- `tier: "competitor_backlink"`, `directory_id: null`
- `status: "new"`, `discovered_at: now`
- `action_type`, `contact_email`, `contact_name` per enrichment outcome
- `email_subject` / `email_body` left as schema defaults this iteration (generation can be a later pass)

**Open item before merge**: confirm `backlink_prospects` has a unique constraint enabling `ignoreDuplicates` (likely `(product_id, domain)` or `(product_id, target_url)`). If missing, add a migration. Check via Supabase console or `pg_indexes`.

### 6. Scheduled job
`apps/server/src/jobs/discover-competitor-backlinks.ts`:
- Selects all `backlink_prospects_settings` rows where `opportunity_types @> '{competitor_backlink}'`
- For each: `await discoverCompetitorBacklinks(productId)` via `p-limit` (concurrency 2 across products)
- Registered in `apps/server/src/jobs/index.ts` with cron `"0 3 * * 1"` (Mon 03:00 UTC, weekly). Existing `!isDev` gate keeps it production-only.

### 7. Logging
`createLogger("competitor-backlinks")` per AGENTS.md line 113. Log start/end per product, prospect counts after each filter stage, Apify errors. No `console.*`.

## Files

**New**
- `apps/server/src/helpers/apify.ts`
- `apps/server/src/methods/competitor-backlinks/discover-competitor-backlinks.ts`
- `apps/server/src/methods/competitor-backlinks/filters.ts`
- `apps/server/src/methods/competitor-backlinks/enrich-contact.ts`
- `apps/server/src/jobs/discover-competitor-backlinks.ts`

**Modified**
- `apps/server/src/actors/apify.ts` — add 2 constants
- `apps/server/src/jobs/index.ts` — register cron
- `apps/server/src/jobs/update-directory-seo-metrics.ts` — switch to shared helper
- `apps/server/src/methods/directories/serp-check.ts` — switch to shared helper

**Possibly modified**
- Supabase migration for unique constraint on `backlink_prospects` if missing

## Reuse

- Upsert pattern: `apps/server/src/methods/directories/check-product-directories.ts:130-146`
- Apify fetch pattern: `apps/server/src/jobs/update-directory-seo-metrics.ts:45`
- Logger: `apps/server/src/helpers/logger.ts:78`
- Rate-limit/retry: `apps/server/src/helpers/rate-limit.ts`
- Supabase admin client: `packages/supabase/admin.ts:12`
- Opportunity-type gate: `apps/server/src/methods/directories/check-product-directories.ts:42-46`

## Open items (must resolve before/during impl)

1. ~~Backlinks scraper~~: `pro100chok~ahrefs-seo-tools` (searchType="backlinks", $5/1k results). Still needed: run live test to confirm exact output field names → map to `{ referring_domain, referring_page_url, dr, traffic, dofollow, language }`. Contact enrichment actor still TBD.
2. Confirm/create unique constraint on `backlink_prospects` for the upsert.
3. Decide top-N enrichment cap (default 20) once actor pricing is known.

## Verification

1. Seed one product with a known competitor (e.g. linear.app), `opportunity_types` containing `"competitor_backlink"`, sane `backlink_prospects_settings` (`dr_min: 20`, `traffic_min: 100`).
2. Dev-only one-shot trigger: temporarily call `discoverCompetitorBacklinks(productId)` from a guarded dev route or `tsx` script, inspect `.logs/` via `withRouteLog` or scoped logger.
3. Run `pnpm --filter server typecheck && pnpm --filter server build`.
4. Inspect Supabase: rows in `backlink_prospects` with `tier="competitor_backlink"`, `directory_id IS NULL`, sensible `domain` + `target_url`, `contact_email` populated for ~top 20.
5. Re-run: row count stable (dedupe works); raise `dr_min` → row count drops on next run for new survivors.
6. Confirm cron registration: temporarily set `NODE_ENV=production` locally and check log line from `jobs/index.ts:6`.
