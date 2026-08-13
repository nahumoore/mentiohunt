-- Distinct from 'paused' (per-prospect dismiss) and 'trial_expired'
-- (billing-driven). 'account_paused' is written when the owner hits
-- "Stop all outreach" or "Deactivate account" from settings, and is the
-- only status the reactivate flow resumes -- so it never accidentally
-- resurrects a prospect the user individually dismissed.
alter type public.prospect_sequence_status add value if not exists 'account_paused';

-- Null = active account. Set when the owner self-serve deactivates from
-- settings; outreach and discovery stop, but nothing is deleted, and the
-- account stays reachable (read-only) with a Reactivate action.
alter table public.profiles
  add column if not exists deactivated_at timestamptz;
