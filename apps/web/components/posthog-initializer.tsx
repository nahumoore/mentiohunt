"use client"

import posthog from "posthog-js"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

if (typeof window !== "undefined" && !posthog.__loaded) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-01-30",
    capture_pageview: false,
  })
}

export function PostHogInitializer() {
  const pathname = usePathname()
  const lastPathname = useRef<string | null>(null)

  useEffect(() => {
    if (!posthog.__loaded) return
    if (pathname === lastPathname.current) return
    lastPathname.current = pathname
    posthog.capture("$pageview", { $current_url: window.location.href })
  }, [pathname])

  return null
}
