alter type public.prospect_sequence_status add value if not exists 'sending';
alter type public.prospect_sequence_status add value if not exists 'bounced';

alter table public.prospect_sequences
  add column if not exists message_id text,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists last_error text,
  add column if not exists locked_at timestamptz,
  add column if not exists bounced_at timestamptz,
  add column if not exists bounce_reason text,
  add column if not exists provider_response jsonb;

alter table public.prospect_sequences
  add constraint prospect_sequences_attempt_count_nonnegative
  check (attempt_count >= 0) not valid;

alter table public.prospect_sequences
  validate constraint prospect_sequences_attempt_count_nonnegative;

alter table public.backlink_prospects
  add column if not exists outreach_stopped_at timestamptz,
  add column if not exists outreach_stopped_reason text;

create table if not exists public.email_suppressions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  reason text not null,
  source_prospect_id uuid references public.backlink_prospects(id) on delete set null,
  source_sequence_id uuid references public.prospect_sequences(id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists email_suppressions_email_unique
  on public.email_suppressions (lower(email));

create index if not exists email_suppressions_reason_idx
  on public.email_suppressions (reason);

alter table public.email_suppressions enable row level security;

create table if not exists public.outreach_events (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references public.backlink_prospects(id) on delete cascade,
  sequence_id uuid references public.prospect_sequences(id) on delete set null,
  email_account_id uuid references public.email_accounts(id) on delete set null,
  event_type text not null,
  recipient_email text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists outreach_events_prospect_id_created_at_idx
  on public.outreach_events (prospect_id, created_at desc);

create index if not exists outreach_events_sequence_id_idx
  on public.outreach_events (sequence_id);

create index if not exists outreach_events_email_account_id_created_at_idx
  on public.outreach_events (email_account_id, created_at desc);

create index if not exists prospect_sequences_due_idx
  on public.prospect_sequences (email_account_id, scheduled_at)
  where status = 'pending';

create index if not exists prospect_sequences_locked_idx
  on public.prospect_sequences (locked_at)
  where locked_at is not null;

alter table public.outreach_events enable row level security;
