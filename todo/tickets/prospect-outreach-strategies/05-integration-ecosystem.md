# 05 — Integration-ecosystem editorial pages (`integration_ecosystem`)

- **Status:** Proposed — not started
- **Priority:** P3 (cohort-specific; largest build because the prerequisite data does not exist)
- **Depends on:** `todo/tickets/2026-08-27-fix-daily-opportunity-delivery.md`; the
  [enum checklist](README.md#enum-checklist-referenced-by-03-04-05); **plus its own Phase A below**
- **Adds enum value:** `integration_ecosystem`

## Why this one

Integration blogs and third-party ecosystem roundups ("12 tools that connect with Slack", "best
Zapier apps for X") have strong factual audience fit for B2B SaaS, and the inventory naturally expands
as the customer ships more integrations. But an incorrectly inferred integration produces a visibly
false outreach claim — the worst failure mode for sender reputation — so this cannot run on
LLM-guessed data. Treat it as expansion for integration-heavy products, not a universal route to 25.

## What exists today

- **Nothing.** `grep -ri "integration"` across `apps/server/src`, `apps/web`, and `packages/` returns
  only marketing MDX prose. `products` (`packages/supabase/database-types.ts:985-1020`) has only
  `competitors[]`, `target_keywords[]`, `product_description`, `product_name`, `website_url`,
  `user_id`. There is no integrations column, table, or UI.
- The SERP discovery + dedupe + shared-scoring shape used by `guest-post-sites/` and
  `listicle-roundup/` is the reusable pattern for Phase B.

## Implementation

### Phase A — customer-confirmed integrations store (prerequisite)

1. New table `product_integrations` (or a `products.integrations` jsonb column if simpler): per
   product, a list of `{ name, vendor_domain, confirmed_by_user: boolean, source: "user" | "crawl" |
   "llm" }`.
2. Crawling / LLM may **suggest** entries (`confirmed_by_user: false`); discovery in Phase B may only
   ever read `confirmed_by_user: true` rows.
3. Dashboard UI where the customer reviews suggestions and adds/edits/removes integrations. Surface it
   in onboarding and in product settings. Tabler icons only.
4. RLS on the new table; no `anon`/`authenticated` write path beyond the customer's own product.

### Phase B — the discovery strategy

1. New method `methods/prospect-generation-methods/integration-ecosystem/index.ts`, standard
   `StrategyHandler` shape.
2. For each confirmed integration, search third-party editorial pages about that ecosystem
   (`best {vendor} integrations`, `{vendor} apps for {category}`, `tools that integrate with
   {vendor}`, etc.), rotating queries with the least-recently-run mechanism.
3. **Exclude** vendor marketplaces, app directories, GitHub pull-request / awesome-list pages,
   submission forms, and anything that is not an email-a-human editorial page — these collide with the
   product's directory exclusion and are not outreach.
4. Qualify: the page must be a genuine editorial roundup, the customer's product must be absent, and
   every integration the pitch will claim must map to a `confirmed_by_user: true` row.
5. Route through `persistAndEnrich`. Store the specific integration(s) the page is about in
   `raw_metadata.outreach_context`.
6. **Enum + framing + web config** per the checklist. New `OutreachContext` variant
   `{ opportunityType: "integration_ecosystem"; siteTitle; foundUrl; integrationName;
   integrationVendorDomain }`; `buildFraming` branch: lead with the confirmed integration as the
   reason the product fits this specific list. Alert email `send-integration-ecosystem-alert.ts`,
   standard shape.

## Safety constraints

- Every integration claim in an outreach draft must trace to a `confirmed_by_user: true` record. No
  crawl-suggested or LLM-suggested integration is ever asserted to a prospect.
- No marketplace / directory / submission-form targets — that is an explicit product exclusion.
- Products with zero confirmed integrations skip the strategy with a recorded configuration reason.

## Evaluation / success signal

Strong incremental yield **for integration-heavy products specifically**. Track eligible-product
coverage (expected to be a subset), new unique domains after dedupe, ready conversion, and
reply/positive-reply rate. Judge it as cohort expansion — do not expect it to move the median
product-day toward 25.

## Tests

- Discovery reads only `confirmed_by_user: true` integration rows; a crawl-suggested row never
  produces a prospect or an outreach claim.
- Marketplace / directory / GitHub / submission-form URLs are filtered out before enrichment.
- A page where the customer's product already appears is rejected.
- A product with no confirmed integrations returns a configuration reason, not an empty run.
- `integration_ecosystem` is handled by persistence, sequencing, alerts, the five web maps, and the
  regenerated `prospect_tier` type.
- Phase A table has RLS enabled and no public Data API write access.

## Relevant files

- `packages/supabase/database-types.ts` and `supabase/migrations/` (Phase A table + Phase B enum/backfill)
- `apps/web/app/dashboard/` product settings + `apps/web/app/onboarding/` (Phase A UI)
- `apps/server/src/methods/prospect-generation-methods/integration-ecosystem/` (new)
- `apps/server/src/methods/prospect-generation-methods/shared/persist-and-enrich.ts`
- `apps/server/src/methods/prospect-generation-methods/shared/generate-outreach-sequence.ts`
- `apps/server/src/jobs/daily-backlink-discovery.ts`
- `apps/web/lib/opportunity-types.ts`
