# Enrich prospect contact info from inbound replies, not just outreach-time scraping

## Summary

When a prospect replies, their email carries real identity signal — display name,
signature block (name, phone, scheduling link, etc.) — that we parse and store on
the `prospect_messages` row but never copy back onto `backlink_prospects`. If the
contact was never enriched (or enrichment failed) before outreach went out, the
prospect stays "Unknown contact" in the UI forever, even after the person has
personally replied and told us who they are.

## Concrete example

Prospect `8ea64c02-b46f-4a50-9df1-c859db8f7822` (auq.io):

- `backlink_prospects.contact_name` = `null` → dashboard shows "Unknown contact"
  (`apps/web/app/dashboard/prospects/[slug]/client-page.tsx`, contact section).
- Inbound reply already captured on `prospect_messages` (id `12965d9c-3a6e-465d-8a45-a19899788fd3`):
  - `from_name` = `"Kirill Sajaev"`, `from_email` = `"kirill@auq.io"`
  - Signature in `text_body`:
    ```
    Kirill Sajaev
    Office: +1.630.440.6183
    Schedule a meeting: calendly.com/kirill-sajaev
    ```

Everything needed to enrich this prospect (name, phone, a scheduling link that could
slot into `contact_social_links`) arrived with the reply and is sitting unused in
`text_body`/`from_name`.

## Where this should happen

`apps/server/src/jobs/prospect-outreach-monitor.ts`:
- `storeMessage()` (~line 371) inserts the `prospect_messages` row with `from_name`/
  `from_email` already parsed off the inbound headers — but never touches
  `backlink_prospects`.
- The `classification === "human_reply"` branch (~line 507) is where we already know
  a real person replied and call `notifyUserOfReply` — this is the natural place to
  also backfill contact info.

## Fix direction

On `human_reply` (and arguably `negative_reply`/`wrong_person`, since those are still
real people replying), if `prospect.contact_name` is null/empty or matches a known
"unknown" placeholder:
- Backfill `contact_name` from the inbound `from_name` (through the existing
  `sanitizeContactName` guard so we don't reintroduce the garbage-name problem from
  the outreach-quality ticket).
- Consider a lightweight signature parser (name/phone/scheduling-link lines at the
  bottom of `text_body`, similar shape to `stripQuotedReply` in `inbound-email.ts`)
  to pull a phone number or booking link into `contact_social_links` / a new field —
  scope this part separately if it's non-trivial, name backfill alone is the
  high-value/low-risk part.
- Don't overwrite a `contact_name` that's already a real, previously-enriched value.

## Note (separate, noticed while investigating)

This same prospect's last inbound message is classified `negative_reply` even though
the body ("wanna do a link exchange with our site to yours?") is a counter-proposal —
per the classifier's own prompt examples in `inbound-email.ts`, a link-exchange
counter-offer should be `human_reply`, not `negative_reply`. Didn't file separately
since it's adjacent, but worth a look if reply classification accuracy comes up again.
