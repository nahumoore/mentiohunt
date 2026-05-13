"use client"

import posthog from "posthog-js"

if (typeof window !== "undefined" && !posthog.__loaded) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-01-30",
  })
}

export function PostHogInitializer() {
  return null
}
