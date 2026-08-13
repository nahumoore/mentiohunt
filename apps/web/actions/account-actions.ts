"use server"

import { supabaseServer } from "@/lib/supabase/server"
import { pauseAllOutreachForUser, resumeAllOutreachForUser } from "@/lib/outreach/account-sequences"

/** One-shot bulk cancel: pauses every pending outreach send across all of
 * the account's products, without touching the account itself. Discovery
 * keeps running and new opportunities still get sequences as normal. */
export async function stopAllOutreach() {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  try {
    const pausedCount = await pauseAllOutreachForUser(user.id)
    return { pausedCount }
  } catch {
    return { error: "Failed to stop outreach." }
  }
}

/** Persistent state: stops outreach (same mechanism as stopAllOutreach) and
 * marks the account deactivated so the daily discovery job skips it. Data
 * is kept as-is -- this is reversible via reactivateAccount. */
export async function deactivateAccount() {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  try {
    await pauseAllOutreachForUser(user.id)
  } catch {
    return { error: "Failed to stop outreach." }
  }

  const deactivatedAt = new Date().toISOString()
  const { error } = await supabase
    .from("profiles")
    .update({ deactivated_at: deactivatedAt })
    .eq("id", user.id)

  if (error) return { error: error.message }

  return { deactivated_at: deactivatedAt }
}

/** Reverses deactivateAccount: clears deactivated_at so discovery resumes,
 * then resumes the paused sequences with a staggered schedule (not all at
 * once). */
export async function reactivateAccount() {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("profiles")
    .update({ deactivated_at: null })
    .eq("id", user.id)

  if (error) return { error: error.message }

  try {
    const resumedCount = await resumeAllOutreachForUser(user.id)
    return { deactivated_at: null, resumedCount }
  } catch {
    return { error: "Account reactivated, but resuming outreach failed. Contact support." }
  }
}
