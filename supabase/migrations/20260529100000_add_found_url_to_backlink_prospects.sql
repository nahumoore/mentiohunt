alter table backlink_prospects
  add column if not exists found_url text;
