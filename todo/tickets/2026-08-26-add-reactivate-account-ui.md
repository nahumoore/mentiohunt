# No UI path to un-deactivate an account

## Background

Surfaced during the 2026-08-26 dead-code cleanup. `apps/web/actions/account-actions.ts` exports `deactivateAccount` (wired to `components/dashboard/settings/account-tab.tsx`) and `reactivateAccount` (its reverse — clears `deactivated_at` so discovery resumes, then resumes paused sequences on a staggered schedule). `deactivateAccount`'s own doc comment says "this is reversible via reactivateAccount," but nothing in the UI calls it. There is currently no way for a user (or support) to undo a deactivation short of manual DB intervention.

`reactivateAccount` was kept — not deleted as dead code — and tagged `@internal` in `knip.json`'s tag config so it doesn't get flagged and deleted in a future automated pass.

## What's needed

Add a UI path for this — most likely a "Reactivate" action in `account-tab.tsx` shown when `profile.deactivated_at` is set, mirroring how `deactivateAccount` is currently wired. Worth checking with support/product on whether this should be self-serve or support-assisted, since account deactivation intersects with billing state.
