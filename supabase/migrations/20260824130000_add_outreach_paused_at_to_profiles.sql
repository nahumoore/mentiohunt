-- Self-serve "pause everything" flag: when set, daily discovery skips the
-- account and the outreach sender refuses to send any of its sequences,
-- in addition to the existing one-time queue cleanup on "Stop all outreach".
-- Distinct from deactivated_at, which also locks the whole dashboard and
-- requires support to reverse.
alter table public.profiles
  add column if not exists outreach_paused_at timestamptz;
