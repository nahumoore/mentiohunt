"use server"

import { supabaseServer } from "@/lib/supabase/server"
import {
  pauseAllOutreachForUser,
  resumeAllOutreachForUser,
} from "@/lib/outreach/account-sequences"

/** Pauses everything: cancels every pending outreach send across the
 * account's products and marks the account paused so daily discovery skips
 * it and the sender refuses any sequence it finds for it — until the user
 * resumes it themselves via resumeOutreach. */
export async function stopAllOutreach() {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  try {
    const pausedCount = await pauseAllOutreachForUser(user.id)

    const outreachPausedAt = new Date().toISOString()
    const { error } = await supabase
      .from("profiles")
      .update({ outreach_paused_at: outreachPausedAt })
      .eq("id", user.id)

    if (error) return { error: error.message }

    return { pausedCount, outreach_paused_at: outreachPausedAt }
  } catch {
    return { error: "Failed to stop outreach." }
  }
}

/** Reverses stopAllOutreach: clears outreach_paused_at so discovery and the
 * sender resume, then reschedules the paused sequences with a staggered
 * schedule (not all at once). */
export async function resumeOutreach() {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("profiles")
    .update({ outreach_paused_at: null })
    .eq("id", user.id)

  if (error) return { error: error.message }

  try {
    const resumedCount = await resumeAllOutreachForUser(user.id)
    return { outreach_paused_at: null, resumedCount }
  } catch {
    return { error: "Outreach resumed, but restarting the paused emails failed. Contact support." }
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
