# Funnel event catalog

Verified against PostHog project "Mentiohunt" (id 422640) live event schema and cross-checked against actual event sequencing (`query-paths` from `onboarding_started`) as of 2026-09. Confirm these still exist and are still ordered this way via `read-data-schema` / `query-paths` before relying on them (see SKILL.md Step 1) — this file is a starting point, not a live source of truth, and traffic volume is currently low (tens of events/month per step), so the observed order could shift as volume grows.

## 1. Top of funnel (marketing site)

- `landing_page_viewed` — landing page view. The top of the whole funnel.
- `pricing_page_viewed` — pricing page view. Can happen before onboarding (comparison shopping) or later (mid-flow upsell) — check `$current_url` / timing relative to other steps if it matters which.
- `$pageview` — generic pageview, fires everywhere. Use `landing_page_viewed` for top-of-funnel specifically rather than filtering `$pageview` by path, unless the specific page isn't covered by a dedicated event.

## 2. Onboarding (happens BEFORE signup — no account required)

Confirmed order from `query-paths`: `onboarding_started` → `onboarding_site_fetched` → `onboarding_ai_generated` → `onboarding_step_completed` (repeats) → `onboarding_company_submitted` → more `onboarding_step_completed`. This is the async, no-card preview — see `docs/mentiohunt` for product context. Don't assume signup precedes this.

- `onboarding_started` — entry point, no account needed yet.
- `onboarding_site_fetched` — the product fetched/analyzed the user's site.
- `onboarding_ai_generated` — AI-generated preview/output produced.
- `onboarding_company_submitted` — user submitted company info (can occur before or interleaved with `onboarding_ai_generated` — observed in both positions).
- `onboarding_preview_viewed` — user saw the generated preview.
- `onboarding_step_completed` — fires once per step; a step-by-step onboarding sub-funnel needs to either filter by step property or treat this as a repeated-completion count rather than a single funnel node.
- `onboarding_setup_saved` — setup persisted.
- `onboarding_completed` — successful end of onboarding.
- `onboarding_failed` — negative outcome; worth checking directly (via `query-trends`) when a drop-off investigation is technical rather than behavioral.
- `onboarding_trial_cta_clicked` — click on the trial/paywall CTA; typically the bridge from onboarding toward signup/checkout.
- `activation_step_completed` — post-onboarding activation milestone; useful for "did they actually get value" follow-up questions, less central to the core landing→paid funnel.

## 3. Signup / signin (typically happens AFTER onboarding, sometimes on a separate later visit)

- `signup_page_viewed` → `signup_started` → `user_signed_up` — the core signup sequence. Treat as its own funnel segment rather than chaining it directly after onboarding events in one strict-ordered funnel — the gap between onboarding and signup can be hours, and forcing them into one sequential funnel will undercount real conversions that happened on a return visit.
- `signup_confirmation_prompt_shown` — shown when confirmation is required.
- `email_confirmation_started` → `email_confirmation_completed` — email verification sub-flow.
- `oauth_started` — OAuth signup path (alternative entry to `signup_started`).
- `signin_page_viewed` → `signin_started` → `user_signed_in` (or `signin_failed`) — returning-user path, not new-conversion, but useful if diagnosing "signup" numbers that look inflated by returning users.

## 4. Checkout / paid conversion

- `checkout_session_created` — checkout started, NOT completed. Properties: `plan`, `product_id`, `tier`, `card_required` (boolean), `context`.
- No discrete "payment succeeded" event exists. See SKILL.md's "Why paid conversion needs special handling" — use person properties `active_trial` (boolean) and `$virt_mrr` / `$virt_revenue` (numeric) instead.

## 5. Post-signup product activation (usually out of the core funnel, but relevant for "why isn't onboarding converting" style investigations)

- `walkthrough_shown` → `walkthrough_opened` → `walkthrough_step_viewed` → `walkthrough_completed` — in-product walkthrough.
- `discovery_settings_saved`, `link_tracker_viewed`, `tracked_link_added` — core product actions once a user is set up.
- `opportunities_list_viewed`, `opportunity_viewed` — engagement with the core prospecting feature.
- `playbook_modal_shown`, `playbook_modal_dismissed` — in-app prompts.

## 6. Explicitly out of scope for this skill

- `cancellation_reason_selected`, `cancellation_confirmed`, `cancellation_offer_declined` — churn/offboarding. This skill stops at trial→paid; a separate retention/churn analysis would cover these if ever built.

## Useful person properties for breakdowns

- `$initial_utm_source` / `$initial_utm_medium` / `$initial_utm_campaign` / `$initial_utm_content` / `$initial_utm_term` — first-touch attribution (prefer `$initial_*` over the non-initial versions for "how did this person originally arrive" questions; the non-initial versions reflect their *most recent* visit, which is a different question).
- `$initial_referring_domain` / `$virt_initial_referring_domain_type` / `$virt_initial_channel_type` — referrer and channel classification.
- `$initial_device_type` / `$device_type` — device.
- `active_trial` (boolean), `onboarding_completed` (boolean), `$virt_mrr` / `$virt_revenue` (numeric), `tier` — account/paid status.
