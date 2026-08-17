-- Allow multiple public-pool outreach mailboxes to coexist (rotation across
-- outreach@/intro@/connect@ instead of a single shared sender).
drop index if exists public.email_accounts_public_singleton;
