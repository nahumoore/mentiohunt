"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { useActivationStore, type ActivationStep } from "@/stores/activation-store"

/**
 * Marks the visit-based activation steps. Kept in the layout rather than on
 * each page so the checklist keeps working if those screens are refactored,
 * and so a user who wanders in from a link still gets credit.
 */
const STEP_BY_PATH: Record<string, ActivationStep> = {
  "/dashboard/targets": "reviewed_pages",
  "/dashboard/prospects/settings": "reviewed_competitors",
}

export function ActivationTracker() {
  const pathname = usePathname()
  const complete = useActivationStore((state) => state.complete)
  const hasHydrated = useActivationStore((state) => state.hasHydrated)

  useEffect(() => {
    if (!hasHydrated) return

    const step = STEP_BY_PATH[pathname]
    if (step) complete(step)
  }, [pathname, hasHydrated, complete])

  return null
}
