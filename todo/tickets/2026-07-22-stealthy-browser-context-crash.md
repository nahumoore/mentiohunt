# Known issue: shared stealthy-tier browser context dies mid-burst, cascades to all concurrent fetches

## Summary

`apps/scraper/core.py:434-457` — the last escalation tier in `fetch_page()` (light → dynamic → stealthy) calls `await _stealthy_session.fetch(url)`; on any exception it logs `stealthy fetch failed {url}: {e}` and returns `None`. During both the 2026-07-21 ~19:03-19:04 UTC and 2026-07-22 ~07:00-07:09 UTC cron discovery windows, this logged in bursts — many concurrent tasks (`check-mention-*`, `agent-scrape-*`, `fetch-content-*`) all failing at the same instant with the identical error:

`BrowserContext.new_page: Target page, context or browser has been closed`

## Root cause

**One shared browser context for the whole process, not per-task.** `apps/scraper/main.py:35-42` creates a single `AsyncStealthySession` once at app startup (`lifespan()`), stored on module-global `core._stealthy_session` (`core.py:87`). Every request from every route calls this same instance's `.fetch()`. Scrapling's `AsyncStealthySession.start()` (`.venv/.../scrapling/engines/_browsers/_stealth.py:352-368`) launches via `playwright.chromium.launch_persistent_context(...)` — one `self.context` for the session's entire lifetime. `_get_page()` (`_base.py:249-273`) calls `ctx.new_page()` against that single shared context for every concurrent caller.

**No concurrency cap protects the shared context itself.** `core.py:109-112` only gates route *entry*: `_heavy_semaphore` (10) and `_light_semaphore` (16) — mirrored client-side in `apps/server/src/helpers/scraper-limits.ts:20-24`. Nothing stops up to 26 concurrent tasks from all independently escalating into the stealthy tier at once. The only internal limiter is Scrapling's own page pool, `_STEALTHY_MAX_PAGES = 3` (`main.py:20`), enforced by a lock+60s wait loop in `_get_page` (`_base.py:252-262`) — it queues callers for a free page slot, it does not protect against the underlying context/browser process dying.

**No app-level or library code explicitly closes the shared context on a single failure** — `_stealth.py`'s fetch exception handling (~lines 284-300) only closes the individual `page`, not `self.context`; nothing closes the persistent context except full session shutdown in `main.py`'s `lifespan` exit. That means the cascading closure isn't a code path we wrote — most likely the single persistent Chromium/Camoufox process backing that one shared context is crashing or getting torn down (OOM or resource exhaustion under the cron-burst concurrency spike, or a container-level restart), which instantly invalidates `ctx.new_page()` for every other task mid-flight, producing simultaneous identical errors across unrelated task names.

## Impact

When it hits, every in-flight stealthy-tier fetch across every concurrent product/strategy fails at once (not one-off — same shape both 7/21 and 7/22 cron windows, likely every 07:00/19:00 UTC burst). Each failure is caught and returns `None` upstream, so it's silent partial data loss (same shape as `listicle-fetch-content-failures.md` and `apify-actor-500-no-retry.md`) — no crash, no alert, just fewer contacts/mentions/candidates surfaced for that run. Since the stealthy tier is the last-resort tier (used specifically for bot-protected/anti-bot-bypass targets), losing it mid-burst likely drops the highest-difficulty, often highest-value targets.

## Recommendation (not yet actioned)

- Confirm the crash mechanism first: check container memory/restart metrics (Railway) for the `scraping` service correlated to 07:00/19:00 UTC windows — if it's OOM, the persistent Camoufox/Chromium process under `_STEALTHY_MAX_PAGES = 3` pages plus 26-way queuing pressure is a plausible memory spike culprit.
- If confirmed, add a supervisor around `_stealthy_session`: detect a dead/closed context (e.g. catch the `new_page` "closed" exception once, then `restart()` the session) rather than letting every queued caller hit the same dead context independently.
- Consider whether the stealthy tier needs its own semaphore (like the light/heavy tiers) sized to what the single shared browser context can actually survive under concurrent load, separate from `_STEALTHY_MAX_PAGES`'s page-pool queuing.
- Same recurring theme as `apify-actor-500-no-retry.md` and `llm-shared-model-concurrency.md`: shared process-wide resources with no cap tuned to actual capacity, hit hardest at cron-burst concurrency peaks. Worth treating as one class of problem across all three rather than three separate fixes.
