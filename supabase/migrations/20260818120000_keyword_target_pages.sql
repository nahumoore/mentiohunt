-- Keyword-first target pages: products carry the keywords the user wants to
-- rank for; product_pages records which pages were selected as backlink
-- targets for those keywords, and whether that selection was automatic
-- (re-selectable) or manual (protected from re-selection).

alter table public.products
  add column if not exists target_keywords text[] not null default '{}'::text[];

alter table public.product_pages
  add column if not exists relevance_score smallint,
  add column if not exists matched_keywords text[] not null default '{}'::text[],
  add column if not exists selection_reason text,
  add column if not exists is_target boolean not null default true,
  add column if not exists is_manual boolean not null default false;

-- product_pages_product_id_url_key already exists as a unique index on
-- (product_id, url) — reused as-is for the upsert-on-conflict below.

create index if not exists product_pages_product_target_idx
  on public.product_pages (product_id, is_target) where is_target;
