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

---

## Investigation + work log (2026-07-22)

### Two of this ticket's assumptions were wrong

1. **The `_cf_blocked_domains` short-circuit did not exist.** The ticket (root cause #1 / recommendation) assumed a CF-blocked host would "short-circuit faster" on later attempts. It didn't: `_cf_blocked_domains` was only ever *written* (`core.py:449`) and exposed to the agent-scrape helper dict — never *read* inside `fetch_page`. Every sibling URL on a blocked host re-paid the full light→dynamic→stealthy escalation. This was the real driver of the wasted cost and a big contributor to the `TimeoutError`s, not the cause the ticket named.
2. **"Queue wait burns the abort budget" (root cause #2) was already mitigated before the incident.** `scraper-limits.ts` (committed `43addda`, 2026-07-14 — six days before the 07-20 window) creates the 60s `AbortSignal.timeout` *inside* the `scraperLightLimit` callback, so the clock only starts once a client slot is held, and the client/server light caps are matched (16/16). Residual `TimeoutError`s are a single fetch's own escalation exceeding 60s, made far worse by #1.

### Changes shipped

**A. `_cf_blocked_domains` short-circuit (`apps/scraper/core.py`).** `fetch_page` now checks the normalized host against `_cf_blocked_domains` before running any tier and returns `None` immediately if already blocked this process. Stops re-paying max-effort escalation on hosts that already lost the stealthy tier. Pure win, no tradeoff.

**B. Per-tier + per-run instrumentation.** Scraper emits one `fetch_outcome=<tag>` line per terminal exit (`ok_light`/`ok_dynamic`/`ok_stealthy_*`/`terminal_*`/`cf_blocked`/`cf_skipped`/`non2xx_stealthy`/`error_stealthy`/`proxy_infra_failure`). Node side: `fetchPageContent` takes an optional `onOutcome` callback (`ok`/`http_error`/`timeout`/`error`) — critically captures client-side timeouts the scraper never sees — and the listicle run aggregates them into the `"content fetched"` log's `outcomes` field. This answers the ticket's open "needs data on how many candidates are lost per run" directly.

**C. Residential proxy on the stealthy tier, with smart fallback (`core.py`, `main.py`, `.env`).** Optional `STEALTHY_PROXY` env (`host:port:user:pass`) routes ONLY the stealthy/Cloudflare tier through a residential IP — the IP-reputation lever, since the datacenter IP is what loses on strict WAFs. Fallback is infra-failure-only: on a fast proxy error (unreachable/407/conn-refused) it falls back to a direct attempt and trips a ~5-min circuit breaker; a timeout or genuine CF block does NOT double-attempt (keeps worst-case ≈ one attempt, so the 60s light-pool abort holds). Unset env = byte-identical to prior behavior. Applied at the single `fetch_page` chokepoint, so all four routes (`/fetch-content`, `/byline-scrape`, `/agent-scrape`, `/check-mention`) benefit.

### Caveats / follow-ups

- **Runtime-unverified.** Only syntax-checked (`py_compile`) + `pnpm --filter server typecheck`. The local `.venv` is a stale Scrapling **0.2.9** (no session classes) while `requirements.txt` pins `>=0.4.8` — so the 0.4.x code can't run locally without upgrading the venv or a Docker build. Per-request `proxy=` override on `AsyncStealthySession.fetch()` is relied on from the library docs, not verified against the installed 0.4.x; contingency is two sessions (proxied + direct).
- **Must set `STEALTHY_PROXY` in Railway** — the `.env` edit is local only; prod reads Railway env vars.
- **Deferred (revisit only if post-deploy data warrants):** client/stealthy timeout realignment and `real_chrome` (the "try harder" levers), proxy rotation, `dns_over_https`/`geoip`. Trigger to revisit = `timeout` outcomes rising after the proxy adds latency near the 60s abort.
