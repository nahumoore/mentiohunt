# Improve onboarding: first-login guidance + visible progress during the silent wait

## Summary

User feedback (Maciej Robakiewicz, 2026-07-27):

> Hi,
> I know I wasn't active after registration. It was the effect of being very busy in
> different projects. I wanted to try but I have to confess I didn't know how to
> navigate your platform. I know it's not very complicated, but I always had something
> urgent to do and I didn't take the time to fully understand how the platform worked.
> And the week has passed. It wasn't your fault. If I were to recommend anything, it
> would be to include a short instruction on how to use the platform when logging in
> for the first time.
> Maciej Robakiewicz

## Current flow (confirmed by code inspection)

Signup → `/onboarding` 6-step wizard (`apps/web/app/onboarding/page.tsx`,
`apps/web/components/onboarding/onboarding-wizard.tsx`) → server-side discovery jobs
run in background (`apps/server/src/processes/onboarding/run-onboarding-jobs.ts`) →
redirect to `/dashboard/prospects` → outreach sequences auto-scheduled on discovery.
Once opportunities are found and outreach sent, there's genuinely nothing for the user
to do on the dashboard until a prospect replies — which can take days.

Gaps found:
- No first-login walkthrough/tour anywhere in the app. A `GeneratingChecklist`
  component existed for this purpose but was unused dead code — removed
  (2026-07-27, see git history).
- No visible "what stage is my account at" status on the dashboard during the
  discovery/outreach-send window — it can look empty/idle for days even though
  autopilot is working.
- The `email_sequences` type `"onboarding"` drip is a founder-voice feedback/nudge
  sequence (`apps/server/src/jobs/feedback-email-sequence.ts`), not a product tutorial
  or progress digest.
- The results email (`apps/server/src/helpers/emails/send-onboarding-complete.ts`)
  links straight to `/dashboard` with no explanation of what happens next or what the
  user's role is (monitor/cancel, not approve-each-one).

## Recommendation

1. First-login dashboard walkthrough (3-4 short tooltips, not a modal wall of text):
   explain the opportunity/fit-rationale card, the queue, the cancel action, and that
   replies get handled from the user's own mailbox.
2. Visible progress state on the dashboard while discovery/outreach is running (e.g.
   "14 opportunities found, 6 outreach sent, 2 replied") instead of a static/empty view.
3. One or two checkpoint digest emails (e.g. day 1, day 3) summarizing new
   opportunities and reminding the user they can review/cancel — doubles as the
   "monitor and cancel" task CLAUDE.md describes as the user's actual job, currently
   invisible to them.
4. Keep additions minimal — product's core pitch is "less work than outreach
   software," so avoid turning this into a drip campaign.

## Implemented (2026-07-28)

Key correction to the analysis above: the walkthrough content already existed. The
`HowItWorksDialog` covered the 3 steps, status meanings, live/paused outreach state and
"your only manual actions" — but sat behind a ghost button in the header, only on
`/dashboard/prospects`. Most of item 1 was a surfacing problem, not a writing problem.

- **`profiles.walkthrough_seen_at`** (`supabase/migrations/20260728120000_...sql`) gates
  a single auto-showing. NULL = not yet shown; stamped on first close via the
  `markWalkthroughSeen` server action, never reset. Existing profiles left NULL on
  purpose so current users get it once too.
- **Dialog body extracted** to `how-it-works-content.tsx`, shared by the header button
  (`how-it-works-dialog.tsx`) and the new auto-opening `first-login-walkthrough.tsx`,
  mounted in the dashboard layout so it fires on any dashboard route. Added a
  "Your job: monitor and cancel" block — the dismiss action was underplayed.
- **Teaching wait state** (`discovery-in-progress.tsx`) replaces the identical spinner
  cards that were duplicated in `dashboard/page.tsx` and `prospects/page.tsx`. Shows the
  3-step explainer plus three things worth doing while waiting: check the AI-guessed
  competitors, review crawled target pages, browse directories. Follows CLAUDE.md's
  "empty states should teach what inputs improve discovery quality".
- **`StepLaunch` expectation-setting**: a "What happens next" block stating plainly that
  outreach sends automatically and there's no per-opportunity approval. Wizard CTA
  changed from "Find Opportunities" to "Start Discovery & Outreach" — the old label
  didn't admit emails would send on the user's behalf.
- **"Autopilot status" / "Needs you" panel** (`overview/needs-you.tsx`) at the top of
  `/dashboard`, above the charts: discovered / sent / awaiting reply / replied counts,
  plus the real to-dos that were previously invisible — prospects in `email_not_found`,
  paid tier with no connected mailbox, shared-pool capacity. This covers item 2.
- **Persistent getting-started checklist** (`getting-started-checklist.tsx`) backed by a
  localStorage-persisted `activation-store`. A one-shot modal doesn't survive Maciej's
  actual failure mode (sign up, get pulled away, return a week later); this does. Shows
  on `/dashboard` and `/dashboard/prospects` until complete or dismissed.
- **Activation instrumentation**: `walkthrough_shown/opened/completed`,
  `activation_step_completed`, `activation_checklist_item_opened/dismissed`,
  `discovery_wait_task_opened`, `needs_you_task_opened`. There was no post-onboarding
  funnel at all before, so there was no way to tell whether a fix worked.

### Still open

- Item 3 (checkpoint digest emails) — deliberately deferred. Check for collision with
  the existing founder-voice drip in `apps/server/src/jobs/feedback-email-sequence.ts`
  before adding anything to the inbox.
- Live per-stage discovery progress. `run-onboarding-jobs.ts` runs four named branches
  and logs START/done for each but persists nothing the UI can read, so the wait state
  still can't show "crawling pages → scanning competitors → finding contacts". Would
  need those branches to write status to `backlink_prospect_runs`.
- `send-onboarding-complete.ts` still deep-links to `/dashboard` rather than the queue.

## Reply sent

Replied to Maciej acknowledging the gap, explaining a first-login walkthrough +
dashboard status signals are planned, and offered to personally onboard him again
(call or async) once live.
