-- company_size and role were collected in onboarding and never read by
-- anything. Dropping them rather than building a reader we have no plan for.
--
-- referral_source stays, but every value collected so far came from a
-- dropdown buried mid-wizard, so the answers are noise. Wiping them so the
-- new post-checkout question (asked on its own dedicated page instead of
-- mid-wizard) starts from a clean slate.

alter table public.profiles drop column if exists company_size;
alter table public.profiles drop column if exists role;

update public.profiles set referral_source = null where referral_source is not null;

comment on column public.profiles.referral_source is
  'How the user says they found Mentiohunt. Asked once on /onboarding/welcome after checkout. NULL = never answered (all pre-2026-08-30 accounts).';
