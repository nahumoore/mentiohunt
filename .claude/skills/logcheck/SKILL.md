---
name: logcheck
description: Investigate Railway, Supabase, and Vercel for recent production errors on Mentiohunt and present a triaged summary. Use this whenever the user asks "any errors today/yesterday", "check railway/supabase/vercel logs", "did we have any incidents", "is anything broken in prod", wants a health check on the server/scraping services, the database, or the web app, or is starting a session and wants to know if anything needs attention before digging into other work. Also trigger for vaguer prompts like "how's prod looking" or "anything on fire" — this is the right first move whenever the user wants to know if something needs a ticket filed. Does not create tickets itself — it reports findings and asks the user which ones to turn into tickets.
---

# logcheck

Pull recent errors from Railway (application logs), Supabase (infrastructure logs), and Vercel (web app runtime errors), cross-reference them against `todo/tickets/` so known issues aren't re-reported as new, and hand the user a triaged summary they can act on.

## Why Railway, Supabase, and Vercel

They cover different layers and neither substitutes for the others:

- **Railway** = application-level. Our own logger output (`apps/server/src/helpers/logger.ts`), stdout/stderr from the `server` and `scraping` services — business-logic errors like LLM fallback chains, third-party API failures, scraper timeouts. Anything our code catches and logs.
- **Supabase** = infrastructure-level. PostgREST/GoTrue request status codes, the raw Postgres engine log (checkpoints, replication, connection issues), Auth/Storage/Realtime internals. RLS denials, connection pool exhaustion, slow queries, replication lag — these never touch Railway unless our app code happens to catch and log them, which most DB-level failures don't.
- **Vercel** = `apps/web` runtime, server-side only. Serverless/edge function errors, middleware, SSR/`generateMetadata` throws — anything under `apps/web/app/**` including `apps/web/app/api/*` routes. This is the only source that sees Next.js-specific failures (e.g. a route handler throwing, middleware session refresh errors, an MDX loader ENOENT during SSR).

**Vercel does not cover client-side errors.** Browser-side exceptions (React render crashes, failed `fetch` calls inside `'use client'` components) never reach Vercel's runtime logs — there's no Sentry or similar wired into `apps/web`. If the user asks about client-side issues specifically, say so explicitly rather than reporting Vercel silence as "no errors" — it's a blind spot, not a clean bill of health, unless client-side error tracking gets added.

Skipping any of the three leaves a blind spot. Note Supabase's `get_logs` only returns the last 24h with no date-range param — if the user wants a longer look-back, say so rather than silently under-reporting. Vercel's `get_runtime_errors` caps at a 7-day lookback (`since`); `get_runtime_logs` retention depends on plan (Hobby 1h, Pro 1 day, Enterprise 3 days) — prefer `get_runtime_errors` for "what's broken" since it's pre-aggregated and won't time out or fall outside retention.

## Steps

**1. Read `todo/tickets/*.md` first.** This is the whole point of the cross-reference — without it, every run re-discovers the same known issues (OpenRouter fallback congestion, scraper 502s, DataForSEO domain validation, etc.) as if they were new. Skim each ticket's summary/root-cause so you can match new log lines against them.

**2. Pull Railway logs.**
- `mcp__railway__list-projects` → find the mentiohunt project (don't hardcode the ID, it can change).
- `mcp__railway__list-services` on that project → get the `server` and `scraping` service IDs.
- `mcp__railway__get-status` → resolve the latest deploymentId per service (needed because `get-logs` with serviceId+environmentId alone can resolve to a stale/skipped deployment).
- `mcp__railway__get-logs` per deploymentId, `filter: "error"`, generous `limit` (200+), `startDate` covering the window the user cares about (default: last 24-48h, or since their last check if they mention one).

**3. Pull Supabase logs.**
- `mcp__supabase__get_logs` for `service: "api"` and `service: "postgres"` (last 24h only, no override).
- `mcp__supabase__get_advisors` for both `security` and `performance` — these catch config drift (missing RLS policies, mutable search_path, etc.) that won't show up as a log line but matters for the same reason a ticket-worthy issue does.

**4. Pull Vercel errors.**
- `mcp__vercel__list_teams` → resolve the team ID (don't hardcode, it can change).
- `mcp__vercel__list_projects` with that teamId → find the `mentiohunt` project ID.
- `mcp__vercel__get_runtime_errors` with that projectId/teamId, `since` covering the window the user cares about (default 24h, max 7d) — this is pre-aggregated by error group (name, count, routes, first/last seen), so start here rather than raw logs.
- Only fall back to `mcp__vercel__get_runtime_logs` (filtered by `level: ["error","fatal"]`, `environment: "production"`) if you need line-level detail `get_runtime_errors` doesn't show — remember its retention window is much shorter (see above).
- Note which routes are hit: `/api/*` under `apps/web/app/api/` counts as our own route-handler code, same bar as Railway app-level errors. `/middleware`, SSR routes, and `generateMetadata` failures are still ours but framework-level. Remind the user client-side (browser) errors are out of scope here regardless of what Vercel returns.

**5. Triage each distinct error pattern**, not each log line — group repeats. For each one, work out:
- **Self-recovered or not?** Did a retry/fallback catch it (e.g. openrouter fallback model succeeded right after a primary failure), or did the operation actually fail with no recovery? This matters more than the raw error count — a pattern that always self-heals is a different priority than one that silently drops data every time.
- **Our fault or external?** Third-party outage / bot-protected site / provider hiccup vs. our own code or infra (missing validation, no concurrency cap, timeout budget too tight, shared resource with no supervisor). Trace it back far enough to tell — "the API returned an error" isn't an answer, "the API rejected input we should have validated before sending" is.
- **Matches an existing ticket, or new?** If it matches, say which ticket and whether the ticket's fix already shipped (some tickets have a "Status: Completed" line — check for that) versus still open.
- **Rough severity.** Weigh recovery + fault + how often it fires. A self-healing, external-fault issue that's already ticketed is low priority to mention twice; a non-recovering, our-fault issue with no ticket is the one to flag hardest.

Don't stop at symptom-level description ("X threw an error") — if the cause isn't obvious from the log line alone, spawn a subagent to trace the actual code path (see `references/ticket-format.md` for how deep prior tickets went — e.g. tracing a malformed-domain error all the way back to an unvalidated LLM-hallucination step in onboarding, not just "DataForSEO rejected the input"). A summary that only restates the log line isn't worth more than reading the log line.

**6. Present the summary**, grouped by service (Railway `server`, Railway `scraping`, Supabase `api`/`postgres`, advisories, Vercel `apps/web`). For each finding note: what happened, self-recovered or not, our-fault vs external, rough severity, and ticket match status (existing ticket name, or "new"). If the user's ask touched client-side behavior, note explicitly that Vercel/logcheck has no client-side error visibility rather than staying silent on it. Close by asking which of the new findings the user wants turned into tickets — do not create tickets unless asked.

## Writing a ticket (only when the user asks)

Read `references/ticket-format.md` for the exact structure and an example. The short version: match the tone and depth of the existing tickets in `todo/tickets/` — trace root cause to actual file:line, don't stop at the symptom, always re-read the existing tickets first so a new one doesn't duplicate what's already there, and prefix the filename with today's date (`YYYY-MM-DD-slug.md`) so tickets sort by creation order.
