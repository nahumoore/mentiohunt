# route_execution_logs design problems: unbounded route_name, error path never fires

## Background

Surfaced during the 2026-08-26 dead-code cleanup's database audit, while looking at `apps/server/src/helpers/logger.ts:159` (the table's only writer).

- **`route_name` has unbounded cardinality.** Real production values include `crawl-page-058e3091-c759-469e-a20f-32f29fdb97fc` and `analyze-backlink-site-dealbyethan.com` — the entity ID or domain is baked directly into what's meant to be a route identifier. This makes `GROUP BY route_name` useless for the debugging this table exists to support; every row is effectively its own group.
- **The error path has never persisted a row.** All 127 rows in production are `status='success'`. For a table whose whole purpose is post-hoc debugging, that's backwards — the failures are exactly what you'd want logged, and they aren't landing.

See the companion ticket on retention for this same table (`2026-08-26-outreach-events-route-logs-retention.md`) — worth bundling this fix into the same pass since both touch `helpers/logger.ts`.

## What's needed

1. Separate the stable route identifier from the per-request entity (log the entity ID/domain as a field inside `metadata`, not appended to `route_name`).
2. Investigate why `status='success'` is the only value ever written — check whether error-path logging calls a different function that doesn't reach this table, or whether an exception before the log call is swallowing the write entirely.
