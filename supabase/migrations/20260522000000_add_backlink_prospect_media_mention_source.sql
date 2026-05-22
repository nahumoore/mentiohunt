-- Add new media_mention_source enum values
-- Note: old values (email_inbox, twitter) can't be removed from a PG enum without
-- recreating the type; they remain but are no longer accepted by the ingest route.
alter type public.media_mention_source add value if not exists 'journofinder';
alter type public.media_mention_source add value if not exists 'qwoted';
alter type public.media_mention_source add value if not exists 'featured';
alter type public.media_mention_source add value if not exists 'email';
alter type public.media_mention_source add value if not exists 'unknown';

-- Add new columns to media_mentions
alter table public.media_mentions add column if not exists deadline date;
alter table public.media_mentions add column if not exists raw_text text;
alter table public.media_mentions add column if not exists raw_body text;

-- Drop removed columns (CASCADE drops the (source, source_ref) unique index)
alter table public.media_mentions drop column if exists source_ref cascade;
alter table public.media_mentions drop column if exists metadata cascade;

-- Dedup by url (PostgreSQL UNIQUE allows multiple NULLs)
alter table public.media_mentions add constraint media_mentions_url_key unique (url);

-- FK column on backlink_prospects for tracing back to source media mention
alter table public.backlink_prospects
  add column if not exists source_media_mention_id uuid
    references public.media_mentions(id) on delete set null;

create unique index if not exists backlink_prospects_product_media_mention_uniq
  on public.backlink_prospects (product_id, source_media_mention_id)
  where source_media_mention_id is not null;
