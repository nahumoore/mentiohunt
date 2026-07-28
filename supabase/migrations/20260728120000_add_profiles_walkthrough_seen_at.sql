-- Track when a user first saw the in-app how-it-works walkthrough.
--
-- Onboarding feedback (2026-07-27) was that new users land on the dashboard
-- with no explanation of how the product works. The explainer content already
-- existed (apps/web/components/link-building/prospects/how-it-works-content.tsx)
-- but was only reachable from a ghost "How it works" button in the header,
-- which a busy founder never clicks. This column gates auto-opening it once,
-- on the first dashboard load.
--
-- NULL = never shown. Stamped once, when the walkthrough is first closed, and
-- never reset — re-opening it from the header button must not move the value.
-- Existing profiles are intentionally left NULL so current users, who have the
-- same gap in context, also get the walkthrough once.

alter table public.profiles
  add column if not exists walkthrough_seen_at timestamptz;

comment on column public.profiles.walkthrough_seen_at is
  'When the user first saw the in-app how-it-works walkthrough. NULL = not yet shown.';
