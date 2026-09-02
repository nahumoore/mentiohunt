# Mentiohunt — How the Product Works

What Mentiohunt actually does, end to end. Positioning and messaging language lives in the sibling docs; this file is the factual reference for what happens in the app.

Source of truth: `apps/web/components/onboarding/`, `apps/web/consts/onboarding.ts`, `apps/web/consts/billing.ts`, `apps/server/src/processes/onboarding/run-onboarding-jobs.ts`, `apps/server/src/methods/prospect-generation-methods/`.

## Onboarding (what the customer sets up)

A short wizard, no article-URL pasting:

1. **Website URL** — the customer enters their site. Mentiohunt fetches it.
2. **Product** — AI drafts a product name + description from the fetched site; the customer edits anything wrong.
3. **Competitors** — AI drafts a list; the customer keeps 2–3 close ones (min 2, max 10). Used to mine competitor backlink profiles for targets.
4. **Target keywords** — AI drafts keywords the customer wants to rank for; the customer confirms 3–5, in priority order.
5. **Most important pages** — the customer either adds up to 5 on-site page URLs to prioritize, or leaves "find my best pages automatically" checked, which scans the site and picks the 5 pages that best match the target keywords.
6. **Personalized preview** — setup is persisted and a bounded asynchronous discovery run shows 3–5 real opportunities when enough strong matches exist. No card is required, no trial clock starts, and nothing is sent.
7. **Trial / checkout** — after reviewing the preview, the customer may start a card-required 7-day outreach trial. It is $0 today and Pro renews at $49/month after the trial unless cancelled from Billing before then — see `pricing.md`.

Bounded preview discovery starts after setup. Recurring discovery and outreach only start once checkout succeeds.

## Discovery (how opportunities are found)

Runs on the customer's tracked pages, competitors, and keywords. Five methods, run daily (a lighter capped pass fires once during onboarding):

- **Competitor backlinks** — sites linking to a competitor, pitched a link to a relevant customer page instead.
- **Unlinked mentions** — pages that mention the product or brand without linking.
- **Listicle roundups** — "best X tools" / "top N alternatives" posts that don't list the product yet.
- **Resource-page inclusions** — curated resource/link pages where a customer page fits (needs the page crawl to have run first).
- **Broken-link building** — dead outbound links on relevant pages, offered a working customer page as the replacement (needs competitors + the page crawl).

Each opportunity carries a fit rationale (topic/audience overlap, placement angle, expected SEO value), the target site's DR and traffic, a verified contact for the person likely to make the editorial call, and a ready-to-send email draft.

## Outreach (what Mentiohunt runs)

- Outreach sequences **auto-schedule the moment an opportunity is discovered** — there is no per-email approval step.
- The customer's role is to watch the queue (surfaced as **one daily discovery digest email per product**) and cancel anything that isn't a fit.
- Cold outreach sends from Mentiohunt's shared pool inboxes, not the customer's domain — their sending reputation stays untouched. A customer who prefers to send from their own domain can connect a mailbox and use the free inbox warmup.
- Automation covers the first email and follow-ups. **The moment a prospect replies, the sequence stops** and the thread is handed to the customer, who continues personally from their own connected mailbox.

## Other capabilities

- **Manual prospect submission** — paid users can submit up to 20 target URLs/day for Mentiohunt to enrich and pitch.
- **Link tracker** — monitors up to 200 acquired backlinks per product for removal or nofollow changes.
- **Agency plan** — up to 5 websites, each with its own discovery run and competitor set.
