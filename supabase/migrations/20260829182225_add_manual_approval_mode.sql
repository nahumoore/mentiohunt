-- Manual approval mode for outreach.
--
-- Adds an account-level switch that lets a user hold every outreach email
-- for their own review before it sends, instead of it going out
-- automatically under their name. Mirrors the existing `outreach_paused_at`
-- convention: a nullable timestamp, null meaning "off" (auto-send).
alter table "public"."profiles"
  add column "manual_approval_at" timestamptz;

-- New sequence status for a step that's drafted and ready, but held back
-- because the account is in manual-approval mode. Distinct from `paused`
-- (a permanent per-prospect dismissal) and `account_paused` (a cancelled
-- send awaiting a resume sweep) — this one is meant to be sent as soon as
-- the user approves it.
alter type "public"."prospect_sequence_status" add value 'awaiting_approval';
