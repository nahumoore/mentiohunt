import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger } from "../helpers/logger.js"
import type { FunnelStage } from "./feedback-sequence.js"

const log = createLogger("feedback-stage")

// Only statuses the user can set from the dashboard. "contacted" and
// "negotiating" are also set by the outreach sender/monitor, so they don't
// prove the user ever looked at their opportunities.
const USER_ACTION_STATUSES = ["dismissed", "won"]

export async function deriveFeedbackStage({
  userId,
  onboardingCompleted,
}: {
  userId: string
  onboardingCompleted: boolean
}): Promise<{ stage: FunnelStage; productName: string | null }> {
  const { data: products, error: productsError } = await supabaseAdmin
    .from("products")
    .select("id, product_name")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (productsError) {
    log.warn("failed to load products", { userId, error: productsError.message })
  }

  const productName = products?.[0]?.product_name?.trim() || null

  if (!onboardingCompleted) {
    return { stage: "stuck_onboarding", productName }
  }

  const productIds = (products ?? []).map((p) => p.id)

  const [prospectActions, reportedIssues] = await Promise.all([
    productIds.length > 0
      ? supabaseAdmin
          .from("backlink_prospects")
          .select("id")
          .in("product_id", productIds)
          .in("status", USER_ACTION_STATUSES)
          .limit(1)
      : Promise.resolve({ data: [], error: null }),
    supabaseAdmin
      .from("reported_issues")
      .select("id")
      .eq("user_id", userId)
      .limit(1),
  ])

  if (prospectActions.error) {
    log.warn("failed to check prospect actions", { userId, error: prospectActions.error.message })
  }
  if (reportedIssues.error) {
    log.warn("failed to check reported issues", { userId, error: reportedIssues.error.message })
  }

  const hasActedOnOpportunities =
    (prospectActions.data?.length ?? 0) > 0 || (reportedIssues.data?.length ?? 0) > 0

  return {
    stage: hasActedOnOpportunities ? "used_opportunities_only" : "onboarding_done_no_action",
    productName,
  }
}
