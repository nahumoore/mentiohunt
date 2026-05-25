"use client"

import {
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconLoader2,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { cn } from "@workspace/ui/lib/utils"
import { useState } from "react"

interface SubmitAssistSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  directoryName: string
  submitUrl: string | null | undefined
  productName: string | null
  websiteUrl: string | null
  productDescription: string | null
  isUpdating: boolean
  onMarkSubmitted: () => void
  trigger: React.ReactNode
}

export function SubmitAssistSheet({
  open,
  onOpenChange,
  directoryName,
  submitUrl,
  productName,
  websiteUrl,
  productDescription,
  isUpdating,
  onMarkSubmitted,
  trigger,
}: SubmitAssistSheetProps) {
  const normalizedSubmitUrl = submitUrl
    ? submitUrl.startsWith("http")
      ? submitUrl
      : `https://${submitUrl}`
    : null
  const submitHostname = normalizedSubmitUrl
    ? (() => {
        try {
          return new URL(normalizedSubmitUrl).hostname
        } catch {
          return submitUrl
        }
      })()
    : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>Submit to {directoryName}</SheetTitle>
          <SheetDescription>
            Open the form, paste your product info, mark done when finished.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-2.5">
            <StepLabel number={1} label="Open submission form" />
            {normalizedSubmitUrl ? (
              <a
                href={normalizedSubmitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    {submitHostname && (
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${submitHostname}&sz=32`}
                        alt=""
                        className="size-4 shrink-0 rounded-sm"
                      />
                    )}
                    <span className="truncate text-sm">{directoryName}</span>
                  </span>
                  <IconExternalLink className="size-4 shrink-0 text-muted-foreground" />
                </Button>
                <p className="mt-1.5 truncate text-xs text-muted-foreground">
                  {normalizedSubmitUrl}
                </p>
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">No submission URL available.</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <StepLabel number={2} label="Copy your product info" />
            {productName && <CopyField label="Product name" value={productName} />}
            {websiteUrl && <CopyField label="Website URL" value={websiteUrl} />}
            {productDescription && (
              <CopyField label="Description" value={productDescription} multiline />
            )}
          </div>
        </div>

        <SheetFooter className="border-t">
          <Button onClick={onMarkSubmitted} disabled={isUpdating} className="w-full">
            {isUpdating && <IconLoader2 className="size-4 animate-spin" />}
            Mark as submitted
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function StepLabel({ number, label }: { number: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[11px] font-bold text-foreground/60">
        {number}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}

function CopyField({
  label,
  value,
  multiline,
}: {
  label: string
  value: string
  multiline?: boolean
}) {
  const [copied, setCopied] = useState(false)

  function copy() {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2">
        <p
          className={cn(
            "flex-1 text-sm leading-relaxed",
            multiline ? "whitespace-pre-wrap" : "truncate"
          )}
        >
          {value}
        </p>
        <button
          onClick={copy}
          className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          title="Copy"
        >
          {copied ? (
            <IconCheck className="size-4 text-emerald-600" />
          ) : (
            <IconCopy className="size-4" />
          )}
        </button>
      </div>
    </div>
  )
}
