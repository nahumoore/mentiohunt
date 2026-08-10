-- Branded email signature, applied at send time (not baked into the
-- generated body) so edits here reach outreach emails that were already
-- drafted, same as voice_tone/offering already work. Free-text textarea
-- (not separate company/website/line fields) so users can format however
-- they like; URLs inside are auto-linkified at send time.
alter table public.backlink_prospects_settings
  add column if not exists signature_enabled boolean not null default false,
  add column if not exists signature_text text;
