"use client"

import { useEffect, useRef, useState } from "react"

import { markWalkthroughSeen } from "@/actions/update-profile"
import { HowItWorksContent } from "@/components/link-building/prospects/how-it-works-content"
import { captureEvent } from "@/lib/analytics"
import { useProfileStore } from "@/stores/profile-store"
import { Dialog, DialogContent } from "@workspace/ui/components/dialog"

/**
 * Module-scoped so a route change — which remounts this component and can
 * briefly re-hydrate the store from a server payload fetched before the
 * timestamp was written — can't pop the walkthrough a second time.
 */
let hasClosedThisSession = false

/**
 * Auto-opens the how-it-works explainer once, on a user's first dashboard load.
 *
 * The content itself already existed behind a ghost "How it works" button in
 * the header, which new users never clicked (onboarding feedback, 2026-07-27).
 * `profiles.walkthrough_seen_at` gates it to a single showing.
 */
export function FirstLoginWalkthrough() {
  const profile = useProfileStore((state) => state.profile)
  const markSeenLocally = useProfileStore(
    (state) => state.markWalkthroughSeenLocally
  )
  const [closed, setClosed] = useState(false)
  const hasLoggedRef = useRef(false)

  const isOpen =
    !closed &&
    !hasClosedThisSession &&
    profile !== null &&
    profile.walkthrough_seen_at === null

  useEffect(() => {
    if (!isOpen || hasLoggedRef.current) return

    hasLoggedRef.current = true
    captureEvent("walkthrough_shown", { source: "first_login" })
  }, [isOpen])

  const close = () => {
    hasClosedThisSession = true
    setClosed(true)
    captureEvent("walkthrough_completed")

    const seenAt = new Date().toISOString()
    markSeenLocally(seenAt)
    void markWalkthroughSeen()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <HowItWorksContent onDone={close} />
      </DialogContent>
    </Dialog>
  )
}
