-- Turns on target-filling adaptive discovery for currently active users
-- and raises their daily target to match the "~25 daily backlink
-- opportunities" plan copy (apps/web/consts/billing.ts). Non-adaptive
-- accounts never read daily_discovery_target, so flipping the flag is
-- required for the new target to have any effect.
--
-- "Active" mirrors the eligibility filter in
-- apps/server/src/jobs/daily-backlink-discovery.ts (runDailyBacklinkDiscovery):
-- not deactivated, outreach not paused, and on a paid tier or an active trial.
-- Column defaults for new products are left untouched — this only updates
-- existing settings rows so future runs pick up the new behavior.
update public.backlink_prospects_settings as settings
set
  adaptive_discovery_enabled = true,
  daily_discovery_target = 25,
  daily_discovery_candidate_cap = 40
from public.products
join public.profiles on profiles.id = products.user_id
where products.id = settings.product_id
  and profiles.deactivated_at is null
  and profiles.outreach_paused_at is null
  and (profiles.tier != 'free' or profiles.active_trial = true);
