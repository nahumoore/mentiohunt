# Add self-serve "stop all outreach" and "delete account" controls

## Background

VRP Team (corporate@villarentalpartners.com, `user_id = 4f4c58ad-2b7a-4422-b514-48ae00298836`,
product "Jack Laurier") signed up, finished onboarding, and 5 minutes later messaged support
(`support_conversations.id = e35f5e77-2f8c-468a-8570-21e3d70bb40d`): "How do I stop the emails
from going out I don't want to do this anymore." No self-serve way exists to do either of the
two things they actually wanted — stop the auto-scheduled outreach, or delete the account —
so it had to be handled manually via direct DB writes (3 `prospect_sequences` rows, all still
`pending`, no `outreach_events` yet — caught before anything sent, but only because support
saw the message in time).

This is a predictable outcome of the product's core model (`CLAUDE.md`): outreach sequences
auto-schedule on discovery with no per-prospect approval step, so a new signup can go from
"finished onboarding" to "sequences queued to send" in minutes, with the only stated
customer-facing lever being "monitor and cancel opportunities that aren't a fit" — not a
global kill switch, and not account deletion.

## Next steps

1. **"Stop all outreach" button** (dashboard, account/settings level) — cancels every
   `pending`/in-flight `prospect_sequences` row for the account's product(s) in one action,
   without deleting the account or its data. This is the lower-friction option for someone who
   wants to pause, not necessarily leave.
2. **"Delete account" button** (settings) — self-serve account + data deletion: cancels all
   outreach sequences (same mechanism as #1), stops future discovery runs, and removes/anonymizes
   the account per whatever data-retention policy applies. Needs a confirmation step given it's
   destructive and irreversible.
3. Decide whether either action needs a short delay/undo window (e.g. "sequences paused for
   24h before cancellation is final") given the auto-schedule-on-discovery model means a panicked
   click could be a false alarm.
4. Until shipped, support has to handle both cases manually via direct DB access — worth a
   one-line runbook note (which tables/rows to touch) so it's not re-derived from scratch next time.
