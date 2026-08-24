-- Notifications: a per-user feed of things that happened (a prospect replied,
-- a tracked backlink broke) plus a separately-modeled broadcast channel for
-- platform-wide announcements ("what's new") that ship to every user without
-- writing a row per user.
--
-- notifications rows are written server-side only (supabaseAdmin) at the
-- point each source event already happens — no trigger on prospect_messages
-- / tracked_link_events, so the title/body text lives in app code where it's
-- easy to template and extend with new types.
--
-- notification_platform_updates is a single row per announcement, read by
-- every user; notification_platform_update_reads is the per-user read-state
-- join, so shipping an update never fans out N rows.

create type public.notification_type as enum (
  'prospect_reply',
  'tracked_link_issue'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,

  type public.notification_type not null,
  title text not null,
  body text,
  link_href text,

  prospect_id uuid references public.backlink_prospects(id) on delete cascade,
  tracked_link_id uuid references public.tracked_links(id) on delete cascade,

  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications (user_id) where read_at is null;

create table public.notification_platform_updates (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  body text,
  link_href text,

  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index notification_platform_updates_published_idx on public.notification_platform_updates (published_at desc);

create table public.notification_platform_update_reads (
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform_update_id uuid not null references public.notification_platform_updates(id) on delete cascade,
  read_at timestamptz not null default now(),

  primary key (user_id, platform_update_id)
);

alter table public.notifications enable row level security;
alter table public.notification_platform_updates enable row level security;
alter table public.notification_platform_update_reads enable row level security;

-- Row is written by supabaseAdmin (service_role); authenticated users may
-- only flip read_at on their own rows, never the content.
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant all on public.notifications to service_role;

-- Broadcast rows are authored by an internal script/Studio, never by a
-- client — authenticated only ever reads.
grant select on public.notification_platform_updates to authenticated;
grant all on public.notification_platform_updates to service_role;

grant select, insert on public.notification_platform_update_reads to authenticated;
grant all on public.notification_platform_update_reads to service_role;

create policy "Users can view their own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can mark their own notifications read"
  on public.notifications for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can view platform updates"
  on public.notification_platform_updates for select
  to authenticated
  using (true);

create policy "Users can view their own platform update reads"
  on public.notification_platform_update_reads for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can mark platform updates read for themselves"
  on public.notification_platform_update_reads for insert
  to authenticated
  with check (user_id = (select auth.uid()));
