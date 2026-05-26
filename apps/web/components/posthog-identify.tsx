"use client"

import { useEffect } from "react"
import { supabaseClient } from "@/lib/supabase/client"
import { captureEvent, identifyAnalyticsUser, resetAnalyticsUser, setPersonProperties } from "@/lib/analytics"

const SESSION_TRACKED_KEY = "ph_session_tracked"

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

function trackSession() {
  if (sessionStorage.getItem(SESSION_TRACKED_KEY)) return
  sessionStorage.setItem(SESSION_TRACKED_KEY, "1")
  const now = new Date().toISOString()
  captureEvent("user_signed_in", { method: "oauth" })
  setPersonProperties({ last_login: now })
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
      }
      if (event === "SIGNED_IN") {
        trackSession()
      }
      if (event === "SIGNED_OUT") {
        resetAnalyticsUser()
        sessionStorage.removeItem(SESSION_TRACKED_KEY)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return null
}
