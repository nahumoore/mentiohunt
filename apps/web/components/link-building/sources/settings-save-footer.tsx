"use client"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type SettingsSaveFooterProps = {
  message: string | null
  helper: string
  isSaving: boolean
  hasUnsavedChanges?: boolean
  onSave: () => void
  saveLabel?: string
}

export function SettingsSaveFooter({
  message,
  helper,
  isSaving,
  hasUnsavedChanges,
  onSave,
  saveLabel = "Save discovery settings",
}: SettingsSaveFooterProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p
        className={cn(
          "text-xs leading-5 text-muted-foreground",
          message?.toLowerCase().includes("saved") && "text-foreground"
        )}
      >
        {message ?? helper}
      </p>
      <Button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className={cn(
          "rounded-full px-5",
          hasUnsavedChanges
            ? "bg-foreground text-background hover:bg-foreground/90"
            : "bg-foreground/80 text-background hover:bg-foreground/90"
        )}
      >
        {hasUnsavedChanges && (
          <span className="size-1.5 rounded-full bg-orange" />
        )}
        {isSaving ? "Saving..." : saveLabel}
      </Button>
    </div>
  )
}
