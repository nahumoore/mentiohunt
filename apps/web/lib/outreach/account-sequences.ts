import { supabaseAdmin } from "@workspace/supabase/admin"
import { nextStaggeredSlotAfter } from "./schedule"

async function prospectIdsForUser(userId: string): Promise<string[]> {
  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("user_id", userId)
  const productIds = products?.map((p) => p.id) ?? []
  if (!productIds.length) return []

  const { data: prospects } = await supabaseAdmin
    .from("backlink_prospects")
    .select("id")
    .in("product_id", productIds)

  return prospects?.map((p) => p.id) ?? []
}

/** Whether the user has any outreach still queued to send. Used to render
 * "Stop all outreach" as already-disabled on load, without waiting for a
 * client action. */
export async function hasPendingOutreachForUser(userId: string): Promise<boolean> {
  const prospectIds = await prospectIdsForUser(userId)
  if (!prospectIds.length) return false

  const { count, error } = await supabaseAdmin
    .from("prospect_sequences")
    .select("id", { count: "exact", head: true })
    .in("prospect_id", prospectIds)
    .eq("status", "pending")

  if (error) {
    console.error("Error checking pending outreach for user:", error)
    throw error
  }

  return (count ?? 0) > 0
}

/** Called from "Stop all outreach" and "Deactivate account". Distinct from
 * the per-prospect 'paused' status (permanent dismiss) and 'trial_expired'
 * (billing-driven) so resumeAllOutreachForUser only ever touches sequences
 * this action paused, never a prospect the user separately dismissed. */
export async function pauseAllOutreachForUser(userId: string): Promise<number> {
  const prospectIds = await prospectIdsForUser(userId)
  if (!prospectIds.length) return 0

  const { data, error } = await supabaseAdmin
    .from("prospect_sequences")
    .update({ status: "account_paused", last_error: "Outreach stopped by account owner." })
    .in("prospect_id", prospectIds)
    .eq("status", "pending")
    .select("id")

  if (error) {
    console.error("Error pausing outreach for user:", error)
    throw error
  }

  return data?.length ?? 0
}

/** Resumes sequences paused by pauseAllOutreachForUser. Reschedules them one
 * at a time, each landing further out than the last (in business-hour
 * slots), so a large paused batch doesn't land back on the same
 * scheduled_at and fire all at once. Rows are walked oldest-scheduled-first,
 * which preserves each prospect's original step order. */
export async function resumeAllOutreachForUser(userId: string): Promise<number> {
  const prospectIds = await prospectIdsForUser(userId)
  if (!prospectIds.length) return 0

  const { data: dismissed } = await supabaseAdmin
    .from("backlink_prospects")
    .select("id")
    .in("id", prospectIds)
    .eq("status", "dismissed")
  const dismissedIds = new Set(dismissed?.map((p) => p.id) ?? [])

  const { data: paused, error: fetchError } = await supabaseAdmin
    .from("prospect_sequences")
    .select("id, prospect_id, scheduled_at")
    .in("prospect_id", prospectIds)
    .eq("status", "account_paused")
    .order("scheduled_at", { ascending: true })

  if (fetchError) {
    console.error("Error fetching paused sequences for user:", fetchError)
    throw fetchError
  }

  const resumable = paused?.filter((seq) => !dismissedIds.has(seq.prospect_id)) ?? []
  if (!resumable.length) return 0

  let cursor = new Date()
  let resumedCount = 0
  for (const seq of resumable) {
    cursor = nextStaggeredSlotAfter(cursor)
    const { error } = await supabaseAdmin
      .from("prospect_sequences")
      .update({ status: "pending", scheduled_at: cursor.toISOString(), last_error: null })
      .eq("id", seq.id)
      .eq("status", "account_paused")

    if (error) {
      console.error("Error resuming sequence:", seq.id, error)
      continue
    }
    resumedCount++
  }

  return resumedCount
}
