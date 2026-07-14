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
