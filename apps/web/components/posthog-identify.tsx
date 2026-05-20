"use client"

import { useEffect } from "react"
import { supabaseClient } from "@/lib/supabase/client"
import { identifyAnalyticsUser, resetAnalyticsUser } from "@/lib/analytics"

async function identifyUser(userId: string, fallbackEmail?: string | null) {
  const supabase = supabaseClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, tier, active_trial, onboarding_completed")
    .eq("id", userId)
    .maybeSingle()

  if (profile) {
    identifyAnalyticsUser(userId, {
      email: profile.email ?? fallbackEmail ?? undefined,
      tier: profile.tier ?? undefined,
      active_trial: profile.active_trial ?? undefined,
      onboarding_completed: profile.onboarding_completed ?? undefined,
    })
  } else {
    identifyAnalyticsUser(userId, { email: fallbackEmail ?? undefined })
  }
}

export function PostHogIdentify() {
  useEffect(() => {
    const supabase = supabaseClient()

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        void identifyUser(session.user.id, session.user.email)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          void identifyUser(session.user.id, session.user.email)
        }
      } else if (event === "SIGNED_OUT") {
        resetAnalyticsUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return null
}
