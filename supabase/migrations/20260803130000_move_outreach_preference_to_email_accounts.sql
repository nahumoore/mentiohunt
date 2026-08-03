-- Move the automated-outreach opt-in from profiles (one flag for the whole
-- user) to email_accounts (one flag per connected mailbox).
--
-- A user can have several connected mailboxes; a single profile-level flag
-- couldn't express "automate through this one, keep that one reply-only."
-- Per-account is the correct grain — resolveEmailAccount now selects among
-- whichever of the user's accounts have this set to true.

alter table public.email_accounts
  add column if not exists send_automated_outreach boolean not null default false;

comment on column public.email_accounts.send_automated_outreach is
  'When true, automated outreach sequences may send from this mailbox instead of the shared public pool. Default false — mailbox stays reserved for replying personally.';

alter table public.profiles
  drop column if exists send_outreach_from_private_inbox;
