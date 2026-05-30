alter table backlink_prospects
  add column if not exists raw_post_text text;
