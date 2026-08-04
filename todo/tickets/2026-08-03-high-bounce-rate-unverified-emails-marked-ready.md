# Known issue: prospects marked "ready" to send regardless of email verification confidence, driving high bounce rate

## Summary

Bounce rate across contacted prospects is ~35% (22 bounced / 63 contacted, Mentiohunt
product, measured 2026-08-03 via `backlink_prospects.status` + `outreach_events`
event_type `bounce_detected`). Healthy cold-outreach bounce rate is <5%. Bounces are
detected only after the fact by IMAP DSN parsing
(`apps/server/src/helpers/outreach/inbound-email.ts:78-101`, wired into
`apps/server/src/jobs/prospect-outreach-monitor.ts:548-564,651`) — nothing upstream
prevents sending to addresses that were never actually confirmed deliverable.

## Root cause

Two compounding gaps, both in
`apps/server/src/methods/prospect-generation-methods/competitor-backlink/`:

1. **`enrich-contact.ts` accepts unverified/catch-all guesses as if they were confirmed.**
   The Apify email-verifier actor (`apps/server/src/helpers/actors/email-verifier.ts:18`)
   returns `status: "good" | "risky" | "bad"`. But:
   - `verifyPatterns()` (`enrich-contact.ts:202-246`) falls back to a `"risky"` result
     when `allowRiskyFallback` is set (`enrich-contact.ts:229-231,241`, invoked with
     `allowRiskyFallback=true` at `enrich-contact.ts:416,553`).
   - `verifyGeneratedPersonalPatterns()` (`enrich-contact.ts:255-287`) never requires
     `status === "good"` at all for catch-all domains — it accepts the top-priority
     *guessed* pattern outright and labels it `confidence: "inferred"`
     (`enrich-contact.ts:273-281`), with no verifier confirmation whatsoever.

2. **`process-competitor.ts` ignores the confidence label when deciding to send.**
   `ready = !!enriched.contact_email` (`process-competitor.ts:211`) — any non-null
   email flips `enrichment_status` to `"ready"` and `status` to `"new"`
   (`process-competitor.ts:217-218`), regardless of whether `confidence` is
   `"personalized"` (verifier said "good"), `"inferred"` (unverified catch-all guess),
   or `"generic"`/`"email-only"` (never sent through the verifier at all — see
   `enrich-contact.ts:424,477,501,544`). The `confidence` value is never checked
   before the prospect enters the send queue.

3. **No re-verification at send time.** `prospect-outreach-sender.ts:301-336` only
   checks the recipient isn't null and isn't suppression-listed
   (`isSuppressed`, line 315) before calling `sendOutreachEmail`
   (`apps/server/src/helpers/emails/send-outreach-email.ts:40-100`, plain nodemailer
   SMTP send). An email guessed/accepted weeks earlier at enrichment time is trusted
   forever with no freshness check.

Net effect: a meaningful share of sent emails were never actually confirmed
deliverable — they were best-effort guesses on catch-all domains, or generic-pattern
guesses that skipped verification entirely — and they aren't distinguishable from
verified addresses anywhere downstream.

## Impact

- Direct: ~35% of sends bounce, wasting shared-pool send capacity
  (`outreach@mentiohuntapp.com`, 25/day cap, already the platform's #1 bottleneck —
  see [[activate-new-outreach-mailboxes]]) on addresses that never had a real shot
  at landing.
- Indirect, more serious: repeated hard bounces from the same shared sending
  mailbox degrade its sender reputation over time, risking deliverability for
  *every* user routed through that pool, not just the one whose prospect bounced.
- Recurring pattern, not a one-off — confirmed across the full history of one
  product's prospects (discovered_at spanning 2026-07-13 through 2026-08-03).

## Recommendation (not yet actioned)

- Stop treating `"inferred"`/unverified-catch-all and `"risky"`-fallback emails as
  equivalent to verifier-confirmed `"good"` ones. Either:
  (a) store the `confidence`/verifier `status` on `backlink_prospects` (no such
  column exists today — only ends up in `raw_metadata` jsonb if at all) and gate
  `enrichment_status = "ready"` on a minimum confidence tier, or
  (b) keep sending to inferred/risky addresses but route them through a distinct,
  lower-priority path so a string of bounces on guessed addresses doesn't burn
  shared-pool reputation the same way confirmed addresses do.
- Consider whether `allowRiskyFallback=true` (`enrich-contact.ts:416,553`) should be
  narrowed — it was presumably added to avoid dropping too many prospects, so any
  fix needs to weigh prospect-volume loss against bounce-rate reduction; flag for
  discussion rather than change unilaterally.
- Prior/related: `todo/tickets/prospect-outreach-strategies/10-author-repeat-linker.md:40,91-94,165-166`
  already flagged the verifier's catch-all/risky handling as a deliverability risk
  in the context of a different tier — this ticket generalizes it with live data
  showing actual bounce-rate impact.
