# Mentiohunt — Pricing

## Current pricing (live)

Flat monthly SaaS pricing — **not** per-link or per-placement. Source of truth: `apps/web/consts/billing.ts`.

| Plan       | Price      | Was  | For                                               | Key limits                                                                                                                                                                                                         |
| ---------- | ---------- | ---- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Pro**    | **$49/mo** | $79  | Individual founders building their backlink queue | 1 website, 10 competitors tracked, ~25 daily backlink opportunities, unlimited outreach inbox accounts, 20 manual prospect URL submissions/day, 200 backlinks monitored daily, free inbox warmup, priority support |
| **Agency** | **$99/mo** | $149 | Teams managing backlinks across multiple sites    | Up to 5 websites, up to 15 competitors tracked, ~25 daily backlink opportunities per website                                                                                                                       |

- The personalized opportunity preview is free and requires no card. It creates no subscription and sends no outreach.
- The **7-day outreach trial** (`FREE_TRIAL_DAYS`) begins only after the customer reviews the preview, chooses to activate, and completes card-required Stripe Checkout.
- The selected plan renews automatically after the trial unless the customer cancels from Billing before the trial ends.
- Promotion codes are accepted at checkout.

## Positioning principle

Charge a flat, predictable monthly fee — not a commission per link. This is the main pricing contrast with agencies (retainer + opaque per-link markup) and per-link marketplaces (Editorial.Link at ~$300/link). Do **not** compete on cheapest-links positioning; the pitch is transparent, relevance-first managed execution at a price bootstrapped founders can justify (the sub-$500/mo gap identified in `pain-points.md` and `icp.md`).

## Historical direction (pre-launch, for reference)

Earlier planning considered per-placement pricing, monthly managed placement credits, or a hybrid base-fee-plus-per-placement model, anchored to a then-market range of roughly $160–500 per link. The shipped product went with flat monthly tiers instead.
