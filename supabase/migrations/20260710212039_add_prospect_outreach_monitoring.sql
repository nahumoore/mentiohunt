create table if not exists public.email_account_mailbox_syncs (
  id uuid primary key default gen_random_uuid(),
  email_account_id uuid not null references public.email_accounts(id) on delete cascade,
  mailbox text not null default 'INBOX',
  uid_validity bigint,
  last_uid bigint not null default 0,
  last_synced_at timestamptz,
  locked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email_account_id, mailbox)
);

create index if not exists email_account_mailbox_syncs_locked_idx
  on public.email_account_mailbox_syncs (locked_at)
  where locked_at is not null;

alter table public.email_account_mailbox_syncs enable row level security;

create table if not exists public.prospect_messages (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.backlink_prospects(id) on delete cascade,
  sequence_id uuid references public.prospect_sequences(id) on delete set null,
  email_account_id uuid references public.email_accounts(id) on delete set null,
  direction text not null default 'inbound' check (direction in ('inbound', 'outbound')),
  classification text not null,
  classification_confidence numeric(4, 3),
  classification_reason text,
  message_id text,
  in_reply_to text,
  "references" text[],
  imap_uid bigint,
  imap_uid_validity bigint,
  from_email text,
  from_name text,
  to_emails text[],
  subject text,
  text_body text,
  html_body text,
  received_at timestamptz not null,
  headers jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists prospect_messages_imap_message_unique
  on public.prospect_messages (email_account_id, imap_uid_validity, imap_uid)
  where imap_uid is not null and imap_uid_validity is not null;

create index if not exists prospect_messages_prospect_received_idx
  on public.prospect_messages (prospect_id, received_at desc);

create index if not exists prospect_messages_sequence_idx
  on public.prospect_messages (sequence_id);

create index if not exists prospect_messages_message_id_idx
  on public.prospect_messages (message_id);

create index if not exists prospect_messages_classification_idx
  on public.prospect_messages (classification);

alter table public.prospect_messages enable row level security;
