-- In-app support chat, replacing the third-party Crisp widget.
--
-- Crisp gave zero visibility into who was chatting, what page they were on,
-- or their account state, and shipped an off-brand widget. This gives us our
-- own conversation + message tables so the widget can capture page context
-- and identity automatically, with a dev-only console for the founder to
-- read and reply.
--
-- Access model: RLS is enabled on both tables but deliberately has NO
-- anon/authenticated policies. Anonymous visitors would otherwise need
-- permissive anon-role policies on a table holding every conversation, which
-- is not worth the exposure. Instead every read/write goes through Next.js
-- route handlers using the service-role client, and visitor identity is a
-- signed httpOnly cookie checked at the application layer.

create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null,
  user_id uuid references public.profiles(id) on delete set null,
  email text,
  name text,
  status text not null default 'open' check (status in ('open', 'closed')),
  current_path text,
  metadata jsonb not null default '{}'::jsonb,
  last_message_at timestamptz,
  last_visitor_message_at timestamptz,
  last_agent_message_at timestamptz,
  agent_read_at timestamptz,
  last_notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One live thread per visitor at a time; closed threads are kept as history
-- and a new message from the same visitor starts a fresh open conversation.
create unique index if not exists support_conversations_open_visitor_idx
  on public.support_conversations (visitor_id)
  where status = 'open';

create index if not exists support_conversations_last_message_idx
  on public.support_conversations (last_message_at desc);

create index if not exists support_conversations_user_id_idx
  on public.support_conversations (user_id);

comment on column public.support_conversations.visitor_id is
  'Anonymous visitor identifier from the signed mh_support_vid cookie. Stable across sessions for the same browser.';
comment on column public.support_conversations.metadata is
  'Visitor context: entry_url, referrer, utm, rolling page trail, locale/timezone/viewport/user_agent, and account snapshot for logged-in users.';
comment on column public.support_conversations.agent_read_at is
  'When the founder last opened this conversation in the /support console. Used to compute the unread badge.';
comment on column public.support_conversations.last_notified_at is
  'When the last new-message email notification was sent, for debouncing bursts of visitor messages.';

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  sender text not null check (sender in ('visitor', 'agent')),
  body text not null check (char_length(body) between 1 and 4000),
  page_url text,
  created_at timestamptz not null default now()
);

create index if not exists support_messages_conversation_created_idx
  on public.support_messages (conversation_id, created_at);

alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;

-- Deliberately no anon/authenticated policies: all access is server-side
-- via the service-role client, gated by the signed visitor cookie or the
-- dev-only NODE_ENV check on the /support console.
grant all on public.support_conversations to service_role;
grant all on public.support_messages to service_role;
