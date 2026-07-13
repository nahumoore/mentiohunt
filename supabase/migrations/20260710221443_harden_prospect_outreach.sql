alter table public.prospect_messages
  add constraint prospect_messages_classification_confidence_range
  check (classification_confidence is null or classification_confidence between 0 and 1) not valid;

alter table public.prospect_messages
  validate constraint prospect_messages_classification_confidence_range;

create index if not exists prospect_sequences_previous_step_idx
  on public.prospect_sequences (prospect_id, step, status);

create or replace function public.claim_prospect_outreach_sequence(
  p_sequence_id uuid,
  p_spacing_seconds integer default 300
)
returns setof public.prospect_sequences
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_sequence public.prospect_sequences%rowtype;
  v_cap integer;
  v_sent_or_reserved integer;
begin
  select sequence_row.*
    into v_sequence
    from public.prospect_sequences sequence_row
    where sequence_row.id = p_sequence_id
    for update;

  if not found or v_sequence.status <> 'pending' or v_sequence.scheduled_at > now() then
    return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_sequence.email_account_id::text, 0));

  select account.daily_send_cap
    into v_cap
    from public.email_accounts account
    where account.id = v_sequence.email_account_id
      and account.status = 'active';

  if not found then
    return;
  end if;

  if exists (
    select 1
    from public.prospect_sequences previous
    where previous.prospect_id = v_sequence.prospect_id
      and previous.step < v_sequence.step
      and previous.status <> 'sent'
  ) then
    return;
  end if;

  if exists (
    select 1
    from public.prospect_sequences recent
    where recent.email_account_id = v_sequence.email_account_id
      and recent.last_attempt_at >= now() - make_interval(secs => greatest(p_spacing_seconds, 0))
      and recent.id <> v_sequence.id
  ) then
    return;
  end if;

  select count(*)
    into v_sent_or_reserved
    from public.prospect_sequences reserved
    where reserved.email_account_id = v_sequence.email_account_id
      and (
        (reserved.status = 'sent' and reserved.sent_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc')
        or
        (reserved.status = 'sending' and reserved.last_attempt_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc')
      );

  if v_sent_or_reserved >= v_cap then
    return;
  end if;

  update public.prospect_sequences
  set status = 'sending',
      locked_at = now(),
      last_attempt_at = now(),
      attempt_count = attempt_count + 1
  where id = v_sequence.id
  returning * into v_sequence;

  return next v_sequence;
end;
$$;

revoke all on function public.claim_prospect_outreach_sequence(uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_prospect_outreach_sequence(uuid, integer) to service_role;

create or replace function public.stop_prospect_outreach(
  p_prospect_id uuid,
  p_sequence_id uuid,
  p_email_account_id uuid,
  p_recipient_email text,
  p_reason text,
  p_event_type text,
  p_prospect_status public.prospect_status default null,
  p_suppress boolean default false,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_email text := lower(trim(p_recipient_email));
begin
  update public.backlink_prospects
  set outreach_stopped_at = v_now,
      outreach_stopped_reason = p_reason,
      status = case
        when p_prospect_status is null then status
        when status in ('new', 'contacted', 'negotiating', 'email_not_found') then p_prospect_status
        else status
      end
  where id = p_prospect_id;

  if not found then
    raise exception 'Prospect % not found', p_prospect_id;
  end if;

  update public.prospect_sequences
  set status = 'skipped',
      locked_at = null,
      last_error = 'Sequence stopped: ' || p_reason || '.'
  where prospect_id = p_prospect_id
    and status in ('pending', 'sending');

  if p_suppress and v_email <> '' then
    insert into public.email_suppressions (
      email, reason, source_prospect_id, source_sequence_id, metadata
    ) values (
      v_email, p_reason, p_prospect_id, p_sequence_id, p_metadata
    ) on conflict ((lower(email))) do nothing;
  end if;

  insert into public.outreach_events (
    prospect_id, sequence_id, email_account_id, event_type, recipient_email, metadata
  ) values (
    p_prospect_id,
    p_sequence_id,
    p_email_account_id,
    p_event_type,
    v_email,
    jsonb_build_object('reason', p_reason) || coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.stop_prospect_outreach(uuid, uuid, uuid, text, text, text, public.prospect_status, boolean, jsonb) from public, anon, authenticated;
grant execute on function public.stop_prospect_outreach(uuid, uuid, uuid, text, text, text, public.prospect_status, boolean, jsonb) to service_role;
