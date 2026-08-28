# Why a trial extension has to move both fields

This is the mechanism behind the one rule in the skill: set `active_trial = true` **and** push `billing_period_end_at` into the future, every time.

## The access gate

`apps/web/app/dashboard/layout.tsx` bounces a user to `/expired-trial` when:

```
tier === "free" && active_trial === false
```

That's the only check for legacy free trials. `billing_period_end_at` is not read here — so flipping `active_trial` back to `true` is enough to restore access *in the moment*. The problem is keeping it true.

## The cron that undoes a half-done extension

`apps/server/src/jobs/deactivate-expired-free-trials.ts` runs at **00:15, 08:15, 16:15 UTC** (registered in `apps/server/src/jobs/index.ts`). It does:

```
update profiles
set active_trial = false
where tier = 'free'
  and active_trial = true
  and billing_period_end_at < now()
```

So any legacy trial whose `billing_period_end_at` is in the past gets `active_trial` forced back to `false` within at most 8 hours. If your extension only flipped `active_trial` and left the date behind, the customer is locked out again by the next run.

## Why the stale state is invisible

That cron update writes only the `active_trial` column via supabase-js. It does not set `updated_at`. So after the cron reverts your change, `profiles.updated_at` still shows the timestamp of *your* edit, and `active_trial` reads `false` — it looks like your extension simply didn't take, when in fact it took and was then silently rolled back. The reliable tell is `billing_period_end_at` in the past on an account someone insists was extended.

## Paused outreach sequences

When a trial expires, `pauseSequencesForUsers` (in `apps/server/src/helpers/outreach/trial-sequences.ts`) sets every `pending` row in `prospect_sequences` for that user to `status = 'trial_expired'`.

Recovery is automatic: `resumeEligibleTrialExpiredSequences` runs every ~5 minutes and re-pends any `trial_expired` sequence whose owner is now eligible (`tier != 'free' OR active_trial = true`). No manual step needed after a correct extension — just don't tell the customer outreach is running "right now"; give it a few minutes.

## Stripe card-required trials are a different system

Accounts with a `stripe_customer_id` and `tier` of `pro`/`agency` are trialing through Stripe. Their `active_trial` / billing fields in `profiles` are set by Stripe webhooks. A manual DB edit there gets overwritten on the next webhook. Extending those means changing `trial_end` on the Stripe subscription — see `apps/web/actions/stripe-extend-trial.ts` for the app's own flow (it also enforces a one-time-per-customer guard via customer metadata).

## The canonical grant snippet

`apps/web/app/api/trial-extension-request/route.ts` is the endpoint behind the in-app "extend my trial for a testimonial" offer. It emails the team a ready-to-run snippet:

```
update profiles
set active_trial = true,
    billing_period_end_at = greatest(billing_period_end_at, now()) + interval '7 days'
where id = '<user id>';
```

This skill uses that exact shape. `greatest(billing_period_end_at, now())` means an already-future end date gets extended from where it is, and a lapsed one gets extended from today so the customer doesn't lose the days that already passed.
