alter table public.discovery_candidates
  add column terminal_reason text;

alter table public.discovery_candidates
  add constraint discovery_candidates_attempt_count_check
    check (attempt_count >= 0);

comment on column public.discovery_candidates.terminal_reason is
  'Final disposition for a processed duplicate or a candidate discarded after its retry limit.';

create index discovery_candidates_claim_idx
  on public.discovery_candidates (
    product_id,
    source,
    priority_score desc,
    discovered_at,
    id
  )
  include (domain, attempt_count, next_attempt_at)
  where state in ('pending', 'retry');

create index discovery_candidates_processing_domain_idx
  on public.discovery_candidates (
    product_id,
    source,
    regexp_replace(lower(btrim(domain)), '^www\.', '')
  )
  where state = 'processing';

create index backlink_prospects_product_normalized_domain_idx
  on public.backlink_prospects (
    product_id,
    regexp_replace(lower(btrim(domain)), '^www\.', '')
  )
  where domain is not null;

create or replace function public.store_discovery_candidates(
  p_product_id uuid,
  p_source public.prospect_tier,
  p_candidates jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_affected integer := 0;
  v_terminal_refreshed integer := 0;
begin
  if p_product_id is null then
    raise exception 'discovery candidate product is required';
  end if;
  if p_source is null or p_source not in (
    'listicle_roundup'::public.prospect_tier,
    'resource_page_inclusion'::public.prospect_tier,
    'unlinked_mention'::public.prospect_tier
  ) then
    raise exception 'unsupported discovery candidate source: %', p_source;
  end if;

  if jsonb_typeof(coalesce(p_candidates, '[]'::jsonb)) <> 'array' then
    raise exception 'discovery candidates must be a JSON array';
  end if;

  with candidate_input as (
    select *
    from jsonb_to_recordset(coalesce(p_candidates, '[]'::jsonb)) as input (
      candidate_key text,
      url text,
      domain text,
      title text,
      snippet text,
      query text,
      target_page_id uuid,
      target_url text,
      priority_score numeric,
      metadata jsonb,
      last_seen_at timestamptz
    )
    where nullif(btrim(candidate_key), '') is not null
      and nullif(btrim(url), '') is not null
      and nullif(btrim(domain), '') is not null
  ), upserted as (
    insert into public.discovery_candidates as existing (
      product_id,
      source,
      candidate_key,
      url,
      domain,
      title,
      snippet,
      query,
      target_page_id,
      target_url,
      priority_score,
      metadata,
      last_seen_at
    )
    select
      p_product_id,
      p_source,
      candidate_key,
      url,
      domain,
      coalesce(title, ''),
      coalesce(snippet, ''),
      query,
      target_page_id,
      target_url,
      coalesce(priority_score, 0),
      coalesce(metadata, '{}'::jsonb),
      coalesce(last_seen_at, now())
    from candidate_input
    on conflict (product_id, source, candidate_key) do update
    set url = excluded.url,
        domain = excluded.domain,
        title = excluded.title,
        snippet = excluded.snippet,
        query = excluded.query,
        target_page_id = excluded.target_page_id,
        target_url = excluded.target_url,
        priority_score = excluded.priority_score,
        metadata = existing.metadata || excluded.metadata,
        last_seen_at = greatest(existing.last_seen_at, excluded.last_seen_at)
    returning state
  )
  select count(*)::integer,
    count(*) filter (where state in ('processed', 'discarded'))::integer
  into v_affected, v_terminal_refreshed
  from upserted;

  return jsonb_build_object(
    'affected_count', v_affected,
    'terminal_refreshed_count', v_terminal_refreshed
  );
end;
$$;

create or replace function public.claim_discovery_candidates(
  p_product_id uuid,
  p_source public.prospect_tier,
  p_limit integer,
  p_max_attempts integer default 5,
  p_stale_after_seconds integer default 21600
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_candidate public.discovery_candidates%rowtype;
  v_claimed_domains text[] := array[]::text[];
  v_candidates jsonb := '[]'::jsonb;
  v_domain_key text;
  v_existing_duplicates integer := 0;
  v_concurrent_duplicates integer := 0;
  v_invalid_discarded integer := 0;
  v_limit_discarded integer := 0;
  v_stale_retried integer := 0;
  v_stale_discarded integer := 0;
  v_retry_claims integer := 0;
  v_oldest_claimed_at timestamptz;
begin
  if p_product_id is null then
    raise exception 'discovery candidate product is required';
  end if;
  if p_source is null or p_source not in (
    'listicle_roundup'::public.prospect_tier,
    'resource_page_inclusion'::public.prospect_tier,
    'unlinked_mention'::public.prospect_tier
  ) then
    raise exception 'unsupported discovery candidate source: %', p_source;
  end if;
  if p_limit is null or p_limit < 0 or p_limit > 200 then
    raise exception 'candidate claim limit must be between 0 and 200';
  end if;
  if p_max_attempts is null or p_max_attempts < 1 or p_max_attempts > 20 then
    raise exception 'candidate maximum attempts must be between 1 and 20';
  end if;
  if p_stale_after_seconds is null or p_stale_after_seconds < 60 then
    raise exception 'candidate stale timeout must be at least 60 seconds';
  end if;

  with recovered as (
    update public.discovery_candidates
    set state = case when attempt_count >= p_max_attempts then 'discarded' else 'retry' end,
        claimed_at = null,
        next_attempt_at = case when attempt_count >= p_max_attempts then null else now() end,
        processed_at = case when attempt_count >= p_max_attempts then now() else null end,
        last_error = 'stale_processing_claim',
        terminal_reason = case
          when attempt_count >= p_max_attempts then 'stale_processing_claim'
          else null
        end
    where product_id = p_product_id
      and source = p_source
      and state = 'processing'
      and claimed_at <= now() - make_interval(secs => p_stale_after_seconds)
    returning state
  )
  select count(*) filter (where state = 'retry')::integer,
    count(*) filter (where state = 'discarded')::integer
  into v_stale_retried, v_stale_discarded
  from recovered;

  with discarded as (
    update public.discovery_candidates
    set state = 'discarded',
        claimed_at = null,
        next_attempt_at = null,
        processed_at = now(),
        terminal_reason = coalesce(last_error, 'maximum_attempts_exhausted')
    where product_id = p_product_id
      and source = p_source
      and state in ('pending', 'retry')
      and attempt_count >= p_max_attempts
    returning 1
  )
  select count(*)::integer into v_limit_discarded from discarded;

  with discarded as (
    update public.discovery_candidates
    set state = 'discarded',
        claimed_at = null,
        next_attempt_at = null,
        processed_at = now(),
        last_error = 'invalid_candidate_domain',
        terminal_reason = 'invalid_candidate_domain'
    where product_id = p_product_id
      and source = p_source
      and state in ('pending', 'retry')
      and nullif(btrim(domain), '') is null
    returning 1
  )
  select count(*)::integer into v_invalid_discarded from discarded;

  with duplicates as (
    update public.discovery_candidates candidate
    set state = 'processed',
        claimed_at = null,
        next_attempt_at = null,
        processed_at = now(),
        last_error = 'duplicate_existing_prospect',
        terminal_reason = 'duplicate_existing_prospect'
    where candidate.product_id = p_product_id
      and candidate.source = p_source
      and candidate.state in ('pending', 'retry')
      and exists (
        select 1
        from public.backlink_prospects prospect
        where prospect.product_id = p_product_id
          and prospect.domain is not null
          and regexp_replace(lower(btrim(prospect.domain)), '^www\.', '') =
            regexp_replace(lower(btrim(candidate.domain)), '^www\.', '')
      )
    returning 1
  )
  select count(*)::integer into v_existing_duplicates from duplicates;

  while jsonb_array_length(v_candidates) < p_limit loop
    select candidate.*
    into v_candidate
    from public.discovery_candidates candidate
    where candidate.product_id = p_product_id
      and candidate.source = p_source
      and candidate.state in ('pending', 'retry')
      and (candidate.next_attempt_at is null or candidate.next_attempt_at <= now())
      and candidate.attempt_count < p_max_attempts
      and nullif(btrim(candidate.domain), '') is not null
      and not (
        regexp_replace(lower(btrim(candidate.domain)), '^www\.', '') = any(v_claimed_domains)
      )
      and not exists (
        select 1
        from public.backlink_prospects prospect
        where prospect.product_id = p_product_id
          and prospect.domain is not null
          and regexp_replace(lower(btrim(prospect.domain)), '^www\.', '') =
            regexp_replace(lower(btrim(candidate.domain)), '^www\.', '')
      )
      and not exists (
        select 1
        from public.discovery_candidates processing
        where processing.product_id = p_product_id
          and processing.source = p_source
          and processing.state = 'processing'
          and regexp_replace(lower(btrim(processing.domain)), '^www\.', '') =
            regexp_replace(lower(btrim(candidate.domain)), '^www\.', '')
      )
    order by candidate.priority_score desc, candidate.discovered_at, candidate.id
    for update of candidate skip locked
    limit 1;

    exit when not found;

    v_domain_key := regexp_replace(lower(btrim(v_candidate.domain)), '^www\.', '');
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(p_product_id::text || ':' || p_source::text || ':' || v_domain_key, 0)
    );

    if exists (
      select 1
      from public.backlink_prospects prospect
      where prospect.product_id = p_product_id
        and prospect.domain is not null
        and regexp_replace(lower(btrim(prospect.domain)), '^www\.', '') = v_domain_key
    ) or exists (
      select 1
      from public.discovery_candidates processing
      where processing.product_id = p_product_id
        and processing.source = p_source
        and processing.state = 'processing'
        and processing.id <> v_candidate.id
        and regexp_replace(lower(btrim(processing.domain)), '^www\.', '') = v_domain_key
    ) then
      update public.discovery_candidates
      set state = 'processed',
          claimed_at = null,
          next_attempt_at = null,
          processed_at = now(),
          last_error = 'duplicate_concurrent_domain_claim',
          terminal_reason = 'duplicate_concurrent_domain_claim'
      where id = v_candidate.id;
      v_concurrent_duplicates := v_concurrent_duplicates + 1;
      continue;
    end if;

    update public.discovery_candidates
    set state = 'processing',
        claimed_at = now(),
        attempt_count = attempt_count + 1,
        next_attempt_at = null,
        processed_at = null,
        last_error = null,
        terminal_reason = null
    where id = v_candidate.id
    returning * into v_candidate;

    v_claimed_domains := array_append(v_claimed_domains, v_domain_key);
    if v_candidate.attempt_count > 1 then
      v_retry_claims := v_retry_claims + 1;
    end if;
    v_oldest_claimed_at := least(
      coalesce(v_oldest_claimed_at, v_candidate.discovered_at),
      v_candidate.discovered_at
    );
    v_candidates := v_candidates || jsonb_build_array(jsonb_build_object(
      'id', v_candidate.id,
      'candidate_key', v_candidate.candidate_key,
      'url', v_candidate.url,
      'domain', v_candidate.domain,
      'title', v_candidate.title,
      'snippet', v_candidate.snippet,
      'query', v_candidate.query,
      'target_page_id', v_candidate.target_page_id,
      'target_url', v_candidate.target_url,
      'priority_score', v_candidate.priority_score,
      'attempt_count', v_candidate.attempt_count,
      'metadata', v_candidate.metadata,
      'discovered_at', v_candidate.discovered_at
    ));
  end loop;

  return jsonb_build_object(
    'candidates', v_candidates,
    'metrics', jsonb_build_object(
      'claimed_count', jsonb_array_length(v_candidates),
      'retry_claim_count', v_retry_claims,
      'existing_prospect_duplicates_processed', v_existing_duplicates,
      'concurrent_domain_duplicates_processed', v_concurrent_duplicates,
      'invalid_candidates_discarded', v_invalid_discarded,
      'attempt_limit_discarded', v_limit_discarded + v_stale_discarded,
      'stale_claims_retried', v_stale_retried,
      'oldest_claimed_age_seconds', case
        when v_oldest_claimed_at is null then null
        else greatest(0, extract(epoch from (now() - v_oldest_claimed_at))::bigint)
      end
    )
  );
end;
$$;

create or replace function public.complete_discovery_candidates(p_ids uuid[])
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_completed integer := 0;
  v_duplicates integer := 0;
begin
  if coalesce(array_length(p_ids, 1), 0) = 0 then
    return jsonb_build_object('completed_count', 0, 'duplicate_count', 0);
  end if;

  with roots as materialized (
    select distinct
      candidate.product_id,
      candidate.source,
      regexp_replace(lower(btrim(candidate.domain)), '^www\.', '') as domain_key
    from public.discovery_candidates candidate
    where candidate.id = any(p_ids)
      and candidate.state = 'processing'
  ), completed as (
    update public.discovery_candidates candidate
    set state = 'processed',
        claimed_at = null,
        next_attempt_at = null,
        processed_at = now(),
        last_error = case
          when candidate.id = any(p_ids) then null
          else 'duplicate_candidate_domain'
        end,
        terminal_reason = case
          when candidate.id = any(p_ids) then null
          else 'duplicate_candidate_domain'
        end
    where (
        (candidate.id = any(p_ids) and candidate.state = 'processing')
        or (
          not (candidate.id = any(p_ids))
          and candidate.state in ('pending', 'retry')
        )
      )
      and exists (
        select 1
        from roots
        where roots.product_id = candidate.product_id
          and roots.source = candidate.source
          and roots.domain_key = regexp_replace(lower(btrim(candidate.domain)), '^www\.', '')
      )
    returning candidate.id = any(p_ids) as requested
  )
  select count(*) filter (where requested)::integer,
    count(*) filter (where not requested)::integer
  into v_completed, v_duplicates
  from completed;

  return jsonb_build_object(
    'completed_count', v_completed,
    'duplicate_count', v_duplicates
  );
end;
$$;

create or replace function public.retry_discovery_candidates(
  p_ids uuid[],
  p_reason text,
  p_max_attempts integer default 5
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_retried integer := 0;
  v_discarded integer := 0;
  v_ignored integer := 0;
  v_next_attempt_at timestamptz;
begin
  if p_max_attempts is null or p_max_attempts < 1 or p_max_attempts > 20 then
    raise exception 'candidate maximum attempts must be between 1 and 20';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise exception 'candidate retry reason is required';
  end if;
  if coalesce(array_length(p_ids, 1), 0) = 0 then
    return jsonb_build_object(
      'retried_count', 0,
      'discarded_count', 0,
      'ignored_count', 0,
      'next_attempt_at', null
    );
  end if;

  with changed as (
    update public.discovery_candidates
    set state = case when attempt_count >= p_max_attempts then 'discarded' else 'retry' end,
        claimed_at = null,
        next_attempt_at = case
          when attempt_count >= p_max_attempts then null
          else now() + make_interval(secs => case
            when attempt_count <= 1 then 15 * 60
            when attempt_count = 2 then 2 * 60 * 60
            when attempt_count = 3 then 12 * 60 * 60
            else 24 * 60 * 60
          end)
        end,
        processed_at = case when attempt_count >= p_max_attempts then now() else null end,
        last_error = left(p_reason, 500),
        terminal_reason = case
          when attempt_count >= p_max_attempts then left(p_reason, 500)
          else null
        end
    where id = any(p_ids)
      and state = 'processing'
    returning state, next_attempt_at
  )
  select count(*) filter (where state = 'retry')::integer,
    count(*) filter (where state = 'discarded')::integer,
    min(next_attempt_at)
  into v_retried, v_discarded, v_next_attempt_at
  from changed;

  v_ignored := greatest(0, cardinality(p_ids) - v_retried - v_discarded);

  return jsonb_build_object(
    'retried_count', v_retried,
    'discarded_count', v_discarded,
    'ignored_count', v_ignored,
    'next_attempt_at', v_next_attempt_at
  );
end;
$$;

revoke all on table public.discovery_candidates from public, anon, authenticated;
revoke all on function public.store_discovery_candidates(uuid, public.prospect_tier, jsonb)
  from public, anon, authenticated;
revoke all on function public.claim_discovery_candidates(uuid, public.prospect_tier, integer, integer, integer)
  from public, anon, authenticated;
revoke all on function public.complete_discovery_candidates(uuid[])
  from public, anon, authenticated;
revoke all on function public.retry_discovery_candidates(uuid[], text, integer)
  from public, anon, authenticated;

grant execute on function public.store_discovery_candidates(uuid, public.prospect_tier, jsonb)
  to service_role;
grant execute on function public.claim_discovery_candidates(uuid, public.prospect_tier, integer, integer, integer)
  to service_role;
grant execute on function public.complete_discovery_candidates(uuid[])
  to service_role;
grant execute on function public.retry_discovery_candidates(uuid[], text, integer)
  to service_role;

comment on function public.claim_discovery_candidates(uuid, public.prospect_tier, integer, integer, integer) is
  'Atomically claims a bounded unique-domain backlog batch using row locks, SKIP LOCKED, and per-domain advisory locks.';
comment on function public.retry_discovery_candidates(uuid[], text, integer) is
  'Applies staged retry delays and terminally discards candidates at the explicit attempt limit.';
