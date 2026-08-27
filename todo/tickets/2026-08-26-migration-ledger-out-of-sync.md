# Migration ledger is out of sync with the live database — a fresh db push or branch will fail

## Background

Surfaced during the 2026-08-26 dead-code cleanup's database audit. `supabase_migrations.schema_migrations` in production records only 3 applied migrations, all from July:

```
20260730151326  add_support_chat
20260728120000  add_profiles_walkthrough_seen_at
20260717150000  add_bounced_prospect_status
```

But all **9** files in `supabase/migrations/` have their effects live in the database (confirmed by inspecting the live schema against each migration file — `products.target_keywords` and its CHECK constraint exist, `discovery_candidates` exists, `profiles.outreach_paused_at` exists, the `notifications` trio exists with corrected grants, etc.). They were applied out-of-band — most likely via the Supabase MCP/dashboard directly against the remote — and the ledger table was never updated to match.

None of the 9 migrations created something that was later abandoned; this isn't a code-cleanup issue, it's purely a deployment-hazard issue.

## Impact

A `supabase db push`, or spinning up a fresh branch/local reset from the migration files, will try to replay all 9 migrations from scratch and fail immediately on the first `create type` / `create table` for an object that already exists.

## What's needed

Reconcile the ledger — most likely `supabase migration repair` (or manually inserting the missing rows into `supabase_migrations.schema_migrations`) for the 6 unrecorded migrations, so the migration history accurately reflects what's actually applied. Do this before anyone next needs to push a migration or spin up a branch.
