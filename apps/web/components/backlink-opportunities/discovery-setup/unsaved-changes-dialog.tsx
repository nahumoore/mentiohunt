"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"

type UnsavedChangesDialogProps = {
  open: boolean
  onStay: () => void
  onLeave: () => void
}

export function UnsavedChangesDialog({
  open,
  onStay,
  onLeave,
}: UnsavedChangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onStay() }}>
      <DialogContent>
        <DialogTitle>Unsaved changes</DialogTitle>
        <DialogDescription>
          You have unsaved discovery settings. Leaving now will discard them.
        </DialogDescription>
        <div className="mt-4 flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onLeave}
            className="text-muted-foreground hover:text-foreground"
          >
            Discard and leave
          </Button>
          <Button
            type="button"
            onClick={onStay}
            className="rounded-full bg-foreground px-5 text-background hover:bg-foreground/90"
          >
            Stay and save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
