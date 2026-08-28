alter table public.backlink_prospects_settings
  alter column adaptive_discovery_enabled set default true,
  alter column daily_discovery_target set default 25,
  alter column daily_discovery_candidate_cap set default 40,
  add column daily_discovery_attempt_cap integer not null default 80
    check (daily_discovery_attempt_cap between 1 and 200);

comment on column public.backlink_prospects_settings.daily_discovery_attempt_cap is
  'Hard daily cap on candidates entering contact enrichment across all scheduler invocations.';

create table public.daily_discovery_summaries (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  quota_date date not null,
  target_count integer not null check (target_count between 1 and 100),
  ready_count_at_start integer not null default 0 check (ready_count_at_start >= 0),
  ready_count integer not null default 0 check (ready_count >= 0),
  ready_added integer not null default 0 check (ready_added >= 0),
  enrichment_attempts integer not null default 0 check (enrichment_attempts >= 0),
  inserted_not_ready_count integer not null default 0 check (inserted_not_ready_count >= 0),
  total_cost_usd numeric(10, 4) not null default 0 check (total_cost_usd >= 0),
  strategy_funnels jsonb not null default '[]'::jsonb,
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed')),
  stop_reason text,
  configuration_reason text,
  invocation_count integer not null default 1 check (invocation_count > 0),
  lock_token uuid,
  locked_at timestamptz,
  started_at timestamptz not null default now(),
  last_started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  last_error text,
  unique (product_id, quota_date)
);

create index daily_discovery_summaries_date_idx
  on public.daily_discovery_summaries (quota_date desc, status);

alter table public.daily_discovery_summaries enable row level security;
revoke all on table public.daily_discovery_summaries from public, anon, authenticated;

comment on table public.daily_discovery_summaries is
  'Internal UTC product-day quota accounting, execution lock, funnels, and terminal reason.';

create or replace function public.count_daily_send_ready_opportunities(
  p_product_id uuid,
  p_quota_date date
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct regexp_replace(lower(bp.domain), '^www\.', ''))::integer
  from public.backlink_prospects bp
  where bp.product_id = p_product_id
    and bp.discovered_at >= (p_quota_date::timestamp at time zone 'UTC')
    and bp.discovered_at < ((p_quota_date + 1)::timestamp at time zone 'UTC')
    and bp.tier <> 'user_submitted'::public.prospect_tier
    and bp.domain is not null
    and nullif(btrim(bp.domain), '') is not null
    and bp.enrichment_status = 'ready'::public.prospect_enrichment_status
    and nullif(btrim(bp.contact_email), '') is not null
    and nullif(btrim(bp.email_subject), '') is not null
    and nullif(btrim(bp.email_body), '') is not null
    and exists (
      select 1
      from public.prospect_sequences ps
      where ps.prospect_id = bp.id
        and ps.step = 1
        and nullif(btrim(ps.subject), '') is not null
        and nullif(btrim(ps.body), '') is not null
    );
$$;

create or replace function public.claim_daily_discovery_execution(
  p_product_id uuid,
  p_quota_date date,
  p_target_count integer,
  p_stale_after_seconds integer default 7200
)
returns table (
  summary_id uuid,
  execution_token uuid,
  claimed boolean,
  ready_count integer,
  enrichment_attempts integer,
  total_cost_usd numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_summary public.daily_discovery_summaries%rowtype;
  v_ready_count integer;
  v_token uuid := gen_random_uuid();
begin
  if p_target_count < 1 or p_target_count > 100 then
    raise exception 'daily discovery target is out of range';
  end if;

  v_ready_count := public.count_daily_send_ready_opportunities(p_product_id, p_quota_date);

  insert into public.daily_discovery_summaries (
    product_id,
    quota_date,
    target_count,
    ready_count_at_start,
    ready_count,
    status,
    lock_token,
    locked_at
  ) values (
    p_product_id,
    p_quota_date,
    p_target_count,
    v_ready_count,
    v_ready_count,
    'running',
    v_token,
    now()
  )
  on conflict (product_id, quota_date) do nothing;

  select * into v_summary
  from public.daily_discovery_summaries
  where product_id = p_product_id and quota_date = p_quota_date
  for update;

  if v_summary.lock_token = v_token then
    return query select v_summary.id, v_token, true, v_ready_count,
      v_summary.enrichment_attempts, v_summary.total_cost_usd;
    return;
  end if;

  if v_summary.status = 'running'
    and v_summary.locked_at > now() - make_interval(secs => greatest(60, p_stale_after_seconds)) then
    return query select v_summary.id, null::uuid, false, v_ready_count,
      v_summary.enrichment_attempts, v_summary.total_cost_usd;
    return;
  end if;

  update public.daily_discovery_summaries
  set target_count = p_target_count,
      ready_count = v_ready_count,
      status = 'running',
      stop_reason = null,
      configuration_reason = null,
      invocation_count = invocation_count + 1,
      lock_token = v_token,
      locked_at = now(),
      last_started_at = now(),
      completed_at = null,
      updated_at = now(),
      last_error = null
  where id = v_summary.id
  returning * into v_summary;

  return query select v_summary.id, v_token, true, v_ready_count,
    v_summary.enrichment_attempts, v_summary.total_cost_usd;
end;
$$;

create or replace function public.finish_daily_discovery_execution(
  p_summary_id uuid,
  p_execution_token uuid,
  p_ready_count integer,
  p_enrichment_attempts integer,
  p_inserted_not_ready_count integer,
  p_cost_usd numeric,
  p_strategy_funnels jsonb,
  p_stop_reason text,
  p_configuration_reason text default null,
  p_last_error text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  update public.daily_discovery_summaries
  set ready_count = greatest(0, p_ready_count),
      ready_added = greatest(0, p_ready_count - ready_count_at_start),
      enrichment_attempts = enrichment_attempts + greatest(0, p_enrichment_attempts),
      inserted_not_ready_count = inserted_not_ready_count + greatest(0, p_inserted_not_ready_count),
      total_cost_usd = total_cost_usd + greatest(0, p_cost_usd),
      strategy_funnels = strategy_funnels || coalesce(p_strategy_funnels, '[]'::jsonb),
      status = case when p_last_error is null then 'completed' else 'failed' end,
      stop_reason = p_stop_reason,
      configuration_reason = p_configuration_reason,
      last_error = p_last_error,
      lock_token = null,
      locked_at = null,
      completed_at = now(),
      updated_at = now()
  where id = p_summary_id
    and lock_token = p_execution_token
    and status = 'running';

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

revoke all on function public.count_daily_send_ready_opportunities(uuid, date) from public, anon, authenticated;
revoke all on function public.claim_daily_discovery_execution(uuid, date, integer, integer) from public, anon, authenticated;
revoke all on function public.finish_daily_discovery_execution(uuid, uuid, integer, integer, integer, numeric, jsonb, text, text, text) from public, anon, authenticated;

grant execute on function public.count_daily_send_ready_opportunities(uuid, date) to service_role;
grant execute on function public.claim_daily_discovery_execution(uuid, date, integer, integer) to service_role;
grant execute on function public.finish_daily_discovery_execution(uuid, uuid, integer, integer, integer, numeric, jsonb, text, text, text) to service_role;
