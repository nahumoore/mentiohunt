-- Target keywords are now capped at 5 per product and their array order is
-- the priority: index 1 = priority 1 (highest) .. index 5 = priority 5.

update public.products
set target_keywords = target_keywords[1:5]
where array_length(target_keywords, 1) > 5;

alter table public.products
  drop constraint if exists products_target_keywords_max_five;

alter table public.products
  add constraint products_target_keywords_max_five
  check (array_length(target_keywords, 1) is null or array_length(target_keywords, 1) <= 5);
