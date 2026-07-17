# Outreach Engine Review — 2026-07-15

_Follow-up items from investigating "prospect emails not sending" report. Sends are working; issues below are secondary bugs/gaps found along the way._

_Update 2026-07-16: items 2, 3, and 4 corrected — see status notes under each. Item 1 still open._

## 1. seodesignchicago.com got step 1 + step 2 same day — bug ⏳ OPEN

Sequence for `scarlet@seodesignchicago.com` (prospect_sequences group, all rows `created_at = 2026-07-10 14:35:32`):

| step | scheduled_at        | sent_at             | gap from previous |
| ---- | ------------------- | ------------------- | ----------------- |
| 1    | 2026-07-15 12:29:00 | 2026-07-15 12:30:04 | —                 |
| 2    | 2026-07-15 12:36:00 | 2026-07-15 12:40:05 | **7 min**         |
| 3    | 2026-07-17 14:35:32 | pending             | ~2 days           |

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

## 4. Trial-expired page: offer 7-day extension for a social testimonial ✅ CORRECTED

On the expired-trial page, offer +7 days if the user posts a testimonial on social media. Needs: submission mechanism (URL paste? screenshot upload?), verification step before granting the extension (manual review vs automated check), and a cap on how many times this can be claimed per account to avoid abuse.

**Status:** raw, pending done separately (email cap bump already applied directly in Supabase — `daily_send_cap` for `outreach@mentiohuntapp.com` is now 25, not part of this doc's open items).

**Status 2026-07-16:** implemented as manual-review flow (no new DB table). `TestimonialExtensionCard` on `/expired-trial` posts to `/api/trial-extension-request`, which emails PRIMARY_EMAIL via Resend with the user's details, the post URL, and a ready-to-run SQL grant snippet (`active_trial = true`, `billing_period_end_at = greatest(end, now()) + 7 days`). Review in inbox + manual grant in Supabase is the approval flow and abuse control.
