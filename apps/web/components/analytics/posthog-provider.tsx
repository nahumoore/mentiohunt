"use client"

import {
  identifyAnalyticsUser,
  initializeAnalytics,
  resetAnalyticsUser,
} from "@/lib/analytics"
import { supabaseClient } from "@/lib/supabase/client"
import { useEffect } from "react"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeAnalytics()

    const supabase = supabaseClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        identifyAnalyticsUser(session.user.id, { email: session.user.email })
      } else if (event === "SIGNED_OUT") {
        resetAnalyticsUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return children
}
