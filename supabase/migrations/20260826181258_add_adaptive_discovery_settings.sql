alter table public.backlink_prospects_settings
  add column adaptive_discovery_enabled boolean not null default false,
  add column daily_discovery_target integer not null default 10,
  add column daily_discovery_candidate_cap integer not null default 15,
  add column daily_discovery_cost_cap_usd numeric(8, 4) not null default 0.7000;

alter table public.backlink_prospects_settings
  add constraint backlink_prospects_settings_daily_discovery_target_check
    check (daily_discovery_target between 1 and 100),
  add constraint backlink_prospects_settings_daily_discovery_candidate_cap_check
    check (daily_discovery_candidate_cap between daily_discovery_target and 200),
  add constraint backlink_prospects_settings_daily_discovery_cost_cap_check
    check (daily_discovery_cost_cap_usd > 0 and daily_discovery_cost_cap_usd <= 100);

comment on column public.backlink_prospects_settings.adaptive_discovery_enabled is
  'Product-level rollout flag for target-filling daily discovery.';
comment on column public.backlink_prospects_settings.daily_discovery_target is
  'Number of newly send-ready opportunities the adaptive daily scheduler aims to create.';
comment on column public.backlink_prospects_settings.daily_discovery_candidate_cap is
  'Maximum candidates that may enter contact enrichment during one adaptive daily run.';
comment on column public.backlink_prospects_settings.daily_discovery_cost_cap_usd is
  'Metered discovery cost cap; enforced between discovery sources.';

create table public.discovery_candidates (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  source public.prospect_tier not null,
  candidate_key text not null,
  url text not null,
  domain text not null,
  title text not null default '',
  snippet text not null default '',
  query text,
  target_page_id uuid references public.product_pages(id) on delete set null,
  target_url text,
  priority_score numeric(10, 4) not null default 0,
  state text not null default 'pending'
    check (state in ('pending', 'processing', 'retry', 'processed', 'discarded')),
  claimed_at timestamptz,
  attempt_count integer not null default 0,
  next_attempt_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  discovered_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (product_id, source, candidate_key)
);

create index discovery_candidates_queue_idx
  on public.discovery_candidates (product_id, source, state, next_attempt_at, priority_score desc);

alter table public.discovery_candidates enable row level security;
revoke all on table public.discovery_candidates from anon, authenticated;

comment on table public.discovery_candidates is
  'Internal persistent queue of SERP candidates awaiting fetch, scoring, or retry.';
