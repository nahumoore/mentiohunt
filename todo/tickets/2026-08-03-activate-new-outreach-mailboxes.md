# Activate new public-pool outreach mailboxes after warmup

## Background

Bought 2 new inboxes on `mentiohuntapp.com` for the shared outreach sending pool:

- `intro@mentiohuntapp.com`
- `reply@mentiohuntapp.com`

Existing pool mailbox `nico@mentiohuntapp.com` (Supabase) stays as-is. New two chosen
as neutral, non-person local-parts on purpose — display name shown to prospects is
the actual founder's name per-send, so local-part doesn't need to look human and
avoids any mismatch with the signature name.

## Next steps

1. Confirm warmup underway on both new mailboxes (external warmup tool/service —
   check whichever the existing pool mailboxes use).
2. Wait ~2 weeks from 2026-08-03 (target: 2026-08-17) for warmup to reach sending-safe
   reputation before routing real outreach volume through them.
3. Add both to Supabase alongside `nico@mentiohuntapp.com` in whatever table backs the
   shared sending pool.
4. Wire into outreach-sending rotation/selection logic (server-side).
5. Start at low daily volume per mailbox, ramp gradually — don't jump straight to full
   send cap even after warmup period ends.
