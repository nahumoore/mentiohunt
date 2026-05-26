import { FREE_TRIAL_DAYS } from "@/consts/billing"
import { supabaseServer } from "@/lib/supabase/server"
import { supabaseAdmin } from "@workspace/supabase/admin"
import type { TablesInsert } from "@workspace/supabase/database-types"
import { NextResponse, type NextRequest } from "next/server"

function getFreeTrialEndsAt(startedAt: Date) {
  const endsAt = new Date(startedAt)
  endsAt.setDate(endsAt.getDate() + FREE_TRIAL_DAYS)
  return endsAt.toISOString()
}

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)
  const supabase = await supabaseServer()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user?.email) {
    return NextResponse.redirect(`${origin}/signin?auth_error=1`)
  }

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
      await supabase.auth.signOut()
      return NextResponse.redirect(
        `${origin}/signin?auth_error=profile_creation_error`
      )
    }

    const nextSendAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    supabaseAdmin
      .from("email_sequences")
      .upsert(
        { user_id: user.id, type: "onboarding", next_send_at: nextSendAt },
        { onConflict: "user_id,type", ignoreDuplicates: true }
      )
      .then(({ error: seqError }) => {
        if (seqError)
          console.error("Failed to create email sequence:", seqError.message)
      })

    return NextResponse.redirect(`${origin}/onboarding`)
  }

  if (!profile.onboarding_completed) {
    return NextResponse.redirect(`${origin}/onboarding`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
