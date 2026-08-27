# Remove 48 `.from("table" as string)` casts that silently disable type checking

## Background

Surfaced during the 2026-08-26 dead-code cleanup's database audit. 48 call sites across 14 files still write `.from("table_name" as string)` instead of `.from("table_name")`, a pattern that made sense back when `packages/supabase/database-types.ts` was stale and missing these tables. It's no longer stale — `database-types.ts` now covers all four affected tables — so every one of these casts is now pure liability: it silently disables Supabase's generated type checking on that query (column names, filter shapes, response types all go unchecked) for no remaining benefit.

Affected tables and approximate site counts: `backlink_prospect_runs` (26), `tracked_links` (13), `discovery_candidates` (6), `tracked_link_events` (3).

Representative files:
- `apps/server/src/jobs/daily-backlink-discovery.ts`
- `apps/server/src/jobs/daily-link-tracker.ts`
- `apps/server/src/jobs/link-tracker-digest.ts`
- `apps/server/src/methods/link-tracker/check-tracked-link.ts`
- `apps/server/src/methods/prospect-generation-methods/*/prospect-run-tracking.ts` (five near-identical copies, one per strategy)
- `apps/server/src/methods/prospect-generation-methods/shared/discovery-candidate-backlog.ts`
- `apps/web/app/api/link-tracker/route.ts`, `apps/web/app/api/link-tracker/bulk/route.ts`
- `apps/web/app/dashboard/layout.tsx`

## What's needed

Mechanical fix: drop ` as string` from each `.from(...)` call and let `tsc --noEmit` catch any place where the now-enforced types reveal a real mismatch (there may be a few — that's the point). Verify with `pnpm typecheck` after.
