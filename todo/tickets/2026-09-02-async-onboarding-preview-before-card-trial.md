# Async onboarding preview before the card-required outreach trial

- **Status:** In progress — safety foundation and first end-to-end preview slice implemented
- **Priority:** P0
- **Scope:** Replace the final onboarding paywall with an asynchronous, no-card
  personalized preview. Ask for a card only after the user has reviewed real
  opportunities and chooses to activate automated outreach.
- **Primary objective:** Let a new user see that Mentiohunt understands their site
  before asking for payment details, without allowing free accounts to send outreach
  or enter the recurring discovery jobs.

## Implementation progress (2026-09-02)

The first end-to-end slice is implemented:

- signup no longer starts a trial or populates billing dates;
- setup is persisted before a bounded, durable preview job is queued;
- the Important Pages step submits the preview directly, without an extra
  plan/explainer screen;
- preview jobs now use the same five-strategy discovery coverage and 50-page crawl
  as onboarding, can retain up to 75 qualified matches, and perform no contact
  lookup or outreach drafting;
- `/onboarding/preview` supports processing, ready, partial, zero-result, and failed
  states, automatically refreshes, and shows the signed-in delivery email;
- the results email is idempotent and links back to the preview;
- preview checkout reuses the saved product, returns cancellations to the preview,
  and can be finalized atomically by either the Stripe webhook or return URL;
- successful activation enriches and drafts outreach for the exact stored preview
  prospects instead of rediscovering them;
- recurring discovery and the sender now require completed onboarding as well as
  billing entitlement;
- a two-day trial-ending reminder and the core preview/checkout analytics events
  are wired;
- contradictory no-card public copy has been replaced with preview-versus-outreach
  terms.

Still required before the ticket is complete:

- finish lifecycle-aware recovery emails and abandoned-checkout founder follow-up;
- add the reversible next-20-qualified-onboardings rollout switch;
- add integration coverage against Supabase and Stripe test clocks, including job
  retry, webhook/return races, cancellation, and reminder delivery;
- finish the remaining funnel events for first send, first reply, and first paid
  charge if they are not already emitted by their owning workflows.

## Decision

The onboarding setup and personalized preview do **not** require a card. The
card-required 7-day trial begins only when the user clicks **Start outreach** from
their completed preview and Stripe Checkout succeeds.

The free preview proves prospect quality; it is not a free sending plan. Before the
trial starts:

- no outreach is sent;
- no sendable/follow-up sequence is scheduled;
- no sending-pool account is allocated;
- the account is excluded from recurring discovery and outreach jobs;
- no Stripe subscription exists and no trial clock is running.

Do not promise that the user will _get backlinks in seven days_. The trial promise is
that Mentiohunt will start discovery and outreach for seven days; replies and
placements depend on third parties and can take longer.

## Why

The card-required onboarding flow launched on 2026-08-27. In PostHog, excluding test
accounts through 2026-09-02:

- 7 unique users completed the last setup step and reached the paywall;
- at least 5 unique users initiated the server redirect into Stripe Checkout;
- 0 reached `/onboarding/welcome`, the post-checkout success destination.

The sample is small, but the loss is concentrated at Stripe rather than at the setup
form. Mentiohunt currently asks an unfamiliar Reddit/SEO visitor to trust a generic
plan description before showing any result produced for their own site.

There is also a trust contradiction in the public copy: the live FAQ says no card is
taken and the user is never charged automatically, while the current onboarding flow
requires a card and creates an automatically renewing subscription. The trial terms
must be consistent everywhere.

Finally, the current system cannot safely persist a product before checkout without
additional gating:

- new profiles are created with `active_trial = true` and a seven-day billing period
  at signup;
- `runOnboardingJobs()` creates outreach sequences while it discovers prospects;
- recurring jobs commonly treat `active_trial` as eligible;
- `onboarding_completed` currently also acts as the dashboard/payment gate.

The implementation must resolve these semantics rather than simply moving the
existing `runOnboardingJobs()` call earlier.

## Desired user journey

### 1. Complete setup without a card

Keep the existing URL, product, competitors, keywords, and important-pages steps.
Replace the final plan/paywall screen with a preview submission action.

Suggested CTA:

> Find my opportunities

On submit:

- validate and persist the onboarding data to the database immediately;
- create or reuse exactly one onboarding product for this attempt;
- enqueue a preview-safe background job;
- move the user to `/onboarding/preview` without waiting for discovery to finish.

The database is the source of truth. Do not rely on the current 30-minute pending
cookie for a multi-minute asynchronous job or for returning on another device.

### 2. Show an honest processing state

`/onboarding/preview` initially shows:

> We’re analyzing your site
>
> This normally takes 2–3 minutes. You can close this page — we’ll email you when
> your opportunities are ready.

Also show the signed-in destination email and a concise list of work in progress,
such as crawling target pages, checking relevant sites, and scoring fit.

If the user stays on the page, poll or subscribe to the preview status and transition
to the results automatically when ready. Do not force them to wait and do not use a
fake progress percentage.

Persist an explicit preview lifecycle rather than inferring it from prospect count:

- `pending`
- `processing`
- `ready`
- `partial`
- `failed`

Also persist request, completion, and results-email timestamps so retries and email
delivery are idempotent. The exact table/column location can be decided during
implementation, but the state must survive refreshes, sign-out, and another device.

### 3. Run a preview-safe discovery pipeline

Add an explicit preview mode or a separate preview orchestration path. It may reuse
the existing crawl, discovery, scoring, and email-copy helpers, but it must not call
the parts that create or assign sendable sequences.

Preview discovery behavior:

- use the real onboarding crawl, discovery, and scoring coverage across all five
  strategies, retaining every qualified opportunity up to the onboarding safety
  bound;
- show the target domain/page, useful authority/traffic signals, fit rationale, and
  proposed placement angle;
- perform no contact enrichment, email verification, outreach drafting,
  sending-account allocation, or follow-up-sequence generation before checkout.

If zero usable opportunities are found, do not send a triumphant conversion email or
push the user into checkout. Show/send an honest partial or no-results state, retain
their setup, and give the founder/support path enough information to investigate.

### 4. Send the results-ready email

Send one transactional email after the preview reaches `ready` or `partial`. This is
the completion notice for analysis the user explicitly requested, not a generic
newsletter blast.

Suggested subject:

> We found {{count}} backlink opportunities for {{productName}}

The email should include:

- the product/site analyzed;
- the total preview count;
- up to three concise opportunity summaries: domain, authority/traffic signal, why
  it fits, and the proposed angle;
- a clear statement that nothing has been sent;
- one primary CTA: **Review my opportunities**.

The primary CTA deep-links to `/onboarding/preview`; it does **not** send the user
directly to Stripe and should not be labelled “Start free trial.” The user must be
able to inspect the evidence before being asked for a card.

Suggested trust line:

> Nothing has been sent. Review the matches first, then decide whether you want
> Mentiohunt to run the outreach.

Adapt or replace the existing onboarding summary email rather than sending both.
Ensure a job retry cannot send duplicate results emails.

### 5. Show the completed preview

The ready state on `/onboarding/preview` shows all qualified preview results (up to
the onboarding safety bound) with enough detail to
judge quality:

- target site and relevant page;
- domain authority/traffic where available;
- the user's target page/content being promoted;
- plain-language fit rationale;
- suggested placement/pitch angle.

Do not blur every useful field. The user needs a genuine product experience, not a
locked screenshot. It is acceptable to show a truthful count such as “4 additional
matches are ready after activation,” but only if those matches actually exist.

Repeat that no emails have been sent. The page's primary CTA is:

> Start outreach free for 7 days

### 6. Present transparent trial terms before Stripe

Immediately beside the activation CTA, disclose:

- `$0 today`;
- `Card required`;
- the exact trial end/first charge date;
- `$49/month after the trial`;
- automatic renewal unless cancelled;
- where cancellation happens;
- whether/when a trial-ending reminder will be sent.

Example:

> $0 today. Card required. Your trial ends September 16, then $49/month. Cancel
> anytime from Billing before then. We’ll email you before the trial ends.

Enable and verify Stripe's trial-ending/customer emails or send the equivalent
compliant notification ourselves. The cancellation path must work in-app without
contacting support.

Update all public and product copy to use the same terms. In particular, audit:

- homepage hero and hero variants;
- landing-page pricing and `/pricing`;
- FAQ and `/pricing.md`;
- signup/auth supporting copy;
- onboarding preview and Stripe pre-checkout copy;
- trial, expiration, and billing emails.

Replace “no credit card” with the precise distinction:

> No card required to see your personalized opportunities. A card is required only
> when you choose to start automated outreach.

### 7. Activate outreach only after checkout succeeds

After successful Stripe Checkout:

- begin the 7-day trial at that moment, not at account creation or preview request;
- set `active_trial`, tier, billing dates, Stripe customer, and
  `onboarding_completed` consistently;
- promote/reuse the existing preview product rather than creating a duplicate;
- create sendable sequences for eligible preview prospects;
- run any deferred contact enrichment and email verification;
- keep future recurring discovery available under paid-trial limits without
  rerunning the completed onboarding discovery during activation;
- redirect to the post-checkout welcome/dashboard flow.

Abandoning or cancelling Checkout leaves the preview and setup intact. Returning to
the email link must reopen the preview rather than restart onboarding.

## Eligibility and safety requirements

The preview product existing in the database must not accidentally make a free user
eligible for paid work.

- New accounts must not be created with `active_trial = true` before checkout.
- Trial start/end timestamps must not be populated until checkout succeeds.
- Every recurring discovery path and the outreach sender must require an explicitly
  entitled, onboarding-complete account.
- Preview prospects must never enter `pending`, `scheduled`, or another sender-picked
  outreach state before activation.
- Preview generation must be idempotent for the same onboarding submission.
- Limit to one free preview per verified account/domain within a configurable period.
- Rate-limit preview creation and protect it against disposable-email and automated
  abuse using existing auth signals where practical.
- A failed/partial preview must be retryable by an internal job without duplicating
  products, prospects, drafts, or emails.

## Recovery emails

The existing feedback sequence derives `onboarding_payment_pending` from the presence
of a saved product. Persisting setup before the preview should finally make that
stage observable, but it must distinguish:

- preview still processing;
- preview ready but never viewed;
- preview viewed but trial CTA not clicked;
- Checkout started but not completed.

Do not send a “stuck onboarding” email while the preview is legitimately processing.
Do not claim the product is saved unless it actually exists in the database.

Recommended lightweight recovery:

- results-ready email immediately after completion;
- one reminder after 24 hours only if the preview email/page was not opened;
- founder-style question after a viewed preview or abandoned checkout asking whether
  the blocker was match quality, card requirement, price, trust, timing, or a broken
  checkout.

Keep marketing follow-ups and unsubscribe handling compliant; the initial requested
results notice remains transactional.

## Analytics and measurement

The current `onboarding_completed` client event is no longer emitted by the
server-side checkout finalizer, and the event immediately before redirect can be lost
before PostHog flushes. Record critical lifecycle events server-side or from Stripe
webhooks where appropriate.

Required events:

- `onboarding_preview_requested`
- `onboarding_preview_started`
- `onboarding_preview_ready` (`result_count`, `duration_ms`, `cost_usd`, `status`)
- `onboarding_preview_failed` (`reason`, `duration_ms`, `cost_usd`)
- `onboarding_preview_email_sent` (`result_count`, `status`)
- `onboarding_preview_email_clicked`
- `onboarding_preview_viewed` (`result_count`, `status`)
- `onboarding_trial_cta_clicked`
- `checkout_session_created` (`plan`, `context`, `card_required`)
- `checkout_completed` (`plan`, `trial_days`)
- `checkout_expired` or an equivalent reliable abandonment signal
- `trial_started`

Avoid duplicate client and webhook captures for the same transition. Include stable
properties for acquisition source, product id, plan, and preview state where useful,
but do not put sensitive onboarding content in analytics.

Primary funnel:

1. setup completed / preview requested;
2. preview ready;
3. preview viewed;
4. trial CTA clicked;
5. checkout completed;
6. first outreach sent;
7. first human reply;
8. first paid charge / retained at day 30.

Do not optimize trial-to-paid conversion alone. Compare paid customers per qualified
onboarding completion and track preview cost per activated trial and per paid
customer.

## Acceptance criteria

- A new user can submit complete onboarding data without entering payment details.
- The setup is stored in the database before background work begins and survives a
  closed tab, expired cookie, sign-out, and another device.
- The processing screen explicitly says the user may leave and will receive an email.
- A user who remains on the page sees results automatically when processing finishes.
- Exactly one results-ready email is sent for a successful/partial preview.
- The email CTA opens a reviewable personalized preview, not Stripe.
- The preview displays every complete real opportunity found by the onboarding-safe
  discovery pass, up to the explicit safety bound.
- No contact enrichment, outreach draft, sendable sequence, sending-account
  assignment, automated outreach, or recurring paid job runs before checkout.
- Starting Stripe Checkout does not destroy the preview; cancellation returns to it.
- Successful checkout starts a fresh 7-day trial, reuses the preview product, and
  activates outreach without duplicate products/prospects.
- The exact card, renewal, price, cancellation, and reminder terms are visible before
  Stripe and consistent across the public site, onboarding, and billing emails.
- New accounts no longer consume trial days merely by signing up.
- PostHog can distinguish preview abandonment, CTA abandonment, Stripe abandonment,
  successful trial activation, first send, first reply, and paid conversion.

## Tests

- Complete setup, close the browser during processing, follow the email on another
  device, and see the same persisted results.
- Refresh or double-submit setup and verify only one product and one preview job
  exist.
- Retry a failed job and verify prospects and the results email are not duplicated.
- Verify a preview-only account remains ineligible for every daily discovery and
  outreach sender job.
- Verify no outreach sequence exists before checkout, including when an email account
  can be resolved from the shared pool.
- Abandon and cancel Stripe Checkout; verify the preview remains available and no
  trial dates or paid eligibility are written.
- Complete Checkout; verify the Stripe customer, tier, billing dates, trial state,
  onboarding state, sequence activation, and redirect are correct.
- Refresh the checkout-complete URL; verify finalization and sequence activation are
  idempotent.
- Produce 0, partial, and 3+ preview results and verify the page/email language is
  truthful in every case.
- Verify trial-ending reminders and cancellation links against a Stripe test clock.
- Verify every required analytics event fires once with the expected properties and
  that the end-to-end funnel can be queried without using pageview proxies.
- Verify the current `NEXT_REDIRECT` control flow is not treated as a product error in
  error tracking.

## Rollout and decision rule

Do not split the current low traffic into an A/B test. Roll this out sequentially to
the next 20 qualified onboarding completions behind a reversible flag/config switch.

Review:

- preview completion and view rate;
- preview-to-trial activation;
- Stripe completion after the preview;
- first-send and first-reply activation;
- trial-to-paid conversion and day-30 retention;
- compute/enrichment/email cost per preview, trial, and paid customer;
- qualitative reasons from preview and checkout abandoners.

Keep the preview if it materially improves end-to-end paid customer creation at an
acceptable acquisition cost. Do not declare success merely because more users enter
a nominal trial.

## Out of scope

- A permanent freemium sending tier.
- Sending outreach without a card/active entitlement.
- Guaranteeing backlinks or replies within the trial.
- Broad redesign of the post-activation dashboard.
- An annual plan or pricing-level experiment unrelated to the onboarding gate.

## Relevant files

- `apps/web/components/onboarding/onboarding-wizard.tsx` — persist setup and request
  preview instead of redirecting directly to Stripe
- `apps/web/components/onboarding/onboarding-wizard.tsx` — submit the preview from
  the final setup step; the old standalone paywall step has been removed
- `apps/web/app/onboarding/page.tsx` — onboarding entry and state routing
- `apps/web/app/onboarding/checkout-complete/route.ts` — promote the existing preview
  product and activate outreach idempotently
- `apps/web/app/onboarding/welcome/page.tsx` — post-checkout destination
- `apps/web/actions/stripe-buy-plan-redirect.ts` — preview-context return/cancel URLs,
  explicit trial start, and checkout lifecycle analytics
- `apps/web/app/api/auth/_handle-new-user.ts` — stop starting the trial at signup
- `apps/web/lib/onboarding/pending-cookie.ts` — remove as onboarding persistence source
  once setup is stored before preview
- `apps/web/lib/onboarding/start-discovery-jobs.ts` — add/use a preview-safe background
  entry point
- `apps/server/src/routes/onboarding-complete.ts` — split preview work from activated
  onboarding work
- `apps/server/src/processes/onboarding/run-onboarding-jobs.ts` — ensure preview mode
  cannot resolve accounts, create/assign sequences, or send activation messaging
- `apps/server/src/processes/onboarding/prospect-sequences.ts` — activate eligible
  preview prospects only after checkout
- `apps/server/src/processes/onboarding/summary-email.ts` and
  `apps/server/src/helpers/emails/send-onboarding-complete.ts` — results-ready email
- `apps/server/src/email-sequences/feedback-stage.ts` and `feedback-sequence.ts` —
  lifecycle-aware recovery copy
- `apps/server/src/jobs/daily-backlink-discovery.ts`,
  `prospect-outreach-sender.ts`, and related eligibility helpers — exclude preview-only
  accounts
- `apps/web/consts/billing.ts`, `apps/web/consts/faq.ts`, landing pricing/hero copy,
  and `apps/web/app/pricing.md/route.ts` — consistent trial terms
- `apps/web/lib/analytics.ts`, `apps/web/lib/analytics-events.ts`, and
  `docs/resources/analytics-events.md` — reliable preview/checkout funnel events
- `packages/supabase/database-types.ts` and `supabase/migrations/` — explicit preview
  lifecycle and timestamps, followed by regenerated types
