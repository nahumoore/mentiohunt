-- Records when a prospect was marked "won", so the dashboard can show a
-- date on the shareable win card and order wins to compute the running
-- count/DR total. Nullable: existing won rows predate this column and have
-- no recorded win date.
alter table "public"."backlink_prospects"
  add column "won_at" timestamptz;
