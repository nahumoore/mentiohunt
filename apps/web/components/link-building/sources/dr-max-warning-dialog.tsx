"use client"

import { IconShieldExclamation } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"

const STORAGE_KEY = "dr_max_warning_seen"

export function hasDrMaxWarningSeen(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(STORAGE_KEY) === "true"
}

export function markDrMaxWarningSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, "true")
  } catch {
    // storage unavailable
  }
}

interface DrMaxWarningDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DrMaxWarningDialog({
  open,
  onConfirm,
  onCancel,
}: DrMaxWarningDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="max-w-md"
      >
        <div className="flex flex-col gap-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-orange/10">
            <IconShieldExclamation className="size-5 text-orange" />
          </div>

          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-base font-semibold">
              Start with lower DR sites
            </DialogTitle>
            <DialogDescription className="text-sm leading-6">
              High DR sites like{" "}
              <span className="font-medium text-foreground">Salesforce</span>,{" "}
              <span className="font-medium text-foreground">Ahrefs</span>, or{" "}
              <span className="font-medium text-foreground">HubSpot</span> are
              extremely hard to get a backlink from — their editorial standards
              are high and response rates are near zero for cold outreach.
            </DialogDescription>
            <DialogDescription className="mt-1 text-sm leading-6">
              Sites with DR 0–40 are easier to win, more likely to respond, and
              still move the needle. We recommend starting there and expanding
              once you have traction.
            </DialogDescription>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              onClick={onConfirm}
              className="w-full rounded-full text-muted-foreground"
            >
              Got it, proceed anyway
            </Button>
            <Button onClick={onCancel} className="w-full rounded-full">
              Keep it as it is
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
