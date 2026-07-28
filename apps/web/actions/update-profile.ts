"use server"

import { supabaseServer } from "@/lib/supabase/server"

export async function updateProfileName(name: string) {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const trimmed = name.trim()

  const { error } = await supabase
    .from("profiles")
    .update({ name: trimmed || null })
    .eq("id", user.id)

  if (error) return { error: error.message }

  return { name: trimmed || null }
}

/**
 * Stamps the first-login walkthrough as seen. The `.is(null)` guard keeps this
 * idempotent: re-opening the walkthrough from the header button later must not
 * move the original timestamp.
 */
export async function markWalkthroughSeen() {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const seenAt = new Date().toISOString()

  const { error } = await supabase
    .from("profiles")
    .update({ walkthrough_seen_at: seenAt })
    .eq("id", user.id)
    .is("walkthrough_seen_at", null)

  if (error) return { error: error.message }

  return { walkthrough_seen_at: seenAt }
}

export async function updateEmailSettings(settings: {
  alerts: boolean
  marketing: boolean
}) {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("profiles")
    .update({ email_settings: settings })
    .eq("id", user.id)

  if (error) return { error: error.message }

  return { email_settings: settings }
}
