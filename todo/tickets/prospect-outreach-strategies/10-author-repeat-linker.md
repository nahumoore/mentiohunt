# Strategy: Author repeat linker (`author_repeat_linker`)

**Status: Proposal — not actioned**
**Effort: L** (needs person-level prospect modelling) · **Suggested build order: 10th**

## What it finds

The **people** who write the pages that link to competitors — then every other outlet that person
publishes on. One writer who covers the category becomes a relationship worth several placements
instead of one page worth one link.

## Why it's different from everything else in the rotation

All ten other strategies are domain-keyed: find a page, find whoever owns it, send one email. This one
inverts the graph. Freelance writers and category journalists publish across many outlets, so a single
positive relationship compounds — and the second email to the same person ("you covered this for Outlet
A, I saw you also write for Outlet B") is warm, not cold.

It's also the only strategy that produces an asset the customer keeps after the subscription ends: a
short list of writers who cover their category and have replied before. That's genuinely closer to what
a good agency provides than to what outreach software provides, which is the positioning CLAUDE.md
describes.

## Why it's last

It's the only strategy that doesn't fit the existing data model. `backlink_prospects` is keyed on
`(product_id, found_url)` with a `domain` column — one row, one page, one contact. This strategy needs a
person entity with many pages across many domains, and outreach sequencing that dedupes **per person**
rather than per URL, or the same writer gets three near-identical emails from the same customer in a
week. That's the expensive part, not the discovery.

## Resources used

| Resource | Where | Status |
|---|---|---|
| Contact/author extraction from a page | `competitor-backlink/enrich-contact.ts` → scraper `/scrape` (LLM enrichment agent) | exists — already returns a contact name and bio |
| Author bio in outreach | `generate-outreach-sequence.ts` (`authorBio`, used for the P.S.) | exists |
| Pages linking to competitors | `competitor_backlink` output, or the ticket-05 table | exists / proposed |
| SERP scraper for byline search | `helpers/actors/google-serp-scraper.ts` | exists |
| Email verification | `helpers/actors/email-verifier.ts` | **built, never called** — see below |
| **Person-level prospect entity** | — | **new** |

Notably, `enrich-contact` **already extracts author names and bios** — `enrichListicle` passes
`contact.rawMetadata?.bio` into the outreach prompt today (`listicle-roundup/enrichment.ts:83`). The raw
material for this strategy is already being collected and discarded after one use.

## Precondition (`isRunnable`)

```ts
isRunnable: async (product) => {
  // needs existing prospects with an identified author to expand from
  const { count } = await supabaseAdmin
    .from("backlink_prospects")
    .select("id", { count: "exact", head: true })
    .eq("product_id", product.id)
    .not("contact_name", "is", null)
  return (count ?? 0) > 0
}
```

This strategy **feeds off the others' output** rather than sourcing candidates independently, so it's
only runnable once a product has accumulated enriched prospects. That's a nice property — it gets
stronger the longer a customer is active — and a caveat: it's dead weight for a new account.

## Pipeline

1. **Pick seed authors** — from this product's existing `backlink_prospects` rows that have a
   `contact_name` and came from a category-relevant page. Prefer authors from pages that scored well
   and, if reply data is available, authors who have replied before. Rotate least-recently-expanded.
2. **Find their other work** — SERP per author:
   - `"{authorName}" -site:{knownDomain} {niche}`
   - `"{authorName}" "{category}"`
   - `"by {authorName}" {category}`

   Common-name collisions are the main failure mode here — "James Smith" returns noise. Require the
   niche term in the query, and treat a low-confidence match as a discard rather than a guess.
3. **Verify it's the same person** — fetch each candidate page and confirm via byline plus corroborating
   detail (matching bio, same social handle, same headshot URL, consistent topic area). The scraper's
   enrichment agent already returns bio and social links, so this is a comparison, not new extraction.
   **Set the bar high**: emailing someone about an article they didn't write is worse than missing the
   opportunity.
4. **Qualify the outlet** — is it a real publication in the category, does it publish outbound links,
   is the product absent. Standard scoring, plus `isNoiseDomain` and DR filtering.
5. **Person-level dedupe** — before creating anything, check whether this person already has an open or
   sent sequence for this product. If they do, either skip or queue as a *follow-up to an existing
   relationship*, which is a different email entirely. This is the step that makes or breaks the
   strategy's reputation.
6. **Persist + enrich** — `tier: "author_repeat_linker"`. See the data-model note below; in the
   thinnest version, rows stay page-keyed and the person link lives in `raw_metadata` plus a shared
   `contact_email`.
7. **Verify the email** — this is the natural first use for `helpers/actors/email-verifier.ts`. A writer
   contacted across multiple outlets may have several addresses of varying quality; sending to a dead or
   catch-all address repeatedly hurts the shared sending pool's reputation. `$0.001/email` is trivial
   next to that risk.
8. **Alert** — `helpers/emails/send-author-outreach-alert.ts`.

## Data model options

**Thin (recommended for v1):** keep `backlink_prospects` page-keyed. Add a `contact_key` column
(normalised email, or `name+primary domain` when there's no email) and enforce the person-level dedupe in
step 5 as a query against it. Also gives every other strategy person-level dedupe for free, which is
worth having regardless — nothing today prevents two strategies from emailing the same person about two
different pages on the same day.

**Full:** a `prospect_contacts` table with `backlink_prospects.contact_id`, one row per person per
product, with the pages attached. Correct model, bigger migration, touches the queue UI and the outreach
sender.

Recommend shipping the `contact_key` dedupe *before* this strategy — it's independently valuable and it
de-risks the expensive part.

## Outreach framing

```ts
| {
    opportunityType: "author_repeat_linker"
    title: string
    foundUrl: string
    authorName: string
    knownWorkUrl: string        // the piece we originally found them through
    outletName: string
    authorBio: string | null
  }
```

`buildFraming`: address the writer, not the site. Reference the specific piece we found them through,
then the current outlet. The ask is to be a source or to be considered for the category coverage they
already do — not "please add a link", which is the wrong ask for a journalist and marks the sender as an
SEO.

Prompt cautions:

- **Never imply we've been tracking their work.** Reference one specific piece, not a pattern across
  outlets. "I read your piece on X" is fine; "I've been following your writing across A, B and C" is not.
- Don't claim to have read something we only saw a SERP snippet of — step 3 fetches the page, so the
  qualifier can supply one true detail. Require it.
- The existing bio-based P.S. logic (`generate-outreach-sequence.ts:162`) is well-suited here and already
  correctly refuses to invent a detail when the bio has nothing concrete. Keep that guard.

## Cost per run

Moderate: 2–3 SERP calls per seed author, several page fetches for identity verification (the expensive
part, and it's scraper-pool pressure), one LLM batch for qualification, plus enrichment and a verifier
call. Keep seed authors per run low — 3–5 — because cost scales per author, not per run.

## Rotation / exhaustion notes

Depends entirely on the other strategies' output, so it renews as they do. A useful side effect: it turns
each successful prospect from any other strategy into a small pool of new ones, which partially offsets
the SERP-pool exhaustion problem those strategies have.

## Open questions

- **Is person-level outreach in scope for the product?** It changes what the queue represents (a person
  and their work, not a page and its owner) and arguably what the product *is*. Worth a product decision
  before engineering — but note this is exactly the capability that makes the agency expansion path
  viable later.
- **Cross-product dedupe.** Two customers in the same category will both find the same category writer.
  Nothing stops both from emailing them the same week from Mentiohunt's shared sending pool. That's a
  deliverability and reputation issue that belongs to the sending infrastructure, not this strategy, but
  this strategy makes it far more likely and shouldn't ship without at least measuring it.
- **Journalists are a specific audience with specific norms** — they get pitched constantly and are
  quick to publicly call out bad outreach. The email quality bar here is higher than anywhere else in the
  rotation, and the downside of getting it wrong is public rather than silent.
- Where does `email-verifier` belong long-term? If it's worth using here it's probably worth using for
  every tier — likely a shared enrichment step rather than something this ticket owns.
