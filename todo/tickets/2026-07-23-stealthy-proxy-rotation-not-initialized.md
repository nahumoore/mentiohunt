# Known issue: stealthy-tier proxy fetches always fail — session never started in proxy-rotation mode

## Summary

`apps/scraper/core.py:562-570` (`fetch_page`'s stealthy tier) calls `_stealthy_attempt(url, host, proxy=_STEALTHY_PROXY)` whenever `STEALTHY_PROXY` is configured and not in cooldown. Every one of these calls fails with:

`ERROR [<task>] stealthy fetch failed (proxy) <url>: Browser not initialized for proxy rotation mode`

Observed across both the 2026-07-22 19:00 UTC and 2026-07-23 07:00 UTC cron windows — 70 occurrences in the 07:00 window alone, spread across `check-mention-*`, `fetch-content-*`, and `agent-scrape-*` tasks. Traffic-mix sample from the 07:00 window (501 `fetch_outcome=` lines, 06:55-07:10 UTC): 386 `ok_light`, 15 `ok_dynamic`, 48 `terminal_light`, and 52 `error_stealthy` — zero `ok_stealthy_*` in the sample. Every attempt that escalates to the stealthy tier under proxy currently fails.

## Root cause

`apps/scraper/main.py:35-44` constructs `AsyncStealthySession(...)` without `proxy_rotator=True`. Scrapling's `start()` (`.venv/.../scrapling/engines/_browsers/_stealth.py:76-93`) only sets `self.browser` when the session was configured for proxy rotation (or given a `cdp_url`) — otherwise it uses `launch_persistent_context`, which sets only `self.context` and leaves `self.browser = None` for the session's entire lifetime.

`core.py:467` passes a non-empty `proxy=` on every stealthy call whenever `STEALTHY_PROXY` is set. Passing `proxy` forces scrapling into its "rotation mode" branch (`_base.py:379-382`), which requires `self.browser` to spin up a fresh per-request context. Since `self.browser` is always `None` for this session, the call raises every time — a session-wiring mismatch between how `main.py` starts the session and what `core.py` assumes it supports, not a race or a load-dependent failure.

Compounding it: `_stealthy_attempt`'s exception handler (`core.py:493-501`) only escalates to a direct retry when the error matches `_PROXY_INFRA_SIGNATURES` (`core.py:130-138`) — e.g. proxy-unreachable strings, 407 auth failures. `"Browser not initialized for proxy rotation mode"` doesn't match any of those signatures, so it falls to the generic branch (`core.py:499-501`), logs, and returns `None` directly. The direct-retry fallback at `core.py:568` (meant to rescue exactly this kind of failure) never fires for this bug — it's a permanent dead end, not a recoverable one.

This is a distinct bug from `2026-07-22-stealthy-browser-context-crash.md` — that ticket covers the shared *no-proxy* persistent context (`self.context`) dying mid-burst under concurrency load (`BrowserContext.new_page: ... has been closed`, non-deterministic). This bug is on the proxy-specific code path (`self.browser`), fires deterministically on every proxied call, and has nothing to do with concurrency.

## Impact

Not system-wide — most scraping is unaffected. From the 07:00 UTC sample: ~80% of fetch attempts succeed at the light/dynamic tiers before ever reaching stealthy. The bug only bites the subset that needs the last-resort anti-bot tier (Cloudflare/bot-protected sites) *and* only when `STEALTHY_PROXY` is configured (confirmed set in prod) — but for that subset, it's a 100% loss, not a partial one, since the direct-retry rescue never triggers.

Downstream severity differs by discovery strategy:
- **unlinked-mention** (`apps/server/.../unlinked-mention/index.ts:164`, `checked.filter((c) => c.result?.qualified)`): `checkMention` returning `null` on this failure means the candidate is filtered out entirely — the opportunity is never created, not just missing contact info.
- **competitor-backlink** (`enrich-contact.ts`, agent-scrape path): the prospect row is bare-inserted before contact enrichment runs (`index.ts:273`), so the opportunity still gets created — it just arrives with no contact info when stealthy-tier enrichment was needed to find one.

Per the existing stealthy-crash ticket, this tier is specifically the hardest-difficulty, often highest-value bucket — so the loss, while a minority of total volume, is concentrated exactly where fixing it matters most. Silent, no alert, no crash — same shape as the other scraper tickets.

## Recommendation (not yet actioned)

- Preferred: start `AsyncStealthySession` with `proxy_rotator=True` in `main.py:35-44` so `self.browser` actually gets set, making the per-request `proxy=` path in `core.py:467` valid.
- Alternative if proxy rotation isn't actually needed per-request: stop passing `proxy=` in `core.py:467` and instead configure the proxy once at session-start time (whatever shape scrapling expects for a static, non-rotating proxy) — cheaper fix if request-level rotation isn't a real requirement.
- Either way, add `"Browser not initialized"` (or match on `TypeError`/session-state errors generally) to `_PROXY_INFRA_SIGNATURES` (`core.py:130-138`) as a safety net, so a future session-wiring mismatch like this one degrades to the direct-retry fallback instead of a silent 100% dead end.
