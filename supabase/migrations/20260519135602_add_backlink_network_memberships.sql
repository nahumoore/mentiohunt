create table public.backlink_network_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  is_enabled boolean not null default false,
  contact_email text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint backlink_network_memberships_product_id_key unique (product_id),
  constraint backlink_network_memberships_contact_email_required check (
    is_enabled = false or nullif(trim(contact_email), '') is not null
  ),
  constraint backlink_network_memberships_contact_email_format check (
    contact_email is null
    or nullif(trim(contact_email), '') is null
    or contact_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  )
);

create index backlink_network_memberships_user_id_idx
  on public.backlink_network_memberships using btree (user_id);

alter table public.backlink_network_memberships enable row level security;

grant select, insert, update on public.backlink_network_memberships to authenticated;
grant all on public.backlink_network_memberships to service_role;

create policy "Users can view their own backlink network membership."
on public.backlink_network_memberships
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own backlink network membership."
on public.backlink_network_memberships
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.products
    where products.id = backlink_network_memberships.product_id
      and products.user_id = (select auth.uid())
  )
);

create policy "Users can update their own backlink network membership."
on public.backlink_network_memberships
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.products
    where products.id = backlink_network_memberships.product_id
      and products.user_id = (select auth.uid())
  )
);
