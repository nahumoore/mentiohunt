# Strategy: Directory gap submission (`directory_gap`)

**Status: Proposal — not actioned**
**Effort: M** (discovery is done; the blocker is opportunity shape) · **Suggested build order: last**

## What it finds

Directories and listing sites in the `directories` table where the product **isn't listed yet** but
could be.

## Why it's listed last despite being nearly built

The discovery method is finished and running in production behind a free tool
(`methods/directories/check-directory-opportunities-by-url.ts`, exposed via
`routes/find-directory-opportunities-by-url.ts`). It's a two-phase check — concurrent `headCheck` against
each directory's `slug_pattern`, then batched SERP verification for SPA directories and head-check
failures — and it already returns clean gap results.

But **it doesn't produce an outreach opportunity.** Every other strategy ends in "email this person";
this one ends in "go fill in this form". That mismatch is the entire ticket:

- `backlink_prospects` rows carry `contact_email`, `email_subject`, `email_body`, `step2_body`,
  `step3_body`, `enrichment_status`. A directory gap has none of those and never will.
- `assignSequences` would schedule an outreach sequence for a row with no recipient.
- The `email_not_found` status — which is what a directory row would land in — currently means *failure*
  in the queue UI, when here it's the normal, correct state.
- The rotation handler's `sendAlert` shape assumes "we found N opportunities to review and send".

Wiring it in without resolving this would put permanently-broken-looking rows in the queue. Hence last:
it's cheap discovery blocked on a product decision.

## Why it's still worth doing

Directory listings are the fastest wins available to an early-stage B2B SaaS — high acceptance rates, no
persuasion needed, and they're the kind of obvious-but-unglamorous task founders never get to. Surfacing
them supports the product's core question ("what should I do next?") better than most outreach
opportunities do, because the answer is a 5-minute form rather than a negotiation.

## Resources used

| Resource | Where | Status |
|---|---|---|
| Gap detection (head-check + SERP fallback) | `methods/directories/check-directory-opportunities-by-url.ts` | **exists, production** |
| Slug-pattern soft-404 detection | `methods/directories/head-check.ts` | exists |
| Batched SERP verification | `methods/directories/serp-check.ts` | exists |
| Directory catalogue | `directories` table (`submit_url`, `slug_pattern`, `check_method`, `category`, `is_free`, `is_active`) | exists |
| Directory SEO metrics refresh | `jobs/update-directory-seo-metrics.ts` | exists |

Effectively zero new discovery work. All the effort is in modelling.

## Precondition (`isRunnable`)

```ts
isRunnable: async () => {
  const { count } = await supabaseAdmin
    .from("directories")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
  return (count ?? 0) > 0
}
```

Plus a per-product exhaustion check — see rotation notes; without one this strategy re-checks the same
directories forever.

## Options for opportunity shape

**A. New `status` value (recommended).** Add something like `action_required` to `prospect_status`, and
let the queue render those rows as a task with a submit link instead of an email draft. Smallest change
that's still honest: one enum value, one queue branch, and `assignSequences` skips rows with no
`contact_email` (verify it actually does — worth checking, since today that combination can't occur).

**B. Separate table + separate surface.** `directory_opportunities`, its own tab. Cleanest separation,
most UI work, and it fragments "what should I do next?" across two lists — which is the thing the UX
guidance in CLAUDE.md is most protective of.

**C. Only free tool, never in-app.** Defensible: it's a checklist, not autopilot, and the free tool
already serves it as a lead magnet. Also the cheapest, and worth seriously considering rather than
treating as the fallback.

**D. Outreach for the subset that needs it.** Some directories are curated and require an email pitch
rather than a form. Those *are* outreach-shaped and could flow through the normal path. Would need a
`submission_type` column on `directories` (`form` / `email` / `paid`), which is useful regardless.

Recommend **A**, with **D** as a follow-up once `submission_type` exists.

## Pipeline (assuming option A)

1. **Load active directories**, minus ones already checked for this product recently and minus ones
   already confirmed listed. This per-product state doesn't exist yet — the free tool re-checks
   everything on every call, which is fine for a one-off and wasteful daily. Needs a
   `product_directory_checks (product_id, directory_id, status, checked_at)` table, which also makes the
   free tool cheaper if it reads through it.
2. **Run the existing check** — `checkDirectoryOpportunitiesByUrl({ url, productName })`. Note it
   currently caps returned gaps at 10 (`check-directory-opportunities-by-url.ts:121`) and takes
   `freeOnly`; the job would want the full gap set and probably `freeOnly` driven by a setting.
3. **Rank the gaps** — `directories` already carries SEO metrics maintained by
   `jobs/update-directory-seo-metrics.ts`, so rank by authority × relevance to `category`, and surface
   free ones first. The customer should see the 5 worth doing today, not 40.
4. **Persist** — `tier: "directory_gap"`, `found_url` = `submit_url`, `target_url` =
   `product.website_url`, `status: "action_required"`, `enrichment_status` left `pending`/skipped, and
   `raw_metadata` carrying the directory name, category, `is_free`, and the detected check method plus
   reason (`headCheck` already returns a human-readable `reason` like `soft-404 (title: "...")`).
5. **Record the check outcome** for every directory examined — listed, gap, or error — so the next run
   can skip the settled ones and retry only errors.
6. **Alert** — `helpers/emails/send-directory-gap-alert.ts`. Copy must not imply we submitted anything;
   it's "N directories you're missing from", with the action on the customer.

## Outreach framing

None. Deliberately. No `OutreachContext` variant, no `generate-outreach-sequence` branch, no sequence.

If option D happens later, curated directories get a variant then — with a framing closer to
`resource_page_inclusion`, since that's effectively what a curated directory is.

## Cost per run

Very cheap and non-LLM: concurrent `fetchWithRetry` head checks under `pLimit(8)`, plus batched SERP
queries (`SERP_BATCH_SIZE` domains per query, `pLimit(2)`) for SPA directories and head-check fallbacks.
No enrichment, no outreach generation — this is the least expensive strategy in the set by a wide margin,
which is another reason not to give it a full rotation slot that a paid strategy could use.

## Rotation / exhaustion notes

**Exhausts hard and permanently**, like ticket 09. A product has one finite directory list; once it's
been checked, there's nothing new until the `directories` table grows or a `submit`-then-listed cycle
completes. Modelling it as a daily rotation strategy is wrong.

Better: run it **once at onboarding** and then on a slow cadence (monthly) or when `directories` gains
rows. That means it needs a way to be invoked outside the daily rotation — the same requirement ticket 09
surfaces. Two strategies needing it is probably enough to justify building it properly:
a separate periodic-sweep job, or a `cadence` field on the strategy handler.

## Open questions

- **Does this belong in the outreach product at all, or is it a companion checklist?** Genuine question.
  The core offer is "we run outreach through a prospect's first reply" — a submission checklist is a
  different promise. Option C exists for a reason.
- **Verify `assignSequences` skips contact-less rows** before creating any row of this shape. If it
  doesn't, this ticket introduces sequences that can never send.
- **`email_not_found` semantics.** Whatever option is chosen, don't reuse that status for directory rows;
  it means something else and the queue treats it as a failure.
- **Who marks a directory as submitted?** Without a "done" action the queue accumulates permanent tasks,
  and re-running the head check to detect completion only works for directories with a `slug_pattern`.
  Needs a manual "submitted" state, plus optional verification on the next sweep.
