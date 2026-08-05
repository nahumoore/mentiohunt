"use client"

import { useEffect, useRef, useState } from "react"

import { markWalkthroughSeen } from "@/actions/update-profile"
import { WelcomeTourContent } from "@/components/dashboard/welcome-tour/welcome-tour-content"
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
 * Auto-opens a welcome tour once, on a user's first dashboard load —
 * welcomes them and walks through the tool's main capabilities (prospects
 * & outreach, pages, email accounts, link tracker) one step at a time.
 *
 * `profiles.walkthrough_seen_at` gates it to a single showing. The
 * how-it-works explainer this replaced still lives behind the header's
 * ghost "How it works" button, unchanged, as reference material.
 */
export function FirstLoginWalkthrough() {
  const profile = useProfileStore((state) => state.profile)
  const markSeenLocally = useProfileStore(
    (state) => state.markWalkthroughSeenLocally
  )
  const [closed, setClosed] = useState(false)
  const hasLoggedRef = useRef(false)
  const canCloseRef = useRef(false)

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
        if (!open && canCloseRef.current) close()
      }}
    >
      <DialogContent
        className="max-h-[85vh] max-w-2xl overflow-y-auto"
        onEscapeKeyDown={(e) => {
          if (!canCloseRef.current) e.preventDefault()
        }}
        onPointerDownOutside={(e) => {
          if (!canCloseRef.current) e.preventDefault()
        }}
        onInteractOutside={(e) => {
          if (!canCloseRef.current) e.preventDefault()
        }}
      >
        <WelcomeTourContent
          onDone={close}
          onStepChange={(isLast) => {
            canCloseRef.current = isLast
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
