"use client"

import {
  IconArrowRight,
  IconCircleCheck,
  IconMail,
  IconX,
} from "@tabler/icons-react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { captureEvent } from "@/lib/analytics"
import { EVENTS } from "@/lib/analytics-events"
import { PLAYBOOK_TITLE } from "@/lib/playbook"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"

import { usePlaybookModalTimer } from "./use-playbook-modal-timer"

// Content pages only — readers here are researching link building, not
// mid-checkout. Homepage, pricing, dashboard, and auth stay untouched so
// nothing competes with the trial CTA.
const ELIGIBLE_PREFIXES = [
  "/blog",
  "/backlinks-from",
  "/outreach-templates",
  "/free-tools",
]

type Status = "form" | "submitting"

export function PlaybookExitModal() {
  const pathname = usePathname() ?? "/"
  const eligible = ELIGIBLE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )

  const { triggered, dismiss, markConverted } = usePlaybookModalTimer(eligible)
  const [status, setStatus] = useState<Status>("form")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (triggered) {
      captureEvent(EVENTS.PLAYBOOK_MODAL_SHOWN, { path: pathname })
    }
  }, [triggered, pathname])

  if (!eligible) return null

  function handleOpenChange(open: boolean) {
    if (open) return
    captureEvent(EVENTS.PLAYBOOK_MODAL_DISMISSED, { path: pathname })
    dismiss()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setStatus("submitting")

    try {
      const res = await fetch("/api/playbook-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, sourcePath: pathname }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(
          data.error ?? "That email didn't go through. Mind checking it?"
        )
        setStatus("form")
        return
      }

      captureEvent(EVENTS.PLAYBOOK_LEAD_SUBMITTED, { path: pathname })
      markConverted()
      toast.success("Playbook on its way!", {
        description: `Sent to ${email} — check your inbox.`,
      })
    } catch {
      setError("That email didn't go through. Mind checking it?")
      setStatus("form")
    }
  }

  return (
    <Dialog open={triggered} onOpenChange={handleOpenChange}>
      <DialogContent className="z-[60] max-w-xl gap-0 overflow-hidden rounded-3xl p-0">
        <div className="relative aspect-[16/9] w-full bg-white">
          <Image
            src="/landing/get-backlinks-with-claude-playbook.webp"
            alt=""
            fill
            className="object-cover"
            sizes="(min-width: 640px) 576px, 100vw"
            priority
          />
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-black/5 hover:text-foreground"
            aria-label="Close"
          >
            <IconX className="size-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 px-6 pt-5 pb-6 text-center sm:px-8 sm:pb-8">
          <div className="flex flex-col gap-2">
            <DialogTitle className="font-heading text-3xl font-extrabold text-balance text-foreground">
              {PLAYBOOK_TITLE}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-foreground">
              Get the exact step-by-step playbook we used to earn 15
              high-quality backlinks in 30 days — delivered straight to your
              inbox.
            </DialogDescription>
          </div>

          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
            <div className="relative">
              <IconMail className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "submitting"}
                aria-invalid={error ? true : undefined}
                className="h-12 rounded-2xl pl-11 text-base"
              />
            </div>
            <Button
              type="submit"
              disabled={status === "submitting"}
              className="h-12 w-full gap-2 rounded-2xl px-5 text-base disabled:opacity-70"
            >
              {status === "submitting" ? "Sending…" : "Send Me the Playbook"}
              <IconArrowRight className="size-4" />
            </Button>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </form>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconCircleCheck className="size-3.5 text-blaze-orange" />
            Free playbook <span aria-hidden>•</span> Delivered instantly
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
