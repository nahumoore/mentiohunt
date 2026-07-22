# Copy audit: outreach is automated only through first reply, then handoff to customer's own inbox

## Decision (made 2026-07-22, this ticket is the follow-up, not the implementation)

Product behavior going forward: Mentiohunt fully automates prospecting and outreach up through a prospect's first reply. Once a prospect replies, the conversation must continue from the *customer's own connected mailbox* — not our shared pool. Rationale: our shared/public sending mailboxes are disposable, single-purpose outreach infrastructure (built for sending volume and reputation management, not for real conversations); handing off to the customer's own inbox the moment a human is on the other end keeps replies human-to-human, protects deliverability/thread integrity (matching `References`/`In-Reply-To`, consistent domain reputation with that recipient), and keeps the customer's personal inbox clean until it actually matters.

This was implemented UI-side in `apps/web/components/prospects/reply-via-mailbox-notice.tsx` (see `apps/web/app/dashboard/prospects/[slug]/page.tsx` — `isPublicMailbox` check against `backlink_prospects.email_account_id` → `email_accounts.is_public`): shared-mailbox prospects get a CTA to connect their own mailbox before they can reply; own-mailbox prospects get a "reply from your inbox" instruction.

## Why this ticket exists

This changes what "auto-scheduled outreach" and "coordinates placement" mean in every place that describes the product. Anywhere copy implies Mentiohunt handles the *entire* placement conversation end-to-end (not just discovery → first send → first reply) is now inaccurate or at least needs framing that a human handoff happens at the reply stage. Needs an explicit audit pass, not a blind find-replace — do not action the copy changes without confirming the exact wording per surface.

## Known places to check (starting points, not exhaustive)

- **`CLAUDE.md:5`** — "Core offer" line says the system "...generates a ready-to-send email draft, and coordinates placement." "Coordinates placement" reads as full-lifecycle automation including negotiation. Needs to reflect that automation ends at first reply, then the founder takes over personally.
- **`apps/web/components/landing/faq.tsx`** — several entries reference "conversations" being stored/collected (lines ~70, ~73-75, "If a prospect replies after my trial ends, do I lose the conversation?"). Doesn't currently say who replies — worth checking whether the surrounding FAQ context anywhere implies Mentiohunt sends the reply on the customer's behalf, and whether a new FAQ entry is needed to state the handoff model explicitly (a customer will hit this in-product and may be confused/frustrated if it's not set expectations, especially free-trial users on the shared pool who can't reply at all until they connect a mailbox).
- **`apps/web/app/page.tsx`** — landing hero/metadata currently says "Backlink Placement Autopilot for Founders." Confirm downstream sections (not yet greped section-by-section) don't oversell full autopilot through negotiation/close.
- **Onboarding copy / empty states** — anywhere that sets expectations about what happens after outreach sends (check onboarding wizard copy, empty-state copy per UX Guidance in CLAUDE.md).
- **Any transactional/notification emails** sent to the customer when a prospect replies (e.g. `sendReplyAlertEmail` in `apps/server/src/jobs/prospect-outreach-monitor.ts`) — confirm the copy there already correctly tells the customer to take over, doesn't imply Mentiohunt will handle the reply for them.
- **Pricing/plan copy** — if reply handoff ever becomes a paid-tier gate distinction (e.g. speed/priority on connecting a mailbox), confirm plan comparison copy doesn't contradict.

## Not in scope for this ticket

- The in-app UI notice itself (already built).
- Any decision about whether to eventually build an in-app "reply through the same shared domain" compose feature (flagged separately in conversation — deliverability tradeoffs discussed but not decided).
