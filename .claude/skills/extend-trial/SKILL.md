---
name: extend-trial
description: Extend a Mentiohunt user's free trial correctly and draft the founder-to-founder confirmation email. Use this whenever the user wants to give a customer more trial time, says a trial was extended but the person still can't log in / is stuck on the expired-trial screen, asks to "extend so-and-so's trial", "give them another week", "unlock their account", "comp them a few more days", or is following up on a trial-extension request (testimonial offer, "no time yet" cancellation save). Also use it to diagnose why a previous extension didn't stick. The critical thing this skill prevents: extending by flipping only `active_trial` without moving `billing_period_end_at`, which silently reverts within hours.
---

# extend-trial

Extend a legacy no-card free trial so it actually holds, then draft the confirmation email the founder sends back to the customer.

The whole reason this skill exists: an extension that sets `active_trial = true` but leaves `billing_period_end_at` in the past looks fine for a few hours, then a cron flips `active_trial` back to `false` and the customer is locked out again — with `updated_at` still showing your edit, so from the outside it looks like it worked. Every extension must move **both** fields. See `references/account-state.md` for exactly why.

## Before you start

You need the customer's **email** (or user id). If the user only gave a name or a vague reference ("the guy from the Slack thread"), ask for the email.

Decide the extension length. Default is **7 days** from today (matches the canonical grant snippet the app emails on a testimonial request). If the user named a number of days, use that. If they said something like "give them a proper run at it" without a number, ask.

## Step 1 — Look up the account

Query `public.profiles` by email (case-insensitive):

```sql
select id, email, name, tier, active_trial, stripe_customer_id,
       billing_period_start_at, billing_period_end_at,
       onboarding_completed, deactivated_at, updated_at
from public.profiles
where lower(email) = lower('<customer-email>');
```

Read the result:

- **No row** → the person never finished signup. Stop and tell the user; there's nothing to extend.
- **`deactivated_at` is set** → account is deactivated (different state from an expired trial). Extending the trial won't restore access on its own. Flag this to the user and ask how they want to handle it before doing anything.
- **`stripe_customer_id` is set AND `tier` is `pro`/`agency`** → this is a **Stripe card-required trial**, not a legacy free trial. Do **not** touch the database — `active_trial` there is driven by Stripe webhooks and a manual edit will be overwritten. The extension has to happen on the Stripe subscription's `trial_end` (the app's `stripeExtendTrial` action, or bump `trial_end` directly in Stripe). Explain this to the user and stop unless they specifically want help with the Stripe side.
- **`tier` is `free`** (with `stripe_customer_id` null) → this is the legacy free trial this skill handles. Continue.

If diagnosing a failed prior extension: the tell is `billing_period_end_at` sitting in the past while the user swears they extended it. That means only `active_trial` was flipped last time. Confirm that's what you're seeing, then fix it with Step 2.

## Step 2 — Produce the grant SQL

The MCP Supabase connection is **read-only** — you cannot run this write yourself. Produce the exact statement for the user to run in the Supabase SQL editor (or wherever they run manual account fixes), then wait for them to confirm they've run it.

For the default 7-day extension, use the canonical snippet unchanged:

```sql
update public.profiles
set active_trial = true,
    billing_period_end_at = greatest(billing_period_end_at, now()) + interval '7 days'
where id = '<user-id>';
```

For a custom length, change the interval (e.g. `interval '14 days'`, `interval '30 days'`). Keep everything else identical — in particular **do not change `tier`**; a legacy trial stays `tier = 'free'`.

Why `greatest(billing_period_end_at, now())`: if the old end date is already in the future you add onto it; if it's in the past you add onto today, so the customer gets the full window rather than losing days that already lapsed.

Always key the update on `id`, not `email` — emails are user-editable and you already have the id from Step 1.

## Step 3 — Verify it held

After the user says they've run it, re-query:

```sql
select email, tier, active_trial, billing_period_end_at, updated_at
from public.profiles
where id = '<user-id>';
```

Confirm `active_trial = true`, `tier = 'free'`, and `billing_period_end_at` is the expected future date. If any of that is off, the write didn't land — don't send a confirmation email saying it's fixed.

Paused outreach sequences recover on their own: a sweep runs every ~5 minutes and re-activates any sequence that was paused for `trial_expired` once the owner is eligible again. Tell the customer their outreach will resume shortly rather than promising it's already running this second.

## Step 4 — Draft the confirmation email

Draft it as **plain text** — no `>` blockquote formatting — and show it to the user for approval before anything gets sent. It goes out founder-to-founder from the customer's own contact, matching Mentiohunt's voice: short, direct, a little warm, no corporate padding. See `.claude/skills/copywriting` for the brand voice if you need a refresher.

Cover, briefly:

- It's done / sorted.
- If this was a fix for a botched earlier extension: one plain sentence on what went wrong ("your account was still on the old end date, so the system re-locked it") — own it, don't over-explain.
- The new trial end date, written out (e.g. "September 4").
- What they do now: refresh or log back in, full access is back.
- A one-line open door: reply if anything still looks off.

Sign it from the founder (first name).

**Example**

Input: extended `maciek.robakiewicz@gmail.com` to 2026-09-04, fixing an earlier extension that only flipped `active_trial`.

Output:

Subject: You're back in — trial extended

Hi Maciek,

Sorted. Your account was still showing the old trial end date, so the system had locked it back down even after we extended it. Fixed on our end now.

Your trial runs through September 4 — just refresh or log back in and you'll have full access again.

Sorry for the hassle. Reply here if anything still looks off.

Best,
Nicolas
