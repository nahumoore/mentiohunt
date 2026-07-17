-- Add 'bounced' as a distinct prospect_status value and backfill mislabeled rows.
--
-- Previously, when an outreach email hard-bounced, the bounce handler
-- (apps/server/src/jobs/prospect-outreach-monitor.ts) overwrote the
-- prospect's status to 'email_not_found' — conflating "no contact found"
-- with "contact found, message sent, delivery failed". 'bounced' is a
-- terminal status distinct from 'email_not_found': the address already
-- failed delivery and is suppressed, so it must not re-enter the
-- manual-completion flow reserved for 'email_not_found'.

alter type public.prospect_status add value if not exists 'bounced';

-- A new enum value can't be referenced in the same transaction that adds
-- it, so commit before the backfill below uses it.
commit;

-- Backfill: prospects mislabeled 'email_not_found' that were actually
-- 'bounced' (a bounce was detected on one of their sequences) get moved to
-- the new 'bounced' status. Scope verified before writing this migration:
--
--   33 prospects currently 'email_not_found'
--   21 of them have a bounced sequence AND a real contact_email -> mislabeled
--   12 genuinely have no contact_email and no bounced sequence -> untouched
--   0 edge cases (bounced sequence with no contact_email, contact_email with
--     no bounced sequence, or a bounced sequence under any other prospect
--     status) — the WHERE clause below is exact, no ambiguous rows exist.
update public.backlink_prospects bp
set status = 'bounced'
where bp.status = 'email_not_found'
  and exists (
    select 1
    from public.prospect_sequences ps
    where ps.prospect_id = bp.id
      and ps.status = 'bounced'
  );
