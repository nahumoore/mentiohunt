# Verify founder-reply emails actually thread in the recipient's mail client

## Background

Built a feature letting the founder reply to a negotiating prospect from their own
connected mailbox, in-thread (`apps/web/components/prospects/reply-composer.tsx`,
`apps/server/src/routes/prospect-reply.ts`). First real-world test (prospect
`8ea64c02-b46f-4a50-9df1-c859db8f7822`, auq.io) showed the reply landing as a **new
conversation** in the recipient's inbox instead of joining the existing thread.

## Fix already applied (real bug, keep regardless of what the rest of this ticket finds)

`prospect-reply.ts` was addressing every reply to `backlink_prospects.contact_email`
— the static address outreach was originally sent to — instead of the address that
actually sent the most recent inbound reply. In the auq.io case, outreach went to
`hello@auq.io` but the human replied from `kirill@auq.io`; our reply kept going to
`hello@auq.io`, a mailbox that may not even be the one holding the thread. Fixed to
resolve the last inbound message's `from_email` and reply to that instead (same file,
plus `client-page.tsx` computes `replyToEmail` the same way for the UI label). This
part is correct and should stay.

## Unresolved: does the In-Reply-To/References mechanism itself actually work?

Ran an isolated SMTP-level test (no app data involved) sending real emails to the
developer's own Gmail via the `nicolas@mentiohunt.com` Zoho account:

1. Msg 1: plain email, no thread headers.
2. Msg 2: subject `Re: <msg1 subject>`, `In-Reply-To`/`References` correctly set to
   msg 1's real returned Message-ID.
3. Msg 3 (control): same `Re:` subject as msg 2, but **no** `In-Reply-To`/`References`
   at all — meant to isolate whether Gmail groups by subject+participants alone vs.
   genuine header-based threading.

Result: msg 1 + msg 2 showed as one inbox row (looked like success). Control (msg 3)
was sent right as the session ended — outcome not confirmed. If the control **also**
joined the same thread, that proves Gmail's grouping in this test was subject/participant
heuristic, not proof the headers work. If the control stayed separate while msg 2
joined, that would confirm real header-based threading is functioning.

## Next steps

1. Check the actual inbox state of the 3 test messages sent to
   `nahuelmoreno2904@gmail.com` ("Thread test 1 (ignore)" / "Re: Thread test 1
   (ignore)" x2) — did the no-headers control land as a separate row or not?
2. For an unambiguous result, better test design: send a message with a **different**
   subject (so Gmail can't subject-match) but correct `In-Reply-To`/`References` —
   if that still threads, headers are conclusively doing the work.
3. Pull "Show original" on the delivered test messages in Gmail and read the raw
   `Message-ID`/`In-Reply-To`/`References` headers directly — confirms whether Zoho's
   SMTP relay (`smtp.zoho.com`) preserves the headers nodemailer sets, rather than
   inferring from Gmail's UI behavior.
4. Clean up the 3 "Thread test" emails from `nahuelmoreno2904@gmail.com` inbox
   (manual, not code).
5. Once mechanism is confirmed (or fixed), re-validate against a real prospect
   end-to-end, not just the isolated SMTP test.
