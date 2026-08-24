# Make auto-send outreach state and first-send more explicit to the customer

## Background

Ivan Fedyanin (`ivan.a.fedyanin@gmail.com`, Fluentessa — French reading app,
signed up 2026-08-16) emailed churn feedback 2026-08-24. Core complaint:
"It was a surprise to me, when I logged into the dashboard today to see that
some of the emails were already sent, though I do not remember explicitly
enabling email sending/approving each specific prospect." He also clicked
"Stop all outreach" and saw no UI change, so he wasn't sure it worked (asked
us to confirm manually — checked DB, confirmed working: all his
`prospect_sequences` flipped to `account_paused`, nothing pending).

Auto-send-on-discovery is the core product model, not a bug (see project
CLAUDE.md: "Outreach sequences are auto-scheduled on discovery — the
customer's role is to monitor and cancel, not approve each one"). Explainer
copy for this already exists in two places:

- `apps/web/consts/autopilot.ts:19-35` (`AUTOPILOT_STEPS`) — "Automatic
  outreach: Emails and follow-ups are sent automatically from our side — no
  action needed."
- `apps/web/components/link-building/prospects/how-it-works-content.tsx:67-71,92-131`
  — "Mentiohunt runs outreach for you — there's no separate approval step,"
  plus a live/paused status banner.

Gap: the actual first-login walkthrough a new user sees,
`apps/web/components/dashboard/welcome-tour/welcome-tour-content.tsx`
(rendered by `apps/web/components/dashboard/first-login-walkthrough.tsx`,
gated by `profiles.walkthrough_seen_at`), does **not** reuse
`AUTOPILOT_STEPS` or mention auto-send at all. So the one surface guaranteed
to reach every new user on day one is silent on the exact point that caused
Ivan's surprise. There's also no user-facing notification when outreach
actually starts sending for the first time —
`apps/web/lib/notify-outreach-mailbox-activated.ts` only emails the internal
team when a customer connects their own mailbox, not the customer when
sends begin.

Separately: "Stop all outreach"
(`apps/web/components/dashboard/settings/account-tab.tsx:83-91`) opens a
confirm dialog first; the actual stop + `toast.success` only fires after
confirming (`handleStopOutreach`, lines 37-52 →
`apps/actions/account-actions.ts:31-45` → `pauseAllOutreachForUser` in
`apps/web/lib/outreach/account-sequences.ts:41-62`). Toaster is mounted
globally in `apps/web/app/layout.tsx`, so the plumbing looks intact — likely
Ivan either missed the toast or clicked once expecting an immediate effect
without confirming. Either way the confirmed-paused state isn't visible
anywhere persistent afterward (no banner/badge on the page), so there's
nothing to check if you miss the toast.

## Next steps

1. Add an auto-send explainer step to
   `apps/web/components/dashboard/welcome-tour/welcome-tour-content.tsx`,
   reusing or adapting the copy from `AUTOPILOT_STEPS`
   (`apps/web/consts/autopilot.ts:19-35`) — make explicit that discovered
   prospects get emailed automatically without per-prospect approval, and
   where to go to pause/cancel.
2. Add a one-time "first send" notification to the customer (email, via
   whatever the project's existing transactional-email path is — check
   `apps/server` for the pattern used by other customer-facing emails) the
   first time a `prospect_sequences` row for their product flips to `sent`.
   Should state N emails went out, link to the prospect list, and link to
   the stop-all-outreach control.
3. Give the paused state a persistent visible marker after "Stop all
   outreach" is confirmed — not just a toast that disappears. E.g. a banner
   on the prospects/outreach page (reusing the live/paused banner already
   built in `how-it-works-content.tsx:92-131`) so a customer who missed the
   toast can still see at a glance that outreach is off.
4. Consider surfacing the "How it works" dialog
   (`apps/web/components/link-building/prospects/how-it-works-dialog.tsx`)
   automatically (not just from a header button) the first time a
   prospect's status would move toward auto-send, as a second checkpoint
   beyond the one-time welcome tour.
