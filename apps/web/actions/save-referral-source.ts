"use server"

import { REFERRAL_SOURCE_LABELS, referralSourceSchema } from "@/consts/onboarding"
import { supabaseServer } from "@/lib/supabase/server"

/**
 * Persists the answer from /onboarding/welcome, the dedicated post-checkout
 * page that replaced the old mid-wizard company/role/referral-source step.
 * Only ever writes referral_source once — the page itself redirects away
 * once it's set, so this doesn't need its own idempotency guard.
 */
export async function saveReferralSource(input: {
  referralSource: string
  referralDetail: string
}) {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const result = referralSourceSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid referral source." }
  }

  // Store the human label, not the slug, so the column reads the same way as
  // the free-text rows written before this page existed.
  const { referralSource, referralDetail } = result.data
  const label = REFERRAL_SOURCE_LABELS[referralSource]
  const value = referralDetail ? `${label}: ${referralDetail}` : label

  const { error } = await supabase
    .from("profiles")
    .update({ referral_source: value })
    .eq("id", user.id)

  if (error) return { error: error.message }

  return { referral_source: value }
}
