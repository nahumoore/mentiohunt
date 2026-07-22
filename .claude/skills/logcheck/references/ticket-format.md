# Ticket format

Every file in `todo/tickets/` follows the same shape. Match it — don't invent a new structure.

**Filename:** `YYYY-MM-DD-<kebab-case-slug>.md` — date prefix is the ticket's creation date (today, unless the user says otherwise), so files sort chronologically in the folder. Slug describes the specific bug, not the symptom. `2026-07-22-stealthy-browser-context-crash.md`, not `2026-07-22-scraper-errors.md`.

**Structure:**

```markdown
# Known issue: <one-line description of the actual defect>

## Summary

What happens, where in the code, when it was observed (dates, deploy IDs if known),
and the exact error text/log line that surfaced it.

## Root cause

Trace it to the real mechanism, not the symptom. Cite exact file:line. If there are
two distinct contributing causes, call both out separately. This is the section that
takes the most digging — "the API returned 500" is not a root cause, "our code fires
N concurrent requests against a rate-limited endpoint with no shared concurrency cap"
is.

## Impact

What actually breaks for the user/business as a result — silent data loss, wasted
API spend, wrong numbers, no impact (self-healing), etc. Say whether it's a
one-off or a recurring pattern (same shape across multiple incidents = recurring).

## Recommendation (not yet actioned)

Concrete options, not vague hints — but flag any that need more data before deciding
so nobody stalls out designing a fix for a hypothesis that isn't confirmed yet. Note
if a similar recurring problem is already known and documented elsewhere.
```

Some tickets add a `**Status: Completed (<date>)**` line right under the title once a fix has shipped — check for that before treating an older ticket as still-open.

## Example (condensed from `2026-07-22-stealthy-browser-context-crash.md`)

```markdown
# Known issue: shared stealthy-tier browser context dies mid-burst, cascades to all concurrent fetches

## Summary

`apps/scraper/core.py:434-457` — the last escalation tier in `fetch_page()` calls
`_stealthy_session.fetch(url)`; on exception logs `stealthy fetch failed {url}: {e}`.
Observed in bursts during two separate cron windows — many concurrent tasks failing
at once with the identical `BrowserContext.new_page: ... has been closed` error.

## Root cause

One shared browser context for the whole process, not per-task
(`apps/scraper/main.py:35-42`, `core.py:87`) — every concurrent caller shares a single
Playwright context. No semaphore protects the context itself, only a page-pool queue
(`_STEALTHY_MAX_PAGES = 3`). Most likely mechanism: the underlying browser process
crashes under concurrency pressure, instantly invalidating the shared context for
every other in-flight task.

## Impact

Every in-flight stealthy fetch fails at once when it hits — silent partial data loss,
same shape both observed incidents, likely recurring every cron burst.

## Recommendation (not yet actioned)

Confirm via container memory/restart metrics first. If OOM-confirmed, add a
supervisor that detects a dead context and restarts the session rather than letting
every queued caller hit the same dead context independently.
```

This is what "traced to root cause" looks like in practice — it names the actual shared-resource shape and the actual failure mechanism, not just "sometimes the browser errors out."
