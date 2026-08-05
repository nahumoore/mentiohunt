// Local types for the tracked_links / tracked_link_events tables, matching
// supabase/migrations/20260805120000_add_link_tracker.sql. Written by hand
// because `pnpm supabase:types` regenerates packages/supabase/database-types.ts
// only after the migration is applied to the linked project — once that's
// done these can be swapped for `Tables<"tracked_links">` etc without any
// call-site changes (same field names/shapes).

import type { CheckLinkOutcome } from "../../helpers/link-tracker/check-link-client.js"

export type TrackedLinkStatus =
  | "pending"
  | "live"
  | "nofollow"
  | "target_changed"
  | "removed"
  | "page_dead"
  | "check_failed"

export type TrackedLinkChangeType =
  | "link_removed"
  | "link_restored"
  | "rel_added"
  | "rel_removed"
  | "anchor_changed"
  | "target_url_changed"
  | "target_now_competitor"
  | "source_page_dead"
  | "source_page_recovered"
  | "source_page_redirected"
  | "check_failed_persistent"

export type RecentCheckEntry = {
  at: string
  outcome: CheckLinkOutcome
  status_code: number | null
}

export type TrackedLinkRow = {
  id: string
  product_id: string
  source_url: string
  source_domain: string
  expected_target_url: string | null
  label: string | null
  origin: "manual" | "bulk_import"
  status: TrackedLinkStatus
  issue_since: string | null
  observed_href: string | null
  observed_anchor_text: string | null
  observed_rel: string[]
  observed_http_status: number | null
  observed_final_url: string | null
  first_seen_href: string | null
  first_seen_anchor_text: string | null
  first_seen_rel: string[] | null
  first_seen_at: string | null
  last_checked_at: string | null
  last_ok_at: string | null
  next_check_at: string
  consecutive_failures: number
  consecutive_missing: number
  recent_checks: RecentCheckEntry[]
  created_at: string
  updated_at: string
}

/** Snapshot embedded in an event's `previous`/`current` jsonb — enough for
 * the email digest to render a "before -> after" line without a join. */
export type LinkSnapshot = {
  href: string | null
  anchor_text: string | null
  rel: string[] | null
  status: TrackedLinkStatus | null
  http_status: number | null
  competitor_domains?: string[]
  initial?: boolean
}

export type TrackedLinkEventDraft = {
  change_type: TrackedLinkChangeType
  previous: LinkSnapshot | null
  current: LinkSnapshot | null
  /** Set only for the "first check finds nothing" fast path — pre-excludes
   * the event from the digest since it's almost always a bad submitted URL,
   * not a real removal. */
  preNotified?: boolean
}
