-- Let paid users opt in to sending automated outreach from their own
-- connected mailbox instead of Mentiohunt's shared pool.
--
-- Default is false: automated sequences send from the public pool by
-- default, matching the product promise that the connected mailbox is
-- reserved for the founder to reply personally once a prospect responds.
-- Users who understand the tradeoff (their own sending reputation takes
-- the hit) can flip this on.

alter table public.profiles
  add column if not exists send_outreach_from_private_inbox boolean not null default false;

comment on column public.profiles.send_outreach_from_private_inbox is
  'When true (paid tier only), automated outreach sequences send from the user''s own connected mailbox instead of the shared public pool. Default false.';
