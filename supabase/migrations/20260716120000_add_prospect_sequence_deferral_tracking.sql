alter table public.prospect_sequences
  add column if not exists last_deferred_at timestamptz;

create index if not exists prospect_sequences_last_deferred_idx
  on public.prospect_sequences (last_deferred_at)
  where status = 'pending' and last_deferred_at is not null;
