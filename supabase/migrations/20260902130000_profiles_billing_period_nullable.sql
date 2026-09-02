-- New users no longer get a free trial at signup, so the profile row is
-- created with no billing period yet (both dates NULL). The NOT NULL
-- constraint from the trial-on-signup era was rejecting those inserts and
-- surfacing as auth_error=profile_creation_error.
--
-- A billing period is now set later, when the user actually starts a plan or
-- a comped trial.

alter table public.profiles alter column billing_period_start_at drop not null;
alter table public.profiles alter column billing_period_end_at drop not null;

comment on column public.profiles.billing_period_start_at is
  'Start of the current billing / trial period. NULL until the user starts a plan or is granted a trial.';
comment on column public.profiles.billing_period_end_at is
  'End of the current billing / trial period. NULL until the user starts a plan or is granted a trial.';
