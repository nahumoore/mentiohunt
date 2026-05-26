import { FREE_TRIAL_DAYS } from "@/consts/billing"
import { supabaseServer } from "@/lib/supabase/server"
import type { TablesInsert } from "@workspace/supabase/database-types"

function getFreeTrialEndsAt(startedAt: Date) {
  const endsAt = new Date(startedAt)
  endsAt.setDate(endsAt.getDate() + FREE_TRIAL_DAYS)
  return endsAt.toISOString()
}

type SupabaseServerClient = Awaited<ReturnType<typeof supabaseServer>>
type AuthUser = NonNullable<
  Awaited<ReturnType<SupabaseServerClient["auth"]["getUser"]>>["data"]["user"]
> & { email: string }

type Result =
  | { redirect: "onboarding" | "dashboard" }
  | { redirect: "error"; reason: string }

export async function handlePostSignin(
  supabase: SupabaseServerClient,
  user: AuthUser
): Promise<Result> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, onboarding_completed")
    .eq("id", user.id)
    .single()

  if (!profile) {
    const name =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null
    const trialStartedAt = new Date().toISOString()
    const profileInsert: TablesInsert<"profiles"> = {
      id: user.id,
      email: user.email,
      name,
      onboarding_completed: false,
      tier: "free",
      active_trial: true,
      billing_period_start_at: trialStartedAt,
      billing_period_end_at: getFreeTrialEndsAt(new Date(trialStartedAt)),
    }

    const { error: insertError } = await supabase
      .from("profiles")
      .insert(profileInsert)

    if (insertError) {
      console.error("Error creating profile:", insertError)
      return { redirect: "error", reason: "profile_creation_error" }
    }

    const nextSendAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    const { error: seqError } = await supabase
      .from("email_sequences")
      .upsert(
        { user_id: user.id, type: "onboarding", next_send_at: nextSendAt },
        { onConflict: "user_id,type", ignoreDuplicates: true }
      )
    if (seqError) console.error("Failed to create email sequence:", seqError.message)

    return { redirect: "onboarding" }
  }

  if (!profile.onboarding_completed) {
    return { redirect: "onboarding" }
  }

  return { redirect: "dashboard" }
}
