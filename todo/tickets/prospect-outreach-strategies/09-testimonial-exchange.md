# Strategy: Testimonial exchange (`testimonial_exchange`)

**Status: Proposal — not actioned**
**Effort: M** · **Suggested build order: 9th**

## What it finds

Vendors the customer **already pays for or uses** whose sites publish customer testimonials, case
studies, or "loved by" walls — where a testimonial from the customer would be published with an
attribution link back to their site.

## Why it converts

This is the only strategy in the set where the customer is **giving** rather than asking. Vendors
actively want testimonials — most SaaS marketing teams have a standing internal task to collect more —
and the attribution link (name, title, company, linked logo or company name) is standard practice, not
a concession. Acceptance rates are high and the turnaround is fast because the person receiving the
email is usually incentivised to say yes.

Secondary value that matters for the ICP: these are relationships the founder already has. It's the
least cold outreach the product can generate, and the placements land on high-authority vendor domains
that would be unreachable through any other strategy in the rotation.

## Why it fits the product's positioning

It's a clean example of "more transparent than an agency, less work than outreach software" — the value
isn't a scraped list, it's noticing an opportunity the founder had and didn't think to act on. It also
sidesteps the main objection to link building generally: nothing here is manufactured, the customer
genuinely uses the tool and the testimonial is genuinely theirs.

## Resources used

| Resource | Where | Status |
|---|---|---|
| Crawled site content | `product_pages` | exists |
| SERP scraper | `helpers/actors/google-serp-scraper.ts` | exists |
| Derivation pattern to copy | `methods/guest-post-sites/derive-niches.ts` | exists |
| Everything downstream | standard | exists |
| **Vendor/stack derivation** | — | **new step** |

## Precondition (`isRunnable`)

```ts
isRunnable: async (product) => (await getDerivedVendors(product.id)).length > 0
```

## The new piece: deriving the customer's vendor list

Harder than ticket 08's integration derivation, because a company's tool stack is mostly invisible from
its marketing site. Signals that are actually available:

- **Integrations pages** — overlaps ticket 08's derivation; if that ships first, reuse the list. A tool
  you integrate with is usually a tool you use.
- **"Built with" / "our stack" / "tools we use" pages** — common in dev-tool and indie-SaaS marketing,
  rare elsewhere.
- **Footer/embed signals in crawled HTML** — hosting badges, "powered by" widgets, support-chat and
  analytics vendors. Requires the raw HTML, which the crawler may not retain; check what
  `product-pages/crawl-product-pages.ts` stores before assuming.
- **Job postings and changelog posts** naming tools.

**Recommended: don't rely on derivation alone. Ask the customer.** A settings field ("which tools do you
use and would recommend?") produces a shorter, correct, higher-intent list than any inference, and it's
exactly the kind of input CLAUDE.md's empty-state guidance says should be taught to users because it
improves discovery quality. Derivation then becomes a *suggestion* to confirm rather than a source of
truth. This changes the strategy's precondition from "we guessed something" to "the customer told us
something", which is far safer given the email claims a real commercial relationship.

## Pipeline

1. **Load the vendor list** — customer-supplied first, derived suggestions second.
2. **Find the testimonial surface** per vendor — one SERP query each:
   - `site:{vendorDomain} (testimonials OR "case studies" OR "customer stories")`
   - fall back to `"{vendorName}" testimonials` if the site query is empty.
   Cheap: one query per vendor, and vendor lists are short (5–15).
3. **Fetch + qualify** — `fetchPageContent`, then score:
   - does the page publish third-party testimonials/case studies at all;
   - do the published testimonials carry **attribution links** (this is the whole point — a testimonial
     wall with plain text names and no links is worth nothing here, and the LLM should check for linked
     company names in the surrounding markup);
   - is the customer already featured (skip if so);
   - is there a visible submission route or a marketing contact.
4. **Dedupe + noise filters** as usual. Note this strategy's candidates are **vendor domains**, which are
   often high-DR — `settings.dr_min` will rarely exclude anything, and `dr_max` might exclude the best
   ones. Worth checking whether the DR filter should apply to this tier at all.
5. **Persist + enrich** — `tier: "testimonial_exchange"`. `raw_metadata` carries the vendor name and how
   the relationship was established (customer-supplied vs derived) — the email framing must differ
   between those two cases.
6. **Alert** — `helpers/emails/send-testimonial-exchange-alert.ts`.

## Outreach framing

```ts
| {
    opportunityType: "testimonial_exchange"
    title: string
    foundUrl: string
    vendorName: string
    relationshipSource: "customer_confirmed" | "derived"
    usageDetail: string | null      // what they use it for, if the customer told us
  }
```

`buildFraming`: offer the testimonial in the first sentence, state briefly what the product uses the
vendor for, and ask where to send it. Short email — this one doesn't need persuasion, it needs to be
easy to act on. The ask should be "want me to write a couple of lines?" rather than pasting an unsolicited
paragraph.

**Hard constraint on the prompt:** the email asserts a commercial relationship on the customer's behalf.
It must never do that unless `relationshipSource === "customer_confirmed"`. For derived vendors the email
has to be hedged into uselessness ("we've been looking at...") — which is a strong argument for only
running this strategy on confirmed vendors and treating derivation purely as a settings suggestion.

Also: no fabricated praise. The email offers to write a testimonial; it does not contain one. Generating
specific claims about how much the customer loves a tool is putting words in their mouth, and those words
get published under their name.

## Cost per run

Cheapest per prospect in the set: one SERP query per vendor, a handful of fetches, no query-pool
generation, and short vendor lists. Enrichment dominates, and even that is easier than usual because
vendor marketing contacts are easy to find.

## Rotation / exhaustion notes

**Exhausts permanently and fast.** A customer has maybe 10–20 vendors, each with one testimonial page.
Once they've all been pitched, the strategy is done until the customer adopts a new tool. Behaves more
like a one-time onboarding sweep than a daily rotation strategy.

That's an argument for running it **once during onboarding** and then only when the vendor list changes,
rather than giving it a permanent rotation slot where it will return zero forever after the first week.
The zero-yield cooldown in `00-shared-groundwork.md` §3b would eventually bench it automatically, but
modelling it as an event-driven sweep is more honest.

## Open questions

- **Is this even a rotation strategy?** See above — it's arguably an onboarding action plus a trigger on
  vendor-list change. That would mean it needs no rotation entry at all, just a tier value and a way to
  invoke a strategy outside the daily rotation. Worth deciding before building; it may be the first case
  that motivates a general "event-triggered strategy" path.
- **Does a testimonial link count as an editorial backlink?** It's usually a `nofollow` logo link or a
  linked company name, and the SEO value is lower than the strategies that place in-content links. The
  fit rationale should be honest about that per CLAUDE.md's "don't imply backlink acquisition is
  guaranteed" and don't-oversell rules — pitch it as a genuine, easy, real-relationship placement, not
  as a high-authority win.
- **Reciprocity risk.** If both parties are Mentiohunt customers this could turn into an
  exchange-farming pattern, which is exactly the kind of thing search engines discount and the
  positioning shouldn't touch. Worth an explicit "we don't broker link exchanges" stance before shipping.
