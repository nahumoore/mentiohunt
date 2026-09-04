"use client"

import {
  identifyAnalyticsUser,
  initializeAnalytics,
  resetAnalyticsUser,
} from "@/lib/analytics"
import { supabaseClient } from "@/lib/supabase/client"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

const PROTECTED_ROUTES = ["/dashboard", "/onboarding"]

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

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
        // The SDK itself fires this (via _callRefreshToken -> _removeSession) whenever
        // a stale/revoked refresh token fails to refresh, not just on an explicit
        // signOut() call. Left unhandled, a protected page just sits there silently
        // unauthenticated instead of prompting a fresh login — observed in prod as a
        // single browser retrying the same dead token for months (2026-09-04 logcheck).
        if (PROTECTED_ROUTES.some((route) => pathnameRef.current?.startsWith(route))) {
          router.replace("/signin")
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return children
}
