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

## Recommendation (not yet actioned)

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

## Reply sent

Replied to Maciej acknowledging the gap, explaining a first-login walkthrough +
dashboard status signals are planned, and offered to personally onboard him again
(call or async) once live.
