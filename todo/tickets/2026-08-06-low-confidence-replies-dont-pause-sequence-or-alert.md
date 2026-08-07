# Low-confidence inbound reply classifications don't pause the sequence or alert the founder

## Summary

A prospect replied with a genuine, on-topic response, but the classifier read it with
low confidence and filed it as `needs_review` instead of `human_reply`. Because only a
*confident* classification (`human_reply`, `bounce`, `unsubscribe`, `negative_reply`,
`wrong_person`) triggers `stopProspectSequence` in
`apps/server/src/jobs/prospect-outreach-monitor.ts:533-636`, nothing paused the
pre-scheduled follow-up. It sent over a day later as if no reply had ever arrived.
The founder also got no alert, since `notifyUserOfReply`
(`prospect-outreach-monitor.ts:500-531`) only fires on the `human_reply` branch — a
`needs_review` classification just logs an `inbound_needs_review` event
(`prospect-outreach-monitor.ts:623-635`) with no visible action item anywhere.

## Evidence (prospect `240f36c6-0f52-4eaf-b1ab-f8690e9c6cbe`, techjustify.com)

1. **2026-08-05 11:30 UTC** — step 1 outreach sent.
2. **2026-08-05 11:44 UTC** — reply arrives 14 minutes later: *"We Charge $100 for Link
   insertion in existing posts With do-follow backlink permanently."* This is
   essentially the exact scenario the classifier's own few-shot prompt calls out as
   `human_reply` (`apps/server/src/helpers/outreach/inbound-email.ts:197-205`, e.g.
   `"Happy to add you, do you have a monthly budget for this link?" -> human_reply`).
   Instead it came back `needs_review`, confidence `0.5`, reason "Message contains
   reply text but could not be classified confidently." — the generic fallback used
   when the LLM call fails or returns confidence `< 0.75`
   (`inbound-email.ts:272-278`). Sequence was not paused; no alert sent.
3. **2026-08-06 15:55 UTC** — step 2 follow-up sent on its original schedule, as `Re:`
   the same thread, ~28 hours after the prospect had already quoted a price.
4. **2026-08-06 16:27 UTC** — prospect replies again ("What is your budget for
   this?"), this time classified `human_reply` at confidence `1.0`. Step 3 was
   correctly cancelled 3 minutes before it was due to send.

So the mechanism works when classification is confident — it just has no fallback
behavior for when it isn't, other than silently doing nothing.

## Impact

- Follow-ups can go out after a prospect has already responded, which reads as
  ignoring them mid-negotiation — exactly the kind of thing the product promises
  founders won't happen.
- The founder has no visibility into `needs_review` replies today (no email alert, no
  surfaced item in the dashboard that this was checked), so there's currently no
  manual escape hatch either — a miss here is a silent miss.

## Recommendation (not yet actioned)

- At minimum, pause the sequence on `needs_review` too (treat "uncertain" as "don't
  auto-send blind," the same posture already taken for `challenge`/`auto_reply`), and
  send the founder an alert so a human decides rather than the sequence just
  continuing on autopilot.
- Consider whether the `0.75` confidence cutoff is too high given the fallback
  behavior is "do nothing" rather than "flag for review" — worth checking how often
  `needs_review` fires in practice and whether it's usually a real reply (as here) or
  actually ambiguous.
- Related: [[verify-founder-reply-email-threading]] and
  [[high-bounce-rate-unverified-emails-marked-ready]] are the other two open
  reply/outreach-pipeline trust gaps.
