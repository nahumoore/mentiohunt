# Re-wire the "report a prospect issue" feature, orphaned by the prospects refactor

## Background

Surfaced during the 2026-08-26 dead-code cleanup. The June "opportunities → prospects" rename rewrote `apps/web/app/dashboard/prospects/[slug]/client-page.tsx` to inline the prospect detail UI, but the older `components/link-building/prospects/prospect-actions.tsx` (which rendered a "Report issue" action) was left behind unimported. Everything below it in that chain went with it:

- `components/link-building/prospects/prospect-report-issue-dialog.tsx` — the dialog itself. Fully implemented, still present.
- `app/api/link-building/opportunities/[id]/report-issue/route.ts` — the API route it calls. Fully implemented, still present, writes to the DB.

Both files were kept during the cleanup specifically because they're working, DB-writing code with no dead-code justification for deletion — they were silently orphaned, not deliberately removed. `knip.json` has an explicit `ignoreIssues` entry for both so they don't get flagged and deleted in a future automated pass.

## What's needed

Reconnect the report-issue dialog into `client-page.tsx`'s current prospect-actions UI (whatever replaced the old `OpportunityActions` component). Confirm the route still matches the current prospect data shape before wiring it back in — it hasn't been exercised since the refactor, so double-check the request/response contract against what `client-page.tsx` now has available.
