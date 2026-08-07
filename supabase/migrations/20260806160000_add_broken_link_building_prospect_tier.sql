-- New discovery strategy: broken link building. Covers both
-- backlink_prospects.tier and backlink_prospect_runs.strategy, which share
-- this enum.
alter type public.prospect_tier add value if not exists 'broken_link_building';
