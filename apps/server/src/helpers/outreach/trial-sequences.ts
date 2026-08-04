import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger } from "../logger.js"

const log = createLogger("trial-sequences")

async function prospectIdsForUsers(userIds: string[]): Promise<string[]> {
  if (!userIds.length) return []
  const { data: products } = await supabaseAdmin.from("products").select("id").in("user_id", userIds)
  const productIds = products?.map((p) => p.id) ?? []
  if (!productIds.length) return []

  const { data: prospects } = await supabaseAdmin
    .from("backlink_prospects")
    .select("id")
    .in("product_id", productIds)

  return prospects?.map((p) => p.id) ?? []
}

/** Called the moment a free trial is deactivated, so pending sends stop
 * immediately instead of waiting for each row's own scheduled_at and being
 * lazily discovered by the sender cron (which could be days later for
 * later steps in a sequence). */
export async function pauseSequencesForUsers(userIds: string[]): Promise<void> {
  const prospectIds = await prospectIdsForUsers(userIds)
  if (!prospectIds.length) return

  const { data, error } = await supabaseAdmin
    .from("prospect_sequences")
    .update({ status: "trial_expired", last_error: "Owner's free trial has expired." })
    .in("prospect_id", prospectIds)
    .eq("status", "pending")
    .select("id")

  if (error) {
    log.error("failed to pause sequences for expired trial", { error: error.message })
    return
  }

  if (data?.length) {
    log.info("paused sequences for expired trial", { count: data.length, userCount: userIds.length })
  }
}

/** Called directly from the Stripe webhook the moment a user's subscription
 * makes them paid again, so outreach resumes instantly instead of waiting
 * for the periodic sweep below. Caller already knows eligibility (tier is
 * pro/agency), so this skips the recheck the sweep does. */
export async function resumeSequencesForUsers(userIds: string[]): Promise<void> {
  const prospectIds = await prospectIdsForUsers(userIds)
  if (!prospectIds.length) return

  const { data, error } = await supabaseAdmin
    .from("prospect_sequences")
    .update({ status: "pending", scheduled_at: new Date().toISOString(), last_error: null })
    .in("prospect_id", prospectIds)
    .eq("status", "trial_expired")
    .select("id")

  if (error) {
    log.error("failed to resume sequences for users", { error: error.message })
    return
  }

  if (data?.length) {
    log.info("resumed sequences for users", { count: data.length, userCount: userIds.length })
  }
}

/** Periodic sweep: a trial_expired sequence is stuck until something
 * proactively resumes it (the sender cron only ever looks at pending rows).
 * Re-checks every trial_expired row's owner and resumes anyone who's now
 * eligible again — paid upgrade or a manually granted trial extension,
 * whichever happened. */
export async function resumeEligibleTrialExpiredSequences(): Promise<void> {
  const { data: expiredSequences } = await supabaseAdmin
    .from("prospect_sequences")
    .select("prospect_id")
    .eq("status", "trial_expired")

  const prospectIds = [...new Set(expiredSequences?.map((s) => s.prospect_id) ?? [])]
  if (!prospectIds.length) return

  const { data: prospects } = await supabaseAdmin
    .from("backlink_prospects")
    .select("id, product_id")
    .in("id", prospectIds)

  const productIds = [...new Set(prospects?.map((p) => p.product_id) ?? [])]
  if (!productIds.length) return

  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id, user_id")
    .in("id", productIds)

  const userIds = [...new Set(products?.map((p) => p.user_id) ?? [])]
  if (!userIds.length) return

  const { data: eligibleProfiles } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .in("id", userIds)
    .or("tier.neq.free,active_trial.eq.true")

  const eligibleUserIds = new Set(eligibleProfiles?.map((p) => p.id) ?? [])
  if (!eligibleUserIds.size) return

  const eligibleProductIds = new Set(
    products?.filter((p) => eligibleUserIds.has(p.user_id)).map((p) => p.id) ?? []
  )
  const eligibleProspectIds =
    prospects?.filter((p) => eligibleProductIds.has(p.product_id)).map((p) => p.id) ?? []
  if (!eligibleProspectIds.length) return

  const { data, error } = await supabaseAdmin
    .from("prospect_sequences")
    .update({ status: "pending", scheduled_at: new Date().toISOString(), last_error: null })
    .in("prospect_id", eligibleProspectIds)
    .eq("status", "trial_expired")
    .select("id")

  if (error) {
    log.error("failed to resume trial-expired sequences", { error: error.message })
    return
  }

  if (data?.length) {
    log.info("resumed trial-expired sequences", { count: data.length, userCount: eligibleUserIds.size })
  }
}
