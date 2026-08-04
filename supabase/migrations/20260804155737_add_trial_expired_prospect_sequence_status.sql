-- Distinct from 'paused' (user-initiated dismiss, permanent) and 'skipped'
-- (lazily discovered at send time). 'trial_expired' is written proactively
-- the moment a free trial is deactivated, and is resumable if the user
-- upgrades or their trial is extended.
alter type public.prospect_sequence_status add value if not exists 'trial_expired';
