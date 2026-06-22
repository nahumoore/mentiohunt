"use client"

import { captureEvent } from "@/lib/analytics"
import { useEffect } from "react"

export function LandingPageTracker() {
  useEffect(() => {
    captureEvent("landing_page_viewed")
  }, [])

  return null
}
