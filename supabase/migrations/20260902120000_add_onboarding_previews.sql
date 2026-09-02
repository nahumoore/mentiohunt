alter table public.profiles
  alter column billing_period_start_at drop not null,
  alter column billing_period_end_at drop not null,
  add column trial_ending_reminder_sent_at timestamptz;

update public.profiles
set
  active_trial = false,
  billing_period_start_at = null,
  billing_period_end_at = null
where onboarding_completed = false
  and tier = 'free'
  and stripe_customer_id is null;

create table public.onboarding_previews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  website_domain text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'ready', 'partial', 'failed')),
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  results_email_sent_at timestamptz,
  results_email_clicked_at timestamptz,
  viewed_at timestamptz,
  checkout_started_at timestamptz,
  activation_requested_at timestamptz,
  result_count integer not null default 0 check (result_count >= 0),
  result_ids uuid[] not null default '{}',
  sample_prospect_id uuid references public.backlink_prospects(id) on delete set null,
  cost_usd numeric not null default 0 check (cost_usd >= 0),
  failure_reason text,
  updated_at timestamptz not null default now(),
  unique (product_id),
  unique (user_id, website_domain)
);

create index onboarding_previews_user_requested_idx
  on public.onboarding_previews (user_id, requested_at desc);

alter table public.onboarding_previews enable row level security;

create policy "Users can read their own onboarding previews"
  on public.onboarding_previews
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on table public.onboarding_previews is
  'Durable lifecycle for the no-card personalized onboarding preview.';

comment on column public.onboarding_previews.result_ids is
  'The bounded set of prospects exposed in the preview; not sender eligibility.';
