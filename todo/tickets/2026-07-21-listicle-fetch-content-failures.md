# Known issue: listicle candidate page fetches fail on bot-protected sites + timeout under load

## Summary

`discoverListicleRoundups` (`apps/server/src/methods/prospect-generation-methods/listicle-roundup/index.ts`) fetches each SERP candidate's page body via `fetchPageContent()` (`listicle-roundup/check-listicle-client.ts`) before scoring it as a real listicle. During the 2026-07-20 19:57 → 2026-07-21 13:07 deploy window (`1ddfa0a9`), the 07:00 UTC daily discovery run (trial users, all products in one batch — commit `d28c04c0`) logged repeated `scraper returned error` (502) and `TimeoutError: The operation was aborted due to timeout` for this call.

Not a crash — failures return `null`, get filtered out of `withContent` (index.ts:156-159), run continues with fewer candidates. Silent yield loss, no alert.

## Root causes (two distinct)

**1. Bot-protected target sites (502).** `apps/scraper/core.py:394` `fetch_page()` escalates light (httpx, 15s) → dynamic (headless) → stealthy (anti-bot bypass). If the stealthy tier still hits a Cloudflare challenge (`is_cf_challenge` check, line 440) or non-2xx, returns `None` → `fetch_content.py:50` raises `HTTPException(502)`. Observed on `clutch.co/web-developers` and `americaneagle.com` — both known Cloudflare/WAF-protected. Domain gets added to `_cf_blocked_domains` (core.py:449) so later attempts on the same host short-circuit faster, but the candidate is still lost for this run.

**2. Client-side timeout under concurrency (TimeoutError).** `check-listicle-client.ts:35` gives the whole tiered fetch a flat 60s `AbortSignal.timeout`. The scraper's light pool is capped at 16 in-flight requests process-wide, shared across every concurrent product run (`apps/server/src/helpers/scraper-limits.ts`). At 07:00 UTC every trial product's daily run fires together, so requests queue for a pool slot — queue wait plus a slow dynamic/stealthy escalation on a single candidate is enough to blow the 60s client budget even though nothing is actually broken server-side.

## Impact

Reduced listicle-roundup discovery yield during high-concurrency cron windows (07:00 UTC daily, worse if 19:00 UTC paid-tier run overlaps). No user-visible error, no alert — just fewer prospects surfaced than a lower-load run would find.

## Recommendation (not yet actioned)

- Bot-protected 502s are expected steady-state noise (Cloudflare won't be beaten reliably) — not worth chasing per-site, but worth confirming `_cf_blocked_domains` is actually skipping repeat attempts within a run rather than re-paying the 3-tier escalation cost per candidate.
- Timeout-under-load is the more fixable one: either raise `check-listicle-client.ts`'s 60s budget for this route specifically, or size `SCRAPER_LIGHT_CONCURRENCY` / stagger the 07:00 batch so queue wait doesn't eat into the client abort window. Needs data on how many candidates are actually lost per run before deciding it's worth the change.
