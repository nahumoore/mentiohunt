# Add free warmup + own-inbox HTML signatures, gated to outreach accounts

## Background

Liam (first paying customer, `liam@identifywebdesign.co.uk`, support conv
`8712581d-27d1-4cc6-9360-a8c160172b9c`) asked for a fully branded HTML
signature (logo, colors) on outreach emails. Current policy: shared sending
pool caps formatting (bold name, line break, one link) because rich HTML
increases spam-filter hits, and the pool is shared across every customer —
one account's format choice shouldn't cost everyone else's deliverability.

Decision from 2026-08-17 discussion: don't gate richer formatting by price
tier ($49 Pro vs $99 Agency) — pool risk is identical regardless of plan,
and if anything Agency customers push more volume through the pool. Gate by
**sending source** instead:

- Shared Mentiohunt pool inboxes → format cap stays as-is, both plans.
- Customer's own connected mailbox (`email_accounts` table, already wired
  into `apps/server/src/jobs/prospect-outreach-sender.ts`) → full HTML,
  logo, no cap — it's their own domain reputation at risk, not the pool's.

To make moving to their own mailbox worth it, offer **free warmup included
on both plans** as the incentive — no marginal $ cost to us, and it pulls
send volume off the shared pool (lowers pool risk for everyone).

Note: no warmup logic exists in the codebase currently (grepped, zero
hits). Pool mailboxes themselves get warmed via an external
tool/service — see `todo/tickets/2026-08-03-activate-new-outreach-mailboxes.md`.
Reuse that same external service for customer-owned inboxes rather than
building warmup logic in-house, unless that service doesn't support
third-party inboxes.

## Next steps

1. Update `apps/web/consts/billing.ts` — add a "Free inbox warmup" line to
   the `features` array on both `PLANS` entries (Pro and Agency).
2. Add an info affordance on that feature line in
   `apps/web/components/landing/pricing.tsx` (and anywhere else PLANS
   renders, e.g. dashboard billing page if one exists) clarifying: warmup
   only applies to a customer's own connected outreach mailbox, for
   customers who want their own sending infrastructure instead of
   Mentiohunt's shared pool inboxes. Use `packages/ui/src/components/popover.tsx`
   (or `tooltip.tsx`) — both already exist in the shared UI package, neither
   currently used on the landing page. Tabler icon only (e.g. `IconInfoCircle`)
   per project icon rule, no lucide.
3. Confirm with whichever external warmup service the pool mailboxes use
   whether it supports onboarding arbitrary customer-owned inboxes
   (SMTP/Gmail/Outlook via `email_accounts`), and at what cost — this
   determines whether "free" is sustainable at scale or needs a cap
   (e.g. one warmed inbox per account).
4. Wire actual warmup trigger: when a customer connects a mailbox via
   `apps/web/app/api/email-accounts/create/route.ts` and enables
   `send_automated_outreach`, kick off warmup instead of routing full
   volume immediately — mirrors the ramp-up caution called out in the
   2026-08-03 pool-mailbox ticket (start low, ramp gradually).
5. Enforce the format cap in code (currently manual, agent tells customers
   in support chat). Signature editor is
   `apps/web/components/link-building/sources/outreach-settings-section.tsx`
   (plain `Textarea` today, no HTML). Changes:
   - Only render rich-HTML formatting controls (bold/links/logo — whatever
     scope we land on) when the account has a connected outreach mailbox
     with `send_automated_outreach` true in `email_accounts` — i.e. sending
     through their own infra, not the shared pool. Component currently
     takes `productName`/`productWebsite` props only; needs the connected
     outreach-account status passed in too.
   - When no such account is connected, keep today's plain-text signature
     field, and add a label under the field (same pattern as the existing
     amber `hasLink()` deliverability warning at line 133-141) stating rich
     HTML formatting is only available for a personal/own outreach
     account — not the shared pool — with a link to connect one at
     `/dashboard/email-accounts`.
   - Backend: `apps/web/app/api/link-building/outreach-settings/route.ts`
     needs the same check server-side, not just hidden client-side — don't
     trust the client to only send plain text.
