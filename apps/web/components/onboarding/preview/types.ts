import type { Tables } from "@workspace/supabase/database-types"

/** Exactly the prospect columns the preview page selects. */
export type PreviewProspect = Pick<
  Tables<"backlink_prospects">,
  | "id"
  | "domain"
  | "found_url"
  | "target_url"
  | "domain_rating"
  | "site_relevance_score"
  | "tier"
>

/** Everything the finished-preview layout needs, resolved once by the page. */
export type PreviewResultsProps = {
  productName: string
  websiteUrl: string
  /** Bare hostname, e.g. "mentiohunt.com". */
  siteHost: string
  prospects: PreviewProspect[]
  /** Pre-formatted, e.g. "September 12, 2025". */
  trialEndsOn: string
  /** Monthly price after the trial, digits only, e.g. "49". */
  planPrice: string
  trialDays: number
  /** Drives the Stripe Checkout redirect. */
  productId: string
}
