-- Add discovery_status column to track per-engine onboarding progress
alter table backlink_prospects_settings
  add column if not exists discovery_status jsonb;

-- Atomic merge function: prevents race conditions when 4 engines update concurrently
create or replace function public.merge_discovery_status(
  p_product_id uuid,
  p_updates jsonb
) returns void
language sql
security definer
as $$
  update backlink_prospects_settings
  set discovery_status = coalesce(discovery_status, '{}'::jsonb) || p_updates
  where product_id = p_product_id;
$$;

-- Enable Realtime publication for live client updates
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'backlink_prospects_settings'
  ) then
    alter publication supabase_realtime add table backlink_prospects_settings;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'backlink_prospects'
  ) then
    alter publication supabase_realtime add table backlink_prospects;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'directory_submissions'
  ) then
    alter publication supabase_realtime add table directory_submissions;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'reply_queue_items'
  ) then
    alter publication supabase_realtime add table reply_queue_items;
  end if;
end $$;

-- Enable RLS on tables that need it for client-side reads
alter table backlink_prospects_settings enable row level security;
alter table backlink_prospects enable row level security;
alter table directory_submissions enable row level security;
alter table reply_queue_items enable row level security;

-- backlink_prospects_settings: full CRUD for owner (web app writes on onboarding)
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'backlink_prospects_settings' and policyname = 'Users can manage their own settings'
  ) then
    create policy "Users can manage their own settings"
      on backlink_prospects_settings for all
      using ((select user_id from products where id = product_id) = auth.uid())
      with check ((select user_id from products where id = product_id) = auth.uid());
  end if;
end $$;

-- backlink_prospects: SELECT only (all writes go through supabaseAdmin)
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'backlink_prospects' and policyname = 'Users can view their own prospects'
  ) then
    create policy "Users can view their own prospects"
      on backlink_prospects for select
      using ((select user_id from products where id = product_id) = auth.uid());
  end if;
end $$;

-- directory_submissions: SELECT only
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'directory_submissions' and policyname = 'Users can view their own directory submissions'
  ) then
    create policy "Users can view their own directory submissions"
      on directory_submissions for select
      using ((select user_id from products where id = product_id) = auth.uid());
  end if;
end $$;

-- reply_queue_items: SELECT only (user_id column available directly)
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'reply_queue_items' and policyname = 'Users can view their own reply queue items'
  ) then
    create policy "Users can view their own reply queue items"
      on reply_queue_items for select
      using (user_id = auth.uid());
  end if;
end $$;
