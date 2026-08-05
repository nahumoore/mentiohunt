export const EVENTS = {
  // Auth
  SIGNUP_PAGE_VIEWED: "signup_page_viewed",
  SIGNUP_STARTED: "signup_started",
  SIGNUP_VALIDATION_FAILED: "signup_validation_failed",
  SIGNUP_FAILED: "signup_failed",
  SIGNUP_CONFIRMATION_PROMPT_SHOWN: "signup_confirmation_prompt_shown",
  OAUTH_STARTED: "oauth_started",
  USER_SIGNED_UP: "user_signed_up",
  SIGNIN_PAGE_VIEWED: "signin_page_viewed",
  SIGNIN_STARTED: "signin_started",
  SIGNIN_VALIDATION_FAILED: "signin_validation_failed",
  SIGNIN_FAILED: "signin_failed",
  USER_SIGNED_IN: "user_signed_in",
  USER_SIGNED_OUT: "user_signed_out",
  MFA_CHALLENGE_STARTED: "mfa_challenge_started",
  MFA_CHALLENGE_FAILED: "mfa_challenge_failed",
  MFA_STEP_VIEWED: "mfa_step_viewed",
  MFA_VERIFICATION_FAILED: "mfa_verification_failed",
  MFA_VERIFIED: "mfa_verified",

  // Onboarding
  ONBOARDING_STARTED: "onboarding_started",
  ONBOARDING_STEP_COMPLETED: "onboarding_step_completed",
  ONBOARDING_SITE_FETCHED: "onboarding_site_fetched",
  ONBOARDING_AI_GENERATED: "onboarding_ai_generated",
  ONBOARDING_COMPLETED: "onboarding_completed",
  ONBOARDING_FAILED: "onboarding_failed",

  // Activation — how a new user gets from "signed up" to "understands this"
  WALKTHROUGH_SHOWN: "walkthrough_shown",
  WALKTHROUGH_OPENED: "walkthrough_opened",
  WALKTHROUGH_COMPLETED: "walkthrough_completed",
  DISCOVERY_WAIT_TASK_OPENED: "discovery_wait_task_opened",
  ACTIVATION_STEP_COMPLETED: "activation_step_completed",
  ACTIVATION_CHECKLIST_ITEM_OPENED: "activation_checklist_item_opened",
  ACTIVATION_CHECKLIST_DISMISSED: "activation_checklist_dismissed",
  NEEDS_YOU_TASK_OPENED: "needs_you_task_opened",

  // Backlink opportunities
  OPPORTUNITIES_LIST_VIEWED: "opportunities_list_viewed",
  OPPORTUNITY_VIEWED: "opportunity_viewed",
  PROSPECT_STATUS_CHANGED: "prospect_status_changed",
  OUTREACH_EMAIL_COPIED: "outreach_email_copied",
  PROSPECT_URL_SUBMITTED: "prospect_url_submitted",
  PROSPECT_URL_SUBMIT_FAILED: "prospect_url_submit_failed",

  // Discovery settings
  DISCOVERY_SETTINGS_SAVED: "discovery_settings_saved",

  // Community mentions
  MENTION_OPENED: "mention_opened",
  REPLY_COPIED: "reply_copied",
  MENTION_MARKED_REPLIED: "mention_marked_replied",
  MENTION_DISMISSED: "mention_dismissed",
  COMMUNITY_WATCHLIST_SAVED: "community_watchlist_saved",

  // Link tracker
  LINK_TRACKER_VIEWED: "link_tracker_viewed",
  TRACKED_LINK_ADDED: "tracked_link_added",
  TRACKED_LINK_ADD_FAILED: "tracked_link_add_failed",
  TRACKED_LINKS_BULK_IMPORTED: "tracked_links_bulk_imported",
  TRACKED_LINK_DELETED: "tracked_link_deleted",
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]
