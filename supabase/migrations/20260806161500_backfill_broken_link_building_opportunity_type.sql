-- Existing products' backlink_prospects_settings.opportunity_types arrays
-- were written before broken_link_building existed. The rotation job only
-- falls back to the full default list when a product has NO settings row
-- (jobs/daily-backlink-discovery.ts), so without this backfill every
-- existing product would silently never get the new strategy until a
-- customer happens to re-save their discovery settings. Runtime is safe to
-- enable it for everyone unconditionally — isRunnable already no-ops for
-- products without competitors or crawled pages.
update public.backlink_prospects_settings
set opportunity_types = array_append(opportunity_types, 'broken_link_building'::prospect_tier)
where not ('broken_link_building'::prospect_tier = any(opportunity_types));
