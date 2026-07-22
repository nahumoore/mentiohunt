# Known issue: Apify actor 500s under cron burst, no retry

## Summary

`runApifyActor` (`apps/server/src/helpers/actors/run-apify-actor.ts`) is a single-shot fetch with zero retry — any non-2xx (including transient 5xx) throws straight through. It backs the shared Google SERP actor (`scraperlink~google-search-results-serp-scraper`, `SCRAPERLINK_GOOGLE_SERP`) plus email verification, used by 8+ call sites: listicle-roundup, resource-page-inclusion, unlinked-mention, competitor-backlink (`enrich-contact.ts` SERP + verifier), google-index/check-index, guest-post-sites, directories/serp-check.

During the 07:00 UTC daily discovery run (2026-07-20/21, deploy `1ddfa0a9`), logged `Error: Apify 500: Internal Server Error` 30s after cron fire.

## Root cause

`daily-backlink-discovery.ts:19` runs `PRODUCT_CONCURRENCY = 5` products in parallel. Each strategy fires its own internal burst — e.g. listicle-roundup's SERP step (`listicle-roundup/index.ts:73-88`) uses `pLimit(3)` across up to 6 queries. Worst case: 5 products × 3 concurrent queries = up to 15 simultaneous calls to the same Apify actor right at cron start. The 500 is consistent with the actor's own capacity being overwhelmed by that burst — not a permanent failure, a transient provider hiccup under load.

## Impact

Caller-side handling degrades gracefully, not a crash: in listicle-roundup the SERP loop catches per-query (`index.ts:83`, `log.warn` + return `[]`), so one query's results are dropped and the run continues. Same shape everywhere else `runApifyActor` is used — silent partial data loss, no alert, no retry. Same failure pattern documented in `listicle-fetch-content-failures.md` (scraper timeouts) and the LLM fallback cascade — this codebase has no retry-with-backoff convention for third-party provider calls outside `withLlmRetries` (LLM-only).

## Recommendation (not yet actioned)

Add retry-with-backoff to `runApifyActor` itself (single shared fix point, benefits all 8+ call sites for free) — mirror `withLlmRetries`'s shape (`apps/server/src/helpers/llm-retry.ts`, `[3_000, 10_000, 30_000]` backoff) rather than inventing a second retry helper. Only retry on 5xx / network errors, not 4xx (bad input, e.g. malformed `limit` param — retrying won't fix that).

Secondary: consider whether `PRODUCT_CONCURRENCY = 5` × internal `pLimit(3)` bursts should be capped process-wide (same pattern as `scraper-limits.ts`'s shared `scraperLightLimit`/`scraperHeavyLimit`) so cron-start bursts don't stack unbounded against a single third-party actor's capacity.
