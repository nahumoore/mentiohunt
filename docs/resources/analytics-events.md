# Analytics Events Catalog

All events fire via `captureEvent()` in `apps/web/lib/analytics.ts`, which forwards to Plausible.

> **Name mapping:** `outreach_email_copied` → `email-draft-copied` in Plausible (see `NAME_MAP`). All other events convert underscores to hyphens automatically.

---

## Auth & Identity

### `landing_page_viewed`
**Source:** `components/landing/landing-page-tracker.tsx`  
**Props:** none

---

### `pricing_page_viewed`
**Source:** `app/pricing/client-page.tsx`  
**Props:** none

---

### `signup_page_viewed`
**Source:** `components/auth/signup-form.tsx`  
**Props:** none

---

### `signup_confirmation_prompt_shown`
**Source:** `components/auth/signup-form.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `method` | `"email"` | Always `email` (email signup only) |

---

### `signup_validation_failed`
**Source:** `components/auth/signup-form.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `method` | `"email"` | Auth method |
| `error_count` | `number` | Number of Zod validation issues |

---

### `signup_started`
**Source:** `components/auth/signup-form.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `method` | `"email" \| "google"` | Auth method chosen |

---

### `signup_failed`
**Source:** `components/auth/signup-form.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `method` | `"email" \| "google"` | Auth method |
| `error_message` | `string` | Supabase error message |

---

### `user_signed_up`
**Source:** `components/auth/signup-form.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `method` | `"email"` | Auth method (email only; Google redirects) |
| `email` | `string` | User's email |

---

### `oauth_started`
**Source:** `components/auth/signup-form.tsx`, `components/auth/signin-form.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `provider` | `"google"` | OAuth provider |
| `flow` | `"signup" \| "signin"` | Which flow triggered it |

---

### `signin_page_viewed`
**Source:** `components/auth/signin-form.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `has_mfa_query` | `boolean` | `true` when arriving with `?2fa=1` |

---

### `signin_validation_failed`
**Source:** `components/auth/signin-form.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `method` | `"email"` | Auth method |
| `error_count` | `number` | Number of Zod validation issues |

---

### `signin_started`
**Source:** `components/auth/signin-form.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `method` | `"email" \| "google"` | Auth method |

---

### `signin_failed`
**Source:** `components/auth/signin-form.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `method` | `"email" \| "google"` | Auth method |
| `error_message` | `string` | Supabase error message |

---

### `user_signed_in`
**Source:** `components/auth/signin-form.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `method` | `"email"` | Auth method (email only; Google redirects) |

---

### `user_signed_out`
**Source:** `components/onboarding/onboarding-wizard.tsx`  
**Props:** none

---

### `email_confirmation_started`
**Source:** `components/auth/confirm-view.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `type` | `string \| null` | OTP type from query param (e.g. `"signup"`) |

---

### `email_confirmation_completed`
**Source:** `components/onboarding/onboarding-wizard.tsx`  
**Props:** none — fires when the wizard mounts with `emailConfirmed=true`

---

### `mfa_challenge_started`
**Source:** `components/auth/signin-form.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `source` | `"signin_query_param"` | Always this value (only fires from `?2fa=1` path) |

---

### `mfa_challenge_failed`
**Source:** `components/auth/signin-form.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `error_message` | `string \| undefined` | Supabase error message |
| `source` | `"signin_query_param" \| "password_signin"` | Where the challenge was initiated |

---

### `mfa_step_viewed`
**Source:** `components/auth/signin-form.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `source` | `"signin_query_param" \| "password_signin"` | How the MFA step was reached |

---

### `mfa_verification_failed`
**Source:** `components/auth/signin-form.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `error_message` | `string` | Supabase error message |

---

### `mfa_verified`
**Source:** `components/auth/signin-form.tsx`  
**Props:** none

---

## Onboarding

### `onboarding_started`
**Source:** `components/onboarding/onboarding-wizard.tsx`  
**Props:** none

---

### `onboarding_site_fetched`
**Source:** `components/onboarding/onboarding-wizard.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `had_sitemap` | `boolean` | Whether a sitemap was found on the user's site |

---

### `onboarding_ai_generated`
**Source:** `components/onboarding/onboarding-wizard.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `field` | `"competitors" \| "product"` | Which field was AI-generated |

---

### `onboarding_step_completed`
**Source:** `components/onboarding/onboarding-wizard.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `step` | `"url" \| "company" \| "product" \| "competitors" \| "audience" \| "launch"` | Step name |
| `step_index` | `number` | 0-based step index |

---

### `onboarding_company_submitted`
**Source:** `components/onboarding/onboarding-wizard.tsx`  
Fires alongside `onboarding_step_completed` when completing step 1 (company).  
| Prop | Type | Description |
|------|------|-------------|
| `company_size` | `string` | Selected company size |
| `role` | `string` | User's role |

---

### `onboarding_completed`
**Source:** `components/onboarding/onboarding-wizard.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `competitors_count` | `number` | Number of competitors submitted |

---

## Opportunities (Link Building)

### `opportunities_list_viewed`
**Source:** `app/dashboard/opportunities/page.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `count` | `number` | Total prospects in the list |

---

### `opportunity_viewed`
**Source:** `app/dashboard/opportunities/[slug]/client-page.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `prospect_id` | `string` | Prospect UUID |
| `tier` | `string` | Opportunity tier (e.g. `"A"`, `"B"`, `"C"`) |

---

### `outreach_email_copied`
**Plausible name:** `email-draft-copied`  
**Source:** `app/dashboard/opportunities/[slug]/client-page.tsx`, `components/link-building/opportunities/outreach-draft.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `prospect_id` | `string` | Prospect UUID |
| `field` | `"subject" \| "body"` | Which field was copied |

---

### `outreach_open_in_client`
**Source:** `app/dashboard/opportunities/[slug]/client-page.tsx`, `components/link-building/opportunities/outreach-draft.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `prospect_id` | `string` | Prospect UUID |
| `client` | `"gmail" \| "outlook" \| "mailto"` | Email client opened |

---

### `opportunity_issue_report_opened`
**Source:** `components/link-building/opportunities/opportunity-report-issue-dialog.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `prospect_id` | `string` | Prospect UUID |
| `domain` | `string \| null` | Prospect domain |

---

### `opportunity_issue_report_submitted`
**Source:** `components/link-building/opportunities/opportunity-report-issue-dialog.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `prospect_id` | `string` | Prospect UUID |
| `domain` | `string \| null` | Prospect domain |

---

### `discovery_settings_saved`
**Source:** `app/dashboard/opportunities/settings/page.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `dr_min` | `number` | Minimum domain rating filter |
| `dr_max` | `number` | Maximum domain rating (`-1` if no max set) |
| `opportunity_types_count` | `number` | Number of active opportunity types |

---

## Directories

### `directories_page_viewed`
**Source:** `app/dashboard/directories/page.tsx`  
Only fires when `submissions.length > 0`.  
| Prop | Type | Description |
|------|------|-------------|
| `total_count` | `number` | Total directory submissions |
| `not_submitted_count` | `number` | Count by status |
| `submitted_count` | `number` | Count by status |
| `indexed_count` | `number` | Count by status |
| `not_indexed_count` | `number` | Count by status |
| `dismissed_count` | `number` | Count by status |

---

### `directories_filter_changed`
**Source:** `app/dashboard/directories/page.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `filter_value` | `DirectorySubmissionStatus \| "all"` | New filter value |

---

### `directories_search_used`
**Source:** `app/dashboard/directories/page.tsx`  
Debounced 600ms. Only fires when query is non-empty.  
| Prop | Type | Description |
|------|------|-------------|
| `query_length` | `number` | Trimmed query character count |
| `result_count` | `number` | Number of filtered results |

---

### `directories_sorted`
**Source:** `app/dashboard/directories/page.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `sort_key` | `"domain" \| "domain_rating" \| "backlinks" \| "discovered_at" \| "status"` | Column sorted |
| `sort_direction` | `"asc" \| "desc"` | New direction |

---

### `directories_bulk_selected`
**Source:** `app/dashboard/directories/page.tsx`  
Only fires when selecting all (not deselecting).  
| Prop | Type | Description |
|------|------|-------------|
| `count` | `number` | Number of rows selected |
| `status_filter` | `DirectorySubmissionStatus \| "all"` | Active filter when selected |

---

### `directories_bulk_status_updated`
**Source:** `app/dashboard/directories/page.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `new_status` | `DirectorySubmissionStatus` | Target status |
| `count` | `number` | Rows actually updated |
| `success` | `boolean` | Whether any rows updated |
| `partial` | `boolean \| undefined` | `true` if fewer rows updated than selected |

---

### `directories_row_clicked`
**Source:** `app/dashboard/directories/page.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `submission_id` | `string` | Submission UUID |
| `status` | `DirectorySubmissionStatus` | Current status |
| `domain_rating` | `number \| null` | Directory DR |
| `is_free` | `boolean \| null` | Whether the directory is free |

---

### `directory_detail_viewed`
**Source:** `app/dashboard/directories/[id]/client-page.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `submission_id` | `string` | Submission UUID |
| `domain` | `string` | Directory domain |
| `status` | `DirectorySubmissionStatus` | Current status |
| `is_free` | `boolean \| null` | Whether the directory is free |
| `domain_rating` | `number \| null` | Directory DR |

---

### `directory_status_updated`
**Source:** `app/dashboard/directories/[id]/client-page.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `submission_id` | `string` | Submission UUID |
| `domain` | `string` | Directory domain |
| `from_status` | `DirectorySubmissionStatus` | Previous status |
| `new_status` | `DirectorySubmissionStatus` | New status |

---

### `directory_marked_submitted`
**Source:** `app/dashboard/directories/[id]/client-page.tsx`  
Fires after submit-assist confirms submission (in addition to `directory_status_updated`).  
| Prop | Type | Description |
|------|------|-------------|
| `submission_id` | `string` | Submission UUID |
| `domain` | `string` | Directory domain |

---

### `directory_external_link_clicked`
**Source:** `app/dashboard/directories/[id]/client-page.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `submission_id` | `string` | Submission UUID |
| `domain` | `string` | Directory domain |

---

### `directory_dismissed`
**Source:** `app/dashboard/directories/[id]/client-page.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `submission_id` | `string` | Submission UUID |
| `domain` | `string` | Directory domain |

---

### `directory_check_listing_clicked`
**Source:** `app/dashboard/directories/[id]/client-page.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `submission_id` | `string` | Submission UUID |
| `domain` | `string` | Directory domain |

---

### `directory_submit_assist_opened`
**Source:** `app/dashboard/directories/[id]/client-page.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `submission_id` | `string` | Submission UUID |
| `domain` | `string` | Directory domain |

---

### `directory_undo_submission`
**Source:** `app/dashboard/directories/[id]/client-page.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `submission_id` | `string` | Submission UUID |
| `domain` | `string` | Directory domain |

---

### `directory_restored`
**Source:** `app/dashboard/directories/[id]/client-page.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `submission_id` | `string` | Submission UUID |
| `domain` | `string` | Directory domain |

---

### `directory_report_opened`
**Source:** `components/link-building/directories/report-dialog.tsx`  
| Prop | Type | Description |
|------|------|-------------|
| `domain` | `string` | Directory domain being reported |

---

## Event Count Summary

| Domain | Events |
|--------|--------|
| Auth & Identity | 20 |
| Onboarding | 6 |
| Opportunities | 7 |
| Directories | 14 |
| **Total** | **47** |
