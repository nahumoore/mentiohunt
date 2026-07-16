# Outreach Engine Review — 2026-07-15

_Follow-up items from investigating "prospect emails not sending" report. Sends are working; issues below are secondary bugs/gaps found along the way._

## 1. seodesignchicago.com got step 1 + step 2 same day — bug

Sequence for `scarlet@seodesignchicago.com` (prospect_sequences group, all rows `created_at = 2026-07-10 14:35:32`):

| step | scheduled_at | sent_at | gap from previous |
|---|---|---|---|
| 1 | 2026-07-15 12:29:00 | 2026-07-15 12:30:04 | — |
| 2 | 2026-07-15 12:36:00 | 2026-07-15 12:40:05 | **7 min** |
| 3 | 2026-07-17 14:35:32 | pending | ~2 days |

Step 1 → 2 gap is 7 minutes. Step 2 → 3 gap is ~2 days, which is the intended cadence. `sent_at` tracks `scheduled_at` closely for both (no evidence of a spacing-deferral reschedule pushing them together) — so the bug is at **sequence generation time**, not in the send-time spacing logic reviewed earlier.

**Next step:** read `apps/server/src/helpers/emails/outreach-schedule.ts` (the step-gap calculation used when a sequence's steps are first scheduled) and find why step1→2 gap collapses to minutes instead of days. Likely an off-by-one or wrong base-date reference for step 2 specifically. Check if other prospects have the same step1→2 collapse (query below) to size the blast radius:

```sql
select bp.domain, ps1.scheduled_at as step1_at, ps2.scheduled_at as step2_at,
       ps2.scheduled_at - ps1.scheduled_at as gap
from prospect_sequences ps1
join prospect_sequences ps2 on ps2.prospect_id = ps1.prospect_id and ps2.step = 2
join backlink_prospects bp on bp.id = ps1.prospect_id
where ps1.step = 1 and ps1.status = 'sent' and ps2.status in ('sent','pending')
order by gap asc
limit 20;
```

## 2. UI: surface "delayed — email pool full, upgrade to bypass" + fix queue priority

Two parts:

**a. User-facing signal.** Nothing today tells a customer their outreach is stalled because the shared/account email pool is at `daily_send_cap` or mid account-spacing defer. Add a queue-state indicator (opportunity/queue view) that reads pending `prospect_sequences` rows whose `scheduled_at` got pushed out by `deferForAccountSpacing()` (`apps/server/src/jobs/prospect-outreach-sender.ts:128-147`) and shows something like "Your outreach is queued — email pool is at capacity. [Upgrade] to send sooner." Ties into `daily_send_cap` / plan tier on `email_accounts`.

**b. Priority bug.** Queue is currently ordered by `scheduled_at ASC` (`apps/server/src/jobs/prospect-outreach-sender.ts:425-431`), not `created_at`. Because `scheduled_at` gets rewritten to a random future slot (60–240 min) on every spacing-deferral (`buildCapacityReschedule`, `apps/server/src/helpers/emails/outreach-schedule.ts:61-63`), a sequence created earlier can land a later `scheduled_at` than one created after it — newer sequences can queue-jump older ones by reschedule luck.

**Fix:** order pending sequences by `created_at ASC` (with `scheduled_at` still used as the "not due yet" gate via `.lte()`), so older-created sequences always win among eligible rows. One-line change, low risk — didn't apply yet, pending go-ahead.

## 3. Trial period FAQ gap — reply handling after trial ends

Verbatim user comment:

> "One more thing that this is my 7 days trial, If during trial period I haven't got someone response so what will happen? After my trial period I am able to respond back to the prospects who reply to my outreach or not? Or my trial period will extended? Because I love this tool and after getting positive response I will purchase this tool for my agency."

Unanswered questions to cover, either on landing FAQ or in-dashboard (trial banner / settings):
- If no prospect replies during the 7-day trial, does the trial silently end or auto-extend?
- After trial expiry, can the user still see/respond to replies that came in *during* the trial, or does access lock immediately?
- Is there any grace period or manual extension path for users who are actively engaged (mid-conversation with a prospect) when trial ends?

**Next step:** confirm actual product behavior (check trial-expiry logic in `apps/server`, likely near `profiles.active_trial` / `billing_period_end_at`) before writing copy — don't publish an answer that isn't backed by what the code actually does.

## 4. Trial-expired page: offer 7-day extension for a social testimonial

On the expired-trial page, offer +7 days if the user posts a testimonial on social media. Needs: submission mechanism (URL paste? screenshot upload?), verification step before granting the extension (manual review vs automated check), and a cap on how many times this can be claimed per account to avoid abuse.

**Status:** raw, pending done separately (email cap bump already applied directly in Supabase — `daily_send_cap` for `outreach@mentiohuntapp.com` is now 25, not part of this doc's open items).
