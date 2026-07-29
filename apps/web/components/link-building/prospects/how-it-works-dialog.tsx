"use client"

import { IconHelpCircle } from "@tabler/icons-react"

import { HowItWorksContent } from "@/components/link-building/prospects/how-it-works-content"
import { captureEvent } from "@/lib/analytics"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@workspace/ui/components/dialog"

export function HowItWorksDialog() {
  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) captureEvent("walkthrough_opened", { source: "header" })
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="default" className="mt-1 shrink-0">
          <IconHelpCircle className="size-4" />
          How it works
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <HowItWorksContent />
      </DialogContent>
    </Dialog>
  )
}
