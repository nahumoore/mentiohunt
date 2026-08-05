-- Link Tracker: users submit URLs of pages that already link to their site,
-- and we re-check daily so a lost/nofollowed/changed backlink surfaces fast
-- instead of being discovered months later from a rankings drop.
--
-- Current state (what we last observed) is denormalized directly on
-- tracked_links so a nightly diff needs no history join. tracked_link_events
-- is append-only and written ONLY on a state transition (never on a check
-- that re-observes an already-broken state) — that's what makes the daily
-- email digest's "notify once per change" behavior structural rather than
-- something the job has to track separately. A raw per-check history table
-- was deliberately skipped: 200 links x many products x 365 days would be
-- millions of rows nobody reads: recent_checks (bounded to ~14 entries by
-- app code) gives a health sparkline at no extra table cost.

create type public.tracked_link_status as enum (
  'pending',         -- never successfully checked yet
  'live',            -- link present, dofollow, points where expected
  'nofollow',        -- link present but rel now has nofollow/ugc/sponsored
  'target_changed',  -- link present but href now points elsewhere on their domain
  'removed',         -- source page fetched fine, no link to their domain found
  'page_dead',       -- source page is 404/410/451 (confirmed, not transient)
  'check_failed'     -- could not verify after repeated attempts (transient, not an alert)
);

create type public.tracked_link_change_type as enum (
  'link_removed',
  'link_restored',
  'rel_added',
  'rel_removed',
  'anchor_changed',
  'target_url_changed',
  'target_now_competitor',
  'source_page_dead',
  'source_page_recovered',
  'source_page_redirected',
  'check_failed_persistent'
);

create table public.tracked_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,

  source_url text not null,
  source_domain text not null,
  expected_target_url text,
  label text,
  origin text not null default 'manual' check (origin in ('manual', 'bulk_import')),

  status public.tracked_link_status not null default 'pending',
  issue_since timestamptz,

  -- current observation (the diff base for the next check)
  observed_href text,
  observed_anchor_text text,
  observed_rel text[] not null default '{}',
  observed_http_status int,
  observed_final_url text,

  -- baseline captured on the first successful check, for "changed vs original" in the UI
  first_seen_href text,
  first_seen_anchor_text text,
  first_seen_rel text[],
  first_seen_at timestamptz,

  -- scheduling + failure tolerance, so transient fetch problems never read as "removed"
  last_checked_at timestamptz,
  last_ok_at timestamptz,
  next_check_at timestamptz not null default now(),
  consecutive_failures int not null default 0,
  consecutive_missing int not null default 0,
  recent_checks jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tracked_links_product_source_key unique (product_id, source_url)
);

create index tracked_links_due_idx on public.tracked_links (next_check_at);
create index tracked_links_product_status_idx on public.tracked_links (product_id, status);

create table public.tracked_link_events (
  id uuid primary key default gen_random_uuid(),
  tracked_link_id uuid not null references public.tracked_links(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,

  change_type public.tracked_link_change_type not null,
  previous jsonb,
  current jsonb,
  detected_at timestamptz not null default now(),
  notified_at timestamptz
);

create index tracked_link_events_product_detected_idx on public.tracked_link_events (product_id, detected_at desc);
create index tracked_link_events_link_detected_idx on public.tracked_link_events (tracked_link_id, detected_at desc);
create index tracked_link_events_unnotified_idx on public.tracked_link_events (product_id) where notified_at is null;

alter table public.tracked_links enable row level security;
alter table public.tracked_link_events enable row level security;

grant select, insert, update, delete on public.tracked_links to authenticated;
grant select on public.tracked_link_events to authenticated;
grant all on public.tracked_links, public.tracked_link_events to service_role;

create policy "Users can view their own tracked links"
  on public.tracked_links for select
  to authenticated
  using (product_id in (select products.id from public.products where products.user_id = (select auth.uid())));

create policy "Users can create their own tracked links"
  on public.tracked_links for insert
  to authenticated
  with check (product_id in (select products.id from public.products where products.user_id = (select auth.uid())));

create policy "Users can update their own tracked links"
  on public.tracked_links for update
  to authenticated
  using (product_id in (select products.id from public.products where products.user_id = (select auth.uid())))
  with check (product_id in (select products.id from public.products where products.user_id = (select auth.uid())));

create policy "Users can delete their own tracked links"
  on public.tracked_links for delete
  to authenticated
  using (product_id in (select products.id from public.products where products.user_id = (select auth.uid())));

-- Events are written server-side only (supabaseAdmin); no legitimate client write path.
create policy "Users can view their own tracked link events"
  on public.tracked_link_events for select
  to authenticated
  using (product_id in (select products.id from public.products where products.user_id = (select auth.uid())));
