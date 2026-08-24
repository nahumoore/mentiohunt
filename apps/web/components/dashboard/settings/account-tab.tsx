"use client"

import { IconAlertTriangle, IconPlayerPause, IconPlayerPlay, IconPower } from "@tabler/icons-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  deactivateAccount,
  resumeOutreach,
  stopAllOutreach,
} from "@/actions/account-actions"
import { useProfileStore } from "@/stores/profile-store"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Skeleton } from "@workspace/ui/components/skeleton"

export function AccountTab() {
  const [showStopDialog, setShowStopDialog] = useState(false)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [isStopping, startStopTransition] = useTransition()
  const [isResuming, startResumeTransition] = useTransition()
  const [isDeactivating, startDeactivateTransition] = useTransition()
  const profile = useProfileStore((state) => state.profile)
  const setProfile = useProfileStore((state) => state.setProfile)

  const outreachPaused = profile?.outreach_paused_at != null

  function handleStopOutreach() {
    startStopTransition(async () => {
      const result = await stopAllOutreach()
      setShowStopDialog(false)
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (profile) setProfile({ ...profile, outreach_paused_at: result.outreach_paused_at ?? null })
      toast.success(
        result.pausedCount
          ? `Paused everything — canceled ${result.pausedCount} pending email${result.pausedCount === 1 ? "" : "s"}. Discovery and future outreach are paused too.`
          : "Paused everything — discovery and future outreach are paused."
      )
    })
  }

  function handleResumeOutreach() {
    startResumeTransition(async () => {
      const result = await resumeOutreach()
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (profile) setProfile({ ...profile, outreach_paused_at: null })
      toast.success(
        result.resumedCount
          ? `Resumed — ${result.resumedCount} email${result.resumedCount === 1 ? "" : "s"} rescheduled.`
          : "Resumed — discovery and outreach are running again."
      )
    })
  }

  function handleDeactivate() {
    startDeactivateTransition(async () => {
      const result = await deactivateAccount()
      if (result.error) {
        setShowDeactivateDialog(false)
        toast.error(result.error)
        return
      }
      // Full-page redirect takes over from here — dashboard/layout.tsx
      // sends deactivated accounts to /account-deactivated on next load.
      window.location.href = "/account-deactivated"
    })
  }

  if (!profile) {
    return (
      <div className="flex flex-col gap-6">
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
          <div className="border-b border-border/70 px-6 py-5">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="mt-2.5 h-4 w-full max-w-md" />
            <Skeleton className="mt-1.5 h-4 w-2/3 max-w-sm" />
          </div>
          <div className="px-6 py-5">
            <Skeleton className="h-9 w-56" />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
          <div className="border-b border-border/70 px-6 py-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2.5 h-4 w-full max-w-md" />
            <Skeleton className="mt-1.5 h-4 w-1/2 max-w-sm" />
          </div>
          <div className="px-6 py-5">
            <Skeleton className="h-9 w-44" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
        <div className="border-b border-border/70 px-6 py-5">
          <p className="text-base font-semibold">
            {outreachPaused ? "Outreach and discovery are paused" : "Stop all outreach and discovery"}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {outreachPaused
              ? "Every email that's currently queued has been canceled, daily discovery is skipped for your account, and no new outreach gets scheduled. Your account, opportunities, and data stay exactly as they are — resume anytime."
              : "Cancels every email that's queued to send, pauses daily discovery, and stops any new outreach from being scheduled — until you resume it. Your account, opportunities, and data stay exactly as they are."}
          </p>
        </div>
        <div className="px-6 py-5">
          {outreachPaused ? (
            <Button
              variant="outline"
              onClick={handleResumeOutreach}
              disabled={isResuming}
            >
              <IconPlayerPlay />
              {isResuming ? "Resuming…" : "Resume outreach"}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowStopDialog(true)}
              disabled={isStopping}
            >
              <IconPlayerPause />
              Stop all outreach and discovery
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-destructive/30 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
        <div className="border-b border-destructive/20 px-6 py-5">
          <p className="text-base font-semibold text-destructive">Deactivate account</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Stops outreach and discovery like pausing above, but also locks
            you out of the dashboard entirely. Nothing is deleted — but
            reactivating isn't self-serve. You'll need to email
            support@mentiohunt.com to turn it back on.
          </p>
        </div>
        <div className="px-6 py-5">
          <Button
            variant="destructive"
            onClick={() => setShowDeactivateDialog(true)}
          >
            <IconPower />
            Deactivate account
          </Button>
        </div>
      </div>

      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent>
          <DialogTitle>Stop all outreach and discovery?</DialogTitle>
          <DialogDescription>
            Every email currently queued to send will be canceled, daily
            discovery will pause, and no new outreach will be scheduled until
            you resume it. Your opportunities and data stay exactly as they
            are — this is fully reversible from this page.
          </DialogDescription>
          <div className="mt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowStopDialog(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleStopOutreach}
              disabled={isStopping}
              className="rounded-full bg-foreground px-5 text-background hover:bg-foreground/90"
            >
              {isStopping ? "Stopping…" : "Stop all outreach and discovery"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <IconAlertTriangle className="size-4 text-destructive" />
            </span>
            <div>
              <DialogTitle>Deactivate your account?</DialogTitle>
              <DialogDescription className="mt-1">
                This cancels all queued outreach and pauses daily discovery.
                Your data isn't deleted, but turning it back on isn't
                self-serve — you'll need to email support@mentiohunt.com and
                we'll reactivate it for you.
              </DialogDescription>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDeactivateDialog(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeactivate}
              disabled={isDeactivating}
            >
              {isDeactivating ? "Deactivating…" : "Deactivate account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
