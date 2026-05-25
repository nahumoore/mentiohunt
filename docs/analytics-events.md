# Analytics Events

All events fired client-side via `apps/web/lib/analytics.ts` → `posthog-js`.

## Auth

| Event | When |
|-------|------|
| `signup_page_viewed` | Sign-up page loads |
| `signup_started` | User submits sign-up form |
| `signup_failed` | Server returns error on sign-up |
| `signup_validation_failed` | Client-side validation fails before submit |
| `signup_confirmation_prompt_shown` | Email confirmation prompt shown after sign-up |
| `signin_page_viewed` | Sign-in page loads |
| `signin_started` | User submits sign-in form |
| `signin_failed` | Server returns error on sign-in |
| `signin_validation_failed` | Client-side validation fails before submit |
| `oauth_started` | User clicks OAuth provider button |
| `email_confirmation_started` | User clicks email confirmation link |
| `email_confirmation_viewed` | Email confirmation page loads |
| `mfa_step_viewed` | MFA challenge page loads |
| `mfa_challenge_started` | User submits MFA code |
| `mfa_challenge_failed` | MFA challenge returns error |
| `mfa_verification_failed` | MFA code incorrect |
| `mfa_verified` | MFA passes successfully |
| `user_signed_in` | Session created after sign-in |
| `user_signed_up` | Account created successfully |
| `user_signed_out` | User signs out |

## Onboarding

| Event | When |
|-------|------|
| `onboarding_started` | User enters onboarding wizard |
| `onboarding_step_completed` | User advances a step |
| `onboarding_completed` | Wizard finishes |
| `onboarding_site_fetched` | System fetches user's site URL |
| `onboarding_ai_generated` | AI generates initial settings from site data |

## Link Building — Opportunities

| Event | When |
|-------|------|
| `opportunities_list_viewed` | Opportunities list page loads |
| `opportunity_viewed` | User opens an opportunity detail |
| `outreach_email_copied` | User copies the outreach email draft |
| `outreach_open_in_client` | User opens draft in email client |

## Link Building — Directories

| Event | When |
|-------|------|
| `directories_page_viewed` | Directories page loads |
| `directories_row_clicked` | User clicks a directory row |
| `directories_filter_changed` | User changes a filter |
| `directories_sorted` | User sorts the table |
| `directories_search_used` | User types in search box |
| `directories_bulk_selected` | User selects multiple directories |
| `directories_bulk_status_updated` | User updates status on bulk selection |
| `directory_detail_viewed` | Directory detail panel opens |
| `directory_status_updated` | Status changed on a single directory |
| `directory_dismissed` | Directory dismissed from queue |
| `directory_restored` | Dismissed directory restored |
| `directory_submit_assist_opened` | Submit Assist sheet opened |
| `directory_marked_submitted` | Directory marked as submitted |
| `directory_undo_submission` | Submission undone |
| `directory_check_listing_clicked` | User clicks "check listing" link |
| `directory_external_link_clicked` | User opens directory external URL |
| `directory_report_opened` | User opens report dialog |
| `discovery_settings_saved` | User saves discovery settings |

## Community Mentions

| Event | When |
|-------|------|
| `mention_opened` | User opens a mention |
| `mention_dismissed` | User dismisses a mention |
| `mention_marked_replied` | Mention marked as replied |
| `reply_copied` | User copies suggested reply |
| `reply_confirmation` | User confirms reply was sent |
| `community_watchlist_saved` | User saves watchlist settings |
