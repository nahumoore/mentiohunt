"use client"

import {
  IconCircleCheck,
  IconFlag,
  IconLoader2,
  IconSend,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { useState } from "react"

import { captureEvent } from "@/lib/analytics"

export function ReportDialog({ directoryDomain }: { directoryDomain: string }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!text.trim() || loading) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/link-building/directories/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directoryDomain, message: text }),
      })

      if (!res.ok) {
        setError("Could not send report. Try again.")
        return
      }

      setSubmitted(true)
    } catch {
      setError("Could not send report. Try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (v) {
      captureEvent("directory_report_opened", { domain: directoryDomain })
    } else {
      setTimeout(() => {
        setText("")
        setSubmitted(false)
        setError(null)
      }, 200)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          title="Report incorrect info"
        >
          <IconFlag className="size-3.5" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Report incorrect info</DialogTitle>
        <DialogDescription>
          Flag anything wrong about{" "}
          <strong className="text-foreground">{directoryDomain}</strong> — wrong
          pricing, no longer active, broken submit URL, etc.
        </DialogDescription>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <IconCircleCheck className="size-9 text-emerald-500" />
            <p className="text-sm text-muted-foreground">
              Thanks for the report. We&apos;ll review it shortly.
            </p>
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-1">
            <textarea
              className="min-h-[96px] w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
              placeholder="What's wrong? e.g. 'No longer free', 'Submit URL is dead', 'Directory is inactive'"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!text.trim() || loading}
                onClick={() => void handleSubmit()}
              >
                {loading ? (
                  <IconLoader2 className="size-3.5 animate-spin" />
                ) : (
                  <IconSend className="size-3.5" />
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
