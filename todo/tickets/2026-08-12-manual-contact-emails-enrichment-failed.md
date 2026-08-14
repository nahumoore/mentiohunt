# Review manually-found contact emails for enrichment-failed prospects

## Background

13 Mentiohunt prospects sit at `enrichment_status = failed`, `status = email_not_found` —
scraper couldn't find a contact for the site owner, so no outreach draft/send happened.

ChatGPT-assisted manual research turned up likely contact emails for 4 of them:

| Domain | Found URL | Email | Confidence | Source note |
|---|---|---|---|---|
| seoinux.com | https://seoinux.com/ | seoinuxltd@gmail.com | High | published in homepage footer |
| mgroup.pl | https://www.mgroup.pl/oferta/pozycjonowanie-stron-internetowych | kontakt@mgroup.pl | High | official contact page |
| seekme.ai | https://seekme.ai/tool/pitchbox | support@seekme.ai | High | published in site footer |
| supermonitoring.pl | https://www.supermonitoring.pl/blogpl/buzzstream-organizacja-dzialan-outreachowych/ | biuro@siteimpulse.com | High | terms page lists operator's obfuscated email as "biuro @ siteimpulse KROPKA com" |

Remaining 9 prospects still have no candidate email (not researched yet):

- torquemag.io — https://torquemag.io/2023/02/define-target-audience/
- rankchase.com — https://www.rankchase.com/blog/the-best-link-building-software/
- supermonitoring.com — https://www.supermonitoring.com/blog/online-marketing-link-building-with-ninja-outreach/
- fooyoh.com — https://fooyoh.com/geekapolis_gadgets_wishlist/15355256/how-to-promote-your-blog-6-tips-to-increasing-traffic
- mgroup.pl (2nd hit already covered above)
- winterwebcare.nl — https://www.winterwebcare.nl/
- supermonitoring.com — https://www.supermonitoring.com/blog/buzzstream-mastering-outreach-and-building-connections/
- makerlist.io — https://makerlist.io/tool/67680-buzzstream
- amplefound.com — https://www.amplefound.com/resources/saas/backlink-prospecting
- babygotbacklink.com — https://babygotbacklink.com/10-essential-link-building-tools-for-2024/

Product: Mentiohunt (`products.id = c73dce3c-b3b3-4633-b772-4150a9cde654`).

## Next steps

1. Manually verify the 4 found emails aren't stale/bounced before use.
2. Decide: manual override path to set `contact_email` + flip `enrichment_status` to
   `ready` for these 4 prospects, or feed back into scraper as a fallback/allowlist.
3. Research remaining 9 domains for a contact, same way, if worth the outreach volume.
4. Consider whether `agent_enrich.py` (apps/scraper) should try footer/terms-page email
   scraping as a fallback step before marking `email_not_found` — footer/terms emails
   look like a recurring miss pattern here.

## Research findings (2026-08-14)

- **Schema/flow**: `backlink_prospects.enrichment_status` (`pending|enriching|ready|failed`)
  and `.status` (`new|contacted|dismissed|negotiating|won|email_not_found|bounced`) are
  set by `apps/server/src/methods/prospect-generation-methods/competitor-backlink/process-competitor.ts`.
  Flipping these columns directly via SQL is **not safe** — it skips drafting the outreach
  email and creating `prospect_sequences` rows. The existing, safe manual-override path is
  already built: dashboard "manual complete" flow (`apps/web/app/api/link-building/opportunities/[id]/manual-complete/route.ts`
  → `apps/server/src/routes/prospect-manual-outreach.ts`), which drafts the email and
  schedules the sequence in one step. Use that for the 4 found emails, not a raw update.
- **There's already a generic-email fallback** (`enrich-contact.ts`): when no personal
  email is found, the system guesses `contact@`, `hello@`, `info@`, `hi@` at the domain and
  pays an email-verification actor ($0.001/email) to confirm each guess before using it.
  All 4 manually-found emails slipped past it for different reasons:
  - `seoinuxltd@gmail.com` — a personal Gmail address, not a `something@theirdomain` guess.
  - `kontakt@mgroup.pl` — the guess list is English-only; "kontakt" (Polish) was never tried.
  - `support@seekme.ai` — "support" simply isn't in the 4-word guess list.
  - `biuro@siteimpulse.com` — lives on a **different company's domain** than the prospect
    (supermonitoring.pl); pattern-guessing can only ever invent `name@prospect-domain`, so
    this one is structurally unguessable — only readable directly off the page.
- **Root cause for 2 of 4**: the scraper (`agent_enrich.py`) only pre-crawls author/team/about/
  press-type pages before starting its slower per-page search — it never checked contact,
  terms, privacy, or legal pages, which is exactly where `kontakt@mgroup.pl` and
  `biuro@siteimpulse.com` were published.
- **Root cause for the other 2**: `biuro@siteimpulse.com` was written as disguised text
  ("biuro AT siteimpulse KROPKA com" — Polish for "dot"); the scraper's obfuscation decoder
  only understands bracket/HTML-entity styles (`[at]`, `&#46;`, etc.), not spelled-out or
  non-English tokens. Decided to leave this decoding logic alone for now (cost/scope
  tradeoff) and focus on the page-crawling gap instead.
- **`seoinux.com` specifically**: confirmed via Railway logs this was very likely a one-off/
  transient failure, not a systemic gap — a *different* customer's discovery run against the
  exact same URL succeeded cleanly on current code (mailto link sits in plain text on the
  homepage, found on page 1). Logs from the original failed run (2026-07-18) have already
  rolled off Railway's retention window, so the original cause can't be confirmed.

## Changes made (uncommitted → this commit)

1. `apps/scraper/agent_enrich.py`: added contact/kontakt and terms/privacy/legal/impressum
   pages to the scraper's page-crawl priority list (`_PRIORITY_PATH_PATTERNS`), and told the
   agent to check those pages before giving up if it's found no email at all. No added
   cost — reuses the existing page/time budget, just spends it more effectively.
   **Verified locally** against the real `mgroup.pl` URL: now correctly finds
   `kontakt@mgroup.pl`, matching the manual research.
2. Same file: added a hallucination guard. Found while testing — when a target site is
   completely unreachable, the model was fabricating a full, confident-looking contact
   (name + personal email + bio) instead of admitting it found nothing (caught on
   `seekme.ai`, currently unreachable — the fabricated name/email exactly matched this
   repo's own placeholder example in `enrich-contact.ts`'s code comments). Now: if the
   scraper never successfully loads a single real page for a prospect, whatever the model
   claims in `finish()` is discarded and treated as "no contact found," regardless of how
   specific/confident it looks. **Verified locally**: re-ran the same unreachable-site case
   post-fix, now correctly returns null/empty instead of the fabricated contact.

## Status

- Fixed and verified for 1 of the 9 not-yet-manually-researched domains (`mgroup.pl`).
  Remaining 8 not yet re-tested against the updated scraper.
- The 4 manually-found emails have **not** been entered yet — still need the dashboard
  manual-complete flow run against each of the 4 prospect rows.
- The 13 existing `failed`/`email_not_found` rows are otherwise untouched — this fix only
  changes future enrichment runs, it doesn't retroactively reprocess already-failed rows.
- Not yet deployed — changes need to ship to production before they affect live discovery.
