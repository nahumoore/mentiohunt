# Backlink Acquisition Strategy

## Action Types

Different opportunity types have fundamentally different workflows. Model this in the DB from day one.

```
opportunity.action_type: "self_service" | "email_outreach"
opportunity.target_url: string
opportunity.contact_email: string | null
opportunity.email_draft: string | null
```

| Type                        | Action           | CTA                            |
| --------------------------- | ---------------- | ------------------------------ |
| Directory / listing         | Submit yourself  | "Submit listing →" (opens URL) |
| Competitor backlink         | Email site owner | "Send email" (prefilled draft) |
| Unlinked brand mention      | Email site owner | "Send email" (prefilled draft) |
| Comparison guide            | Email site owner | "Send email" (prefilled draft) |
| Resource page               | Email site owner | "Send email"                   |
| Guest post                  | Email pitch      | "Send email"                   |
| SERP outreach               | Email            | "Send email"                   |

---

## Opportunity Tiers

### Tier 1 — Quick Wins (Self-Service)

Curated DB of ~300 directories and listing sites. When user submits their product, check if it is listed. Surface gaps as queue items.

User action: submit listing themselves. No outreach required.

Examples: G2, Capterra, Product Hunt, Trustpilot, indie directories.

### Tier 2 — Competitor Backlink Replication

User provides competitor URLs during onboarding. System finds domains linking to 2+ competitors — high-intent sites already trusting similar tools. Surface as email outreach queue with prefilled pitch framing product as alternative.

Discovery: Ahrefs/Moz API or Google `link:` / SERP-based method per competitor URL. Filter to unique domains linking to multiple competitors.

Action type: `email_outreach`

---

### Tier 3 — Unlinked Brand Mentions

Monitor web for brand/product name mentions without a link present. Easiest outreach: recipient already knows the product. Ask to convert mention into a link.

Discovery: Google Alerts, SERP API query for `"ProductName" -site:ownerdomain.com`. Check each result for presence of link to product. Surface gaps as queue items.

Action type: `email_outreach`

---

## Directory Listing Check

Two methods, used in combination:

**Top ~30 directories** — direct HTTP HEAD check using predictable URL patterns:

```
g2.com/products/{slug}/reviews
capterra.com/software/{slug}
producthunt.com/products/{slug}
```

Slug derived from product name: lowercase + hyphenate.

**Remaining 270+ directories** — Google `site:` query via SERP API:

```
site:directory.com "ProductName"
```

Results = listed. No results = not listed or not indexed. False negatives acceptable — either way the action is the same (go claim the listing).
