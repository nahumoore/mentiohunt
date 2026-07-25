# Strategy: Integration ecosystem (`integration_ecosystem`)

**Status: Proposal — not actioned**
**Effort: M** · **Suggested build order: 8th**

## What it finds

Placement opportunities in the orbit of the tools the product **integrates with**: partner directories
and app marketplaces, "best tools that work with X" roundups, X-focused blogs and newsletters, and
community-maintained "awesome X" lists.

## Why it converts

Ecosystem content has a built-in qualification: the audience already uses the tool the product
integrates with, so relevance isn't a judgement call, it's a fact. And the ask is unusually easy to say
yes to — an integration is a concrete, verifiable thing that benefits the ecosystem's own users, so the
site owner isn't doing a favour, they're improving their coverage.

For B2B SaaS specifically this is one of the few link sources that also drives qualified signups rather
than just authority. That makes it a strong candidate for the fit rationale CLAUDE.md wants
("audience overlap", "expected SEO value") because the overlap argument is genuinely strong here.

## Resources used

| Resource | Where | Status |
|---|---|---|
| Crawled site content | `product_pages` (`page_type`, `keywords`, `title`, `description`) | exists |
| Page classification vocabulary | `methods/product-pages/categorize-pages.ts` | exists |
| SERP scraper | `helpers/actors/google-serp-scraper.ts` | exists |
| Niche derivation pattern to copy | `methods/guest-post-sites/derive-niches.ts` | exists |
| Everything downstream | standard | exists |
| **Integration derivation** | — | **new LLM step** |

## Precondition (`isRunnable`)

```ts
isRunnable: async (product) => (await getDerivedIntegrations(product.id)).length > 0
```

Needs crawled pages to derive integrations from, and needs the derivation to have found at least one.
Many products have none — this strategy simply never runs for them, which `selectStrategyForRun`
handles.

## The new piece: deriving integrations

Mirror `derive-niches.ts` almost exactly — same structure, same fallback discipline, one LLM call with a
`json_schema` response format.

Input: the product's crawled pages, prioritising ones whose URL or title suggests integrations
(`/integrations`, `/connect`, `/apps`, `/marketplace`), plus `product_description`. `product_pages`
already stores `title`, `description` and `keywords` per page, so this needs no new crawling.

Output: a list of named third-party tools the product connects to, each with a confidence, plus the tool's
likely domain.

**This must be cached, not derived daily.** Integrations change monthly at most. Store on `products` or
in a small `product_integrations` table with a `derived_at`, refresh on a long interval or when the
sitemap changes. Deriving it on every run would be pure waste and would add another call site to the
07:00 UTC LLM burst for no reason (see `00-shared-groundwork.md` §4).

**Accuracy caveat worth designing for:** an LLM reading a marketing page will confidently list
integrations that don't exist, or count "works alongside" as "integrates with". A wrong integration
claim in an outreach email to that vendor's ecosystem is a bad, visible error. Mitigations: require the
integration to be named on an actual integrations/marketplace page rather than inferred from prose, and
put the derived list somewhere the customer can see and correct it. That last part is probably a
prerequisite, not a nice-to-have.

## Pipeline

1. **Load cached integrations** (derive if stale).
2. **Build the query pool** — per integration name:
   - `"best {integration} integrations"`
   - `"tools that integrate with {integration}"`
   - `"{integration} app marketplace" {category}`
   - `"awesome {integration}"` (community lists — often GitHub, which accepts PRs rather than emails;
     see open questions)
   - `{integration} blog "{category}"`
   - `"{integration} partners" {category}`

   Rotate with `selectQueriesForRun`. The pool scales with the integration count, which for a mature
   product can be large — cap per run.
3. **SERP** — `limit: "50"`, `pLimit(3)`.
4. **Dedupe by URL**; drop own domain, noise domains, and — deliberately — decide what to do with the
   integration vendor's **own** domain. Their marketplace/partner directory is often the single best
   opportunity in the set, but it's usually a submission form rather than an outreach email, which makes
   it shaped like ticket 11 rather than this one. Recommend: keep vendor-owned pages out of v1 and
   revisit alongside the directory-submission work.
5. **Drop already-stored URLs** (step-2b pattern).
6. **Fetch + qualify** — `fetchPageContent`, then score:
   - does the page actually curate tools/apps in the integration's ecosystem;
   - is the product absent;
   - is inclusion plausible for a third party (not a first-party feature page);
   - is the integration relevance real, or does the page merely mention the tool once.
7. **DR filter** → **site relevance** → **persist + enrich**. `tier: "integration_ecosystem"`,
   `raw_metadata` carries the anchor integration and the matched query.
8. **Alert** — `helpers/emails/send-integration-ecosystem-alert.ts`.

## Outreach framing

```ts
| {
    opportunityType: "integration_ecosystem"
    title: string
    foundUrl: string
    integrationName: string
    integrationDetail: string | null   // what the integration actually does, from the derivation
  }
```

`buildFraming`: lead with the integration as the reason for relevance — "we have a two-way sync with
{integration}, and your list of {integration} tools doesn't include it yet". Then a one-sentence
description of what the integration actually does for a shared user.

Prompt cautions:

- The integration claim must come from the derivation's `integrationDetail`, never be elaborated. The
  recipient is frequently an expert in that ecosystem and will catch an overstated claim immediately.
- Don't claim official partnership, certification, or marketplace approval unless it's stated in
  `settings.offering`. This is the strategy most likely to drift into an unearned partnership claim.

## Cost per run

Standard SERP profile (~4–6 SERP calls, ~25 fetches, 2 LLM batches, enrichment), plus an amortised
derivation call that runs monthly rather than per run.

## Rotation / exhaustion notes

Pool depth scales with integration count, so it's deep for products with many integrations and shallow
for products with one or two. Renews when the product ships a new integration — which makes the derived
list worth re-checking on sitemap change rather than on a fixed timer.

## Open questions

- **GitHub "awesome X" lists** are among the best targets here but they take pull requests, not emails.
  That's a genuinely different action shape — same problem as ticket 11's submission flows. Either
  exclude `github.com` from this strategy or resolve the submission-vs-outreach opportunity shape once
  and let both strategies use it.
- **Vendor marketplaces are the real prize and they're out of scope in v1.** Being listed in
  {integration}'s official app directory is usually worth more than any blog roundup. Worth scoping as
  its own ticket, since it's a form submission plus a review process, not outreach.
- **Who owns the derived integration list?** If the customer can't see and edit it, every downstream
  email inherits an unreviewed LLM inference. Recommend surfacing it in settings next to competitors —
  which also gives the empty-state a second thing to teach, per CLAUDE.md's UX guidance.
- Overlap with `listicle_roundup` is real (`"best {integration} tools"` is a listicle). Dedupe by
  `found_url` covers it; the framing difference is what justifies the separate tier.
