"use client"

import {
  IconCircleCheck,
  IconFlag,
  IconLoader2,
  IconSend,
} from "@tabler/icons-react"
import { useState } from "react"

import { captureEvent } from "@/lib/analytics"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"

type OpportunityReportIssueDialogProps = {
  prospectId: string
  domain: string | null
}

export function OpportunityReportIssueDialog({
  prospectId,
  domain,
}: OpportunityReportIssueDialogProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (loading || !message.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/link-building/opportunities/${prospectId}/report-issue`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        }
      )

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null

        setError(data?.error ?? "Could not submit the report. Try again.")
        return
      }

      captureEvent("opportunity_issue_report_submitted", {
        prospect_id: prospectId,
        domain,
      })
      setSubmitted(true)
    } catch {
      setError("Could not submit the report. Try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (nextOpen) {
      captureEvent("opportunity_issue_report_opened", {
        prospect_id: prospectId,
        domain,
      })
      return
    }

    setTimeout(() => {
      setMessage("")
      setSubmitted(false)
      setError(null)
    }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <IconFlag className="size-4" />
          Report issue
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Report an issue</DialogTitle>
        <DialogDescription>
          Flag anything off about this opportunity so we can manually review the
          scraping or enrichment output.
        </DialogDescription>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <IconCircleCheck className="size-9 text-emerald-500" />
            <p className="text-sm text-muted-foreground">
              Thanks. We&apos;ll review this opportunity and debug the pipeline.
            </p>
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-1">
            <textarea
              className="min-h-[120px] w-full resize-none rounded-lg border bg-muted/40 shadow-sm px-3 py-2 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
              placeholder="What looks wrong? e.g. 'Scraped the wrong page', 'Contact info belongs to a different company', 'The fit reason does not match the found URL'"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!message.trim() || loading}
                onClick={() => void handleSubmit()}
              >
                {loading ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : (
                  <IconSend className="size-4" />
                )}
                Submit report
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
