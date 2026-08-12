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
