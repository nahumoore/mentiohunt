"use client"

import { IconAlertTriangle, IconPlayerPause, IconPower } from "@tabler/icons-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { deactivateAccount, stopAllOutreach } from "@/actions/account-actions"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"

export function AccountTab() {
  const [showStopDialog, setShowStopDialog] = useState(false)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [isStopping, startStopTransition] = useTransition()
  const [isDeactivating, startDeactivateTransition] = useTransition()

  function handleStopOutreach() {
    startStopTransition(async () => {
      const result = await stopAllOutreach()
      setShowStopDialog(false)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(
        result.pausedCount
          ? `Paused ${result.pausedCount} pending email${result.pausedCount === 1 ? "" : "s"}.`
          : "No pending emails to pause."
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

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
        <div className="border-b border-border/70 px-5 py-4">
          <p className="text-sm font-medium">Stop all outreach</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Cancels every email that's queued to send but hasn't gone out yet.
            This is a one-time cleanup of the current queue — new opportunities
            will still get outreach scheduled as usual going forward. Your
            account, opportunities, and data stay exactly as they are.
          </p>
        </div>
        <div className="px-5 py-4">
          <Button variant="outline" size="sm" onClick={() => setShowStopDialog(true)}>
            <IconPlayerPause />
            Stop all outreach
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-destructive/30 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
        <div className="border-b border-destructive/20 px-5 py-4">
          <p className="text-sm font-medium text-destructive">Deactivate account</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Stops outreach and pauses daily discovery. Nothing is deleted —
            but reactivating isn't self-serve. You'll need to email
            support@mentiohunt.com to turn it back on.
          </p>
        </div>
        <div className="px-5 py-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeactivateDialog(true)}
          >
            <IconPower />
            Deactivate account
          </Button>
        </div>
      </div>

      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent>
          <DialogTitle>Stop all outreach?</DialogTitle>
          <DialogDescription>
            Every email currently queued to send will be canceled. Your
            opportunities stay as they are, and new ones will still get
            scheduled outreach going forward — this only clears what's
            queued right now.
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
              {isStopping ? "Stopping…" : "Stop all outreach"}
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
