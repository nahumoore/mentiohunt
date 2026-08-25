# Known issue: scraper concurrency-pool slots leak on a hung request and never recover, silently killing all scraping capability

## Summary

The `scraping` Railway service (deployment `1b71a436-ab66-4c43-95fd-33869a69dff9`,
running since 2026-08-20, commit `c078ac3` "drop abandoned scraper jobs and cap
queue depth per pool") was found completely wedged on 2026-08-25: both the
`heavy` pool (`/agent-scrape`, `/check-mention`) and `light` pool
(`/fetch-content`, `/byline-scrape`, `/check-link`, `/check-listicle`) were
pinned at `active == capacity` **and** `waiting == max_queue` simultaneously
(`GET /health` — `apps/scraper/routes/health.py` —
`{"heavy":{"active":10,"waiting":40,"capacity":10,"rejected":331},"light":{"active":16,"waiting":60,"capacity":16,"rejected":323}}`),
with zero change across two checks 90 seconds apart, including the `rejected`
counter not moving.

Railway's own `http-error-rate`/`http-requests` metrics for the `scraping`
service confirm this wasn't a one-off blip: **98.3% of all 292 requests over
the prior 8 hours returned 5xx**, starting at 2026-08-25 07:00 UTC (169/169
failed) and continuing through 11:40 UTC, after which real traffic dropped to
**zero** until the health check at 14:50 UTC — i.e. every discovery/enrichment
job that tried to use the scraper that morning failed, and callers had
stopped trying entirely for 3+ hours by the time this was noticed. CPU usage
over the same 8h window stayed flat at ~0.1–0.4% (idle), not the pattern of
genuine load — a signature of stuck connections, not heavy traffic.

Despite this, Railway's dashboard showed the service as "live" the whole
time — its liveness check only hits `/health`, which returns 200 regardless
of pool state (it just reads `pool_stats()`, never exercises a pool), so the
platform-level health check cannot detect this failure mode.

**Immediate mitigation applied 2026-08-25**: restarted the running container
via Railway's agent (`restartServiceTool`, deployment `1b71a436-...`, no
rebuild/code change) — confirmed pools reset to
`active:0, waiting:0, rejected:0` afterward. This clears the symptom but not
the underlying cause below, which can recur.

## Root cause

`_scrape_slot` (`apps/scraper/core.py:321-361`) only checks whether the
caller has disconnected **once, right before work starts**
(`if request is not None and await request.is_disconnected(): raise
CallerGone`, line 354) — there is no check, and no timeout, for the entire
duration a request actually runs after that point. The `finally` block that
releases the semaphore (`stats["active"] -= 1; semaphore.release()`, lines
359-361) only fires when the wrapped coroutine actually returns or raises.

Node's own client-side abort budgets (`AbortSignal.timeout` — 180s for
`check-mention-client.ts:42`, 120s for `enrich-contact.ts:66`, 60s for
`check-listicle-client.ts:51`/`check-link-client.ts:68`) only tear down the
HTTP connection on the Node side. They do not, and cannot, cancel the
in-flight coroutine on the Python side — Python has no equivalent
server-side deadline once a request has been dequeued and started. If any
single request hangs below the layer of the tool-level timeouts that do
exist (60s Playwright navigation timeout in `main.py:33,66`,
`MODEL_CALL_TIMEOUT_SECONDS = 30` in `agent_enrich.py:22` for the LLM calls
inside `/agent-scrape`) — e.g. stuck in the underlying network stack, a lock,
or some other blocking path not covered by those timeouts — its slot in
`_heavy_semaphore`/`_light_semaphore` is held forever. There is nothing in
the codebase that ever forcibly reclaims a slot from a coroutine that is
simply taking too long.

This is a **slow leak, not a burst failure**: each stuck request permanently
removes one unit from a fixed pool (10 heavy / 16 light). Given enough
volume over enough time (5 days between the last deploy on 2026-08-20 and
this being caught on 2026-08-25), the pools drain to zero regardless of how
gentle the request rate is — a genuinely low-traffic period doesn't protect
against this, it only slows how long it takes to fully exhaust.

Two separate cron schedules compound the exposure window rather than causing
it: `apps/server/src/jobs/index.ts` fires `runDailyBacklinkDiscovery()` at
`0 7 * * *`, `runProspectOutreachSender()` at `*/5 * * * *`, and
`runProspectOutreachMonitor()` at `2-59/5 * * * *` — all three land in the
same one-to-two-minute window every day at :00–:02. That's not what caused
the leak, but it does mean whatever volume of requests eventually gets stuck
each day arrives in a concentrated burst rather than spread out, which is
part of why the pool exhausted itself within one to a few days rather than
gradually over weeks.

Node-side concurrency gating itself is not at fault: every real caller in
`apps/server` (`check-mention-client.ts`, `check-listicle-client.ts`,
`check-link-client.ts`, `enrich-contact.ts`, `scraper-content-client.ts`,
`prospect-submitted-url.ts`) correctly funnels through the shared
`scraperHeavyLimit`(10)/`scraperLightLimit`(16) in
`apps/server/src/helpers/scraper-limits.ts`, which mirror the scraper's own
`SCRAPE_HEAVY_CONCURRENCY`/`SCRAPE_LIGHT_CONCURRENCY` defaults (confirmed
both unset on Railway for both services, so both sides run the stock 10/16 —
no config drift). The one exception is
`apps/server/src/routes/dev-test-scraper.ts:14`, a manual debug route that
calls `/agent-scrape` directly without going through `scraperHeavyLimit` —
low-volume/manual, not implicated in this incident, but worth closing for
consistency.

## Impact

Total, silent loss of scraping capability for the affected window — every
unlinked-mention check, listicle check, broken-link check, contact
enrichment, and product-page crawl that ran during 2026-08-25 07:00–11:40 UTC
failed and was dropped with no retry (see
`2026-08-25-scraper-queue-saturated-drops-opportunities-silently.md` if filed
separately for the caller-side "return null, no retry" behavior — that
ticket describes the symptom; this one is the mechanism that caused the pool
to be unavailable at all). Nothing paged anyone; this was only caught by a
manual production log review, by which point the service had already been
non-functional for ~8 hours and quiet (no one even trying) for 3 of them.

This is very likely a recurring pattern, not a one-off: the deployment had
been running 5 days since its last rebuild, and nothing in the code
prevents the exact same slow leak from happening again on the current (now
restarted) instance, or on any future deploy, given enough time and volume.

## Recommendation (not yet actioned)

1. **Add a server-side hard deadline per slot** — the actual fix. Wrap the
   work done inside each `_scrape_slot` context (or the tiered fetch it
   guards) in `asyncio.wait_for(..., timeout=...)` set to slightly exceed the
   longest Node-side abort budget (180s for check-mention is the ceiling
   today), so a request that hangs below the existing tool-level timeouts
   gets forcibly cancelled and its semaphore slot released via the existing
   `finally` block, instead of leaking permanently. This directly addresses
   the mechanism above; everything else here is mitigation around it.
2. **Alert on pool exhaustion instead of discovering it by chance** — nothing
   currently distinguishes "briefly busy" from "wedged for hours." Add a
   scheduled check (even a simple periodic hit to `/health`, since
   `pool_stats()` already exposes `active`/`waiting`/`capacity` per pool)
   that pages/alerts when a pool sits at `active == capacity && waiting ==
   max_queue` for longer than some threshold (e.g. 5+ minutes) — this would
   have caught the 2026-08-25 incident within minutes of it starting instead
   of ~8 hours later. Railway's own liveness check cannot substitute for
   this, since `/health` returns 200 regardless of pool state by design (it's
   meant as a liveness probe, not a capability probe).
3. **Stagger the overlapping cron schedules** in
   `apps/server/src/jobs/index.ts` (daily discovery at `0 7 * * *`, outreach
   sender at `*/5 * * * *`, outreach monitor at `2-59/5 * * * *` all fire
   within the same :00–:02 window) so that whatever volume triggers a future
   leak arrives spread out rather than concentrated — this is defense in
   depth that slows how fast a leak (if #1 isn't shipped, or in case some
   other unforeseen leak path exists) can exhaust the pool. Not a
   substitute for #1: spreading load only delays exhaustion, it doesn't
   prevent it, since even a low, steady arrival rate will eventually drain a
   pool that never gives slots back.
4. **Close the `dev-test-scraper.ts` gap** — route it through
   `scraperHeavyLimit` like every other caller, for consistency, even though
   it wasn't the cause here.
5. Confirm after #1 ships by leaving the service running for several days
   under normal load and re-checking `/health` — the pools should show
   `active`/`waiting` fluctuating with real traffic but never getting stuck
   at a fixed non-zero value for extended periods with `rejected` frozen.
