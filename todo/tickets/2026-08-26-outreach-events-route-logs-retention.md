# No retention policy on outreach_events (24 MB) or route_execution_logs (5.5 MB)

## Background

Surfaced during the 2026-08-26 dead-code cleanup's database audit. Neither table has a pruning job or, in `route_execution_logs`' case, an in-app reader at all.

**`outreach_events`** — 22,180 rows, 24 MB, the largest table in the database. Written from `apps/server/src/jobs/prospect-outreach-sender.ts`, `prospect-outreach-monitor.ts`, `helpers/outreach/enrich-contact-from-reply.ts`, and inside the `stop_prospect_outreach()` RPC. Nothing in the app ever `.select()`s it — the 1,162 index scans `pg_stat` shows are ad-hoc analytics, not application reads. It backs the published link-building statistics content and bounce-rate investigations (see `2026-08-03-high-bounce-rate-unverified-emails-marked-ready.md`), so **any retention policy here needs a real cutoff decision, not a blanket delete** — truncating it would remove the audit trail those numbers are drawn from.

**`route_execution_logs`** — 127 rows, 5.5 MB (~44 kB/row from fat JSON blobs in `entries`/`request`/`metadata`). Single writer: `apps/server/src/helpers/logger.ts:159`. Nothing reads it back in-app at all — it exists purely for manual production debugging (direct SQL queries), which is a legitimate use, but 44 kB/row with no pruning means it grows without bound.

## What's needed

1. Decide a retention window for each table (e.g. rolling 90/180 days) and add a pruning job — `apps/server/src/jobs/` already has the cron infrastructure (`node-cron`, see `jobs/index.ts`).
2. For `outreach_events` specifically, confirm with whoever owns the published statistics content what history window they actually need before picking a cutoff.
3. See the companion ticket on `route_execution_logs`' design problems (unbounded `route_name` cardinality, error path never persisting) — worth fixing alongside any retention work since it touches the same table.
