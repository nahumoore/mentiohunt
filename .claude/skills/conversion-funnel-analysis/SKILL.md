---
name: conversion-funnel-analysis
description: Analyzes Mentiohunt's marketing funnel, signup flow, and onboarding using live PostHog queries — landing page through trial-to-paid conversion. Use this whenever the user asks about conversion rate, funnel drop-off, "where are people getting stuck," onboarding completion, signup performance, trial-to-paid conversion, or wants to know "how's the funnel doing," "why isn't onboarding converting," "landing page to paid conversion," or similar. Also trigger for vaguer prompts like "how are we converting" or "check our funnel" — this is the right tool whenever the question is about the path from a visitor arriving to them becoming a paying customer. Does not cover retention or churn after a user is already paying (out of scope) and does not build or maintain PostHog dashboards — every run is a fresh, ad-hoc report delivered in chat.
---

# conversion-funnel-analysis

Answers "how well is Mentiohunt converting visitors into paying customers, and where does it leak?" by querying PostHog live — no dashboard is created or maintained, and results are always reported directly in the conversation as a plain-language findings report (per this repo's rule to explain system behavior, not query mechanics, to the user).

## The funnel this covers

Landing page → onboarding → signup → paid conversion. This is deliberately bounded: it stops at "did the trial convert to paid," and does **not** cover what happens after (retention, expansion, cancellation/churn — those live in `cancellation_reason_selected` / `cancellation_confirmed` / `cancellation_offer_declined` and belong to a separate analysis if the user ever asks for one).

**Onboarding comes before signup, not after** — don't build a funnel assuming the traditional "sign up, then onboard" order. Mentiohunt's onboarding is an async, no-card preview: people go through `onboarding_started` → site analysis → AI-generated preview without an account first, and only sign up later (sometimes much later — measured in hours, and it can happen on a separate visit) to save or unlock the result. This means `onboarding_started` volume will look much bigger than `user_signed_up` volume for the same period, which is expected, not a broken funnel. If you build a strict event-ordered funnel with signup before onboarding, it will silently show near-zero conversion for a step that's actually working fine — the events just aren't in that order for real users.

Read `references/funnel-events.md` for the full event catalog by stage, including properties on each event. Don't re-derive this from scratch every run — but do treat it as a starting point, not gospel: PostHog instrumentation changes as the product changes, so confirm what you're about to query still exists (see Step 1) rather than assuming last time's event names are still accurate. If a funnel step order ever looks off (a downstream step has *more* people than the step feeding into it, or a step converts at ~0%), that's a signal the assumed order is wrong, not that the step is broken — sanity-check the actual sequence with `query-trends` (compare raw volumes) or `query-paths` (`includeEventTypes: ["custom_event"]`, `startPoint` at the step in question) before reporting a drop-off as real.

## Why paid conversion needs special handling

There is no `payment_succeeded` or `subscription_started` event in this project. `checkout_session_created` only tells you a checkout was *started*, not completed. Whether someone actually became a paying customer lives on the **person**, not on an event: the boolean person property `active_trial` and the live numeric properties `$virt_mrr` / `$virt_revenue` (backed by revenue data, likely synced from Stripe). A person converted from trial to paid if they once had `active_trial = true` and now have `$virt_mrr > 0`.

PostHog's funnel tool builds steps out of events (and can filter by property, but not by "property changed value over time relative to an earlier step"). So don't try to force paid conversion into a single `query-funnel` call as a same-kind step with the rest. Instead:

1. Run the event-based funnel through the last real event you have — typically `checkout_session_created` (or `onboarding_trial_cta_clicked` if the user only wants to see start-of-checkout intent).
2. Separately, query how many persons who reached that step now show `$virt_mrr > 0` (or `active_trial = false` with prior trial history) — a person-property filter via `query-trends` with breakdown, or `execute-sql` against the persons table if a cleaner aggregate is needed.
3. Present the two numbers together as one funnel in the report (see template below) — the user shouldn't have to know this was two queries under the hood; that's an implementation detail, not part of the answer.

Say this plainly in the report's caveats line — something like "paid conversion is measured off account status, not a checkout-complete event, since Mentiohunt doesn't fire one" — so the user understands the number is a snapshot of current status, not a real-time completed-checkout count.

## Steps

**1. Confirm the schema before querying.** Call `mcp__posthog__exec` with `read-data-schema` (`{"query": {"kind": "events"}}`) to check the funnel-relevant events in `references/funnel-events.md` still exist and haven't been renamed or supplemented. This project is "Mentiohunt" (id 422640) — don't ask the user which project. If you haven't already, skim the `posthog:querying-posthog-data` skill's guidance before constructing any query — it covers the schema-first workflow this skill relies on and the exact `query-funnel` field shapes.

**2. Scope the funnel to the actual question.** Don't always run the full landing→paid funnel — read what the user is actually asking:
- "How's the funnel doing overall" / "how's our conversion rate" → full landing→onboarding→signup→paid funnel.
- "Where are people dropping off in onboarding" / "why isn't onboarding converting" → just the onboarding sub-funnel (`onboarding_started` through `onboarding_completed`/`onboarding_trial_cta_clicked`, with the intermediate steps from the reference file) — this can be measured on its own without involving signup at all, since it happens first.
- "How's signup doing" → `signup_page_viewed`/`signup_started` through `user_signed_up`, treated as its own funnel rather than chained after onboarding events — check with `query-paths` or a volume comparison first if you need to know how many signups actually originated from a completed onboarding vs. a direct visit.
- "Why is X step dropping" → narrow funnel around that step plus the step before and after, then drill (Step 5).
Default date range is the last 30 days unless the user names a period; say the range you used in the report so it's never ambiguous. Traffic volumes here are currently low (tens of people per step, not thousands) — call out when a percentage is based on a small sample (e.g. "6 of 16 people," not just "38%"), since a couple of people moving the needle can swing a rate by double digits.

**3. Build the funnel query.** Use `query-funnel` with the ordered event list for the chosen scope. Use `strict` ordering only if the user cares about the exact sequence; otherwise sequential ordering (each step any time after the previous) is usually the right default since real users don't always fire events in a rigid order. Include the paid step per the two-query approach above when the scope reaches that far.

**4. Add breakdowns only when they answer the question, not by default.** If the user is asking *where* drop-off comes from (channel, campaign, device) rather than *how much*, break the relevant step down by `$initial_utm_source` / `$initial_utm_medium` / `$initial_utm_campaign` / `$initial_referring_domain` / `$device_type` (all person properties — confirm current values via `read-data-schema` `event_property_values` before filtering on a specific one, e.g. don't assume "google" vs "Google"). Skip this step entirely for a plain "how's the funnel doing" ask — it adds noise without answering the question.

**5. Drilling into one specific drop-off.** When the user is investigating why a particular step is losing people, go beyond the raw percentage:
- Use `query-funnel-actors` to sample persons who dropped at that step.
- Check `query-funnel` time-to-convert stats for that step — a slow-but-eventually-converting step reads very differently from a hard wall people never cross.
- If the drop looks technical rather than behavioral (e.g. `onboarding_failed` firing, or a sharp step-over-step change on a specific date), it's worth a quick `query-trends` on the surrounding events to see if the drop lines up with a deploy or an external outage before concluding it's a UX problem.

**6. Report the findings.** Always end with a plain-language report in chat — never just a query result dump, never a saved dashboard or notebook unless the user explicitly asks for one on top of this. Use this shape:

```
## [Funnel scope] conversion — [date range]

[Headline sentence: overall conversion rate landing→paid or the scope in question, in plain terms]

| Step | Users | Conversion from previous | Conversion from start |
|---|---|---|---|
| ... | ... | ...% | ...% |

**Biggest drop-off:** [step] — [N]% of people who reach [previous step] don't make it to [this step].

**What this means:** [2-3 sentences of interpretation — is this in line with expectations, worse than a prior period if known, and a concrete next step or hypothesis worth checking]

**Caveats:** [date range used, and the paid-conversion measurement note from above when relevant]
```

Keep the interpretation grounded in what the data actually shows — flag speculation as speculation ("could be X, worth checking Y") rather than presenting a guess as a finding.
