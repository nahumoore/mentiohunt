"use client"

import {
  IconChevronDown,
  IconLinkPlus,
  IconLoader2,
  IconLock,
  IconSparkles,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { useState } from "react"

import { PAID_MAX_URL_SUBMISSIONS_PER_DAY } from "@/consts/billing"
import { captureEvent } from "@/lib/analytics"
import { EVENTS } from "@/lib/analytics-events"
import { usePagesStore } from "@/stores/pages-store"
import { useProfileStore } from "@/stores/profile-store"
import type { ProspectDetail } from "@/stores/prospect-store"
import { useProspectStore } from "@/stores/prospect-store"

const AUTO_PICK_VALUE = "auto"

const SUBMIT_URL_BULLETS = [
  "Find the site owner's contact automatically",
  "Pick the best page of yours to pitch",
  "Draft and schedule the outreach for you",
]

function SubmitUrlPaywall() {
  return (
    <>
      <DialogTitle className="flex items-center gap-2">
        <IconLock className="size-4 text-muted-foreground" />
        Submit a URL is a paid-plan feature
      </DialogTitle>
      <p className="mt-1 text-xs text-muted-foreground">
        Found an article that&apos;s a great fit? Paid plans let you paste the
        URL and we take it from there.
      </p>
      <ul className="mt-4 space-y-2">
        {SUBMIT_URL_BULLETS.map((bullet) => (
          <li
            key={bullet}
            className="flex items-start gap-2 text-sm text-foreground"
          >
            <IconSparkles className="mt-0.5 size-3.5 shrink-0 text-(--color-blaze-orange)" />
            {bullet}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex justify-end gap-2">
        <DialogClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full"
          >
            Not now
          </Button>
        </DialogClose>
        <Button
          asChild
          size="sm"
          className="rounded-full bg-(--color-blaze-orange) text-white hover:bg-(--color-crimson-carrot)"
        >
          <Link href="/dashboard/billing">Upgrade to unlock</Link>
        </Button>
      </div>
    </>
  )
}

export function SubmitUrlDialog() {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [targetPageId, setTargetPageId] = useState<string>(AUTO_PICK_VALUE)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duplicateId, setDuplicateId] = useState<string | null>(null)

  const pages = usePagesStore((s) => s.pages)
  const upsertProspectDetail = useProspectStore((s) => s.upsertProspectDetail)
  const profile = useProfileStore((s) => s.profile)
  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"

  const selectedPage = pages.find((p) => p.id === targetPageId)

  function reset() {
    setUrl("")
    setTargetPageId(AUTO_PICK_VALUE)
    setError(null)
    setDuplicateId(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || submitting) return

    setSubmitting(true)
    setError(null)
    setDuplicateId(null)

    try {
      const res = await fetch("/api/link-building/opportunities/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          product_page_id:
            targetPageId === AUTO_PICK_VALUE ? null : targetPageId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409 && data.prospectId) {
          setDuplicateId(data.prospectId)
          captureEvent(EVENTS.PROSPECT_URL_SUBMIT_FAILED, {
            reason: "duplicate",
          })
        } else {
          captureEvent(EVENTS.PROSPECT_URL_SUBMIT_FAILED, {
            reason:
              res.status === 429
                ? "cap"
                : res.status === 403
                  ? "not_paid"
                  : "invalid_url",
          })
        }
        setError(data.error ?? "Failed to submit URL.")
        return
      }

      upsertProspectDetail(data as ProspectDetail)
      captureEvent(EVENTS.PROSPECT_URL_SUBMITTED, {
        target_page_mode: targetPageId === AUTO_PICK_VALUE ? "auto" : "manual",
        domain: (data as ProspectDetail).domain,
      })

      reset()
      setOpen(false)
    } catch {
      setError("Failed to submit URL.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-full">
          <IconLinkPlus className="size-4" />
          Submit a URL
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-xl">
        {!isPaid ? (
          <SubmitUrlPaywall />
        ) : (
          <>
            <DialogTitle>Submit a prospect URL</DialogTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Found an article that&apos;s a great fit? Paste it below —
              we&apos;ll find the site owner&apos;s contact, pick the best page
              of yours to pitch, and schedule the outreach automatically. Up to{" "}
              {PAID_MAX_URL_SUBMISSIONS_PER_DAY} a day.
            </p>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[0.7rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                  Article URL
                </label>
                <Input
                  placeholder="https://theirsite.com/their-article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  autoFocus
                  className="rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.7rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                  Which of your pages to pitch
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors hover:bg-muted/50"
                    >
                      <span className="flex min-w-0 items-center gap-1.5 truncate">
                        {targetPageId === AUTO_PICK_VALUE ? (
                          <>
                            <IconSparkles className="size-3.5 shrink-0 text-muted-foreground" />
                            Auto-pick with AI
                          </>
                        ) : (
                          <span className="truncate">
                            {selectedPage?.title || selectedPage?.url}
                          </span>
                        )}
                      </span>
                      <IconChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="max-h-64 w-(--radix-dropdown-menu-trigger-width) overflow-y-auto rounded-xl"
                  >
                    <DropdownMenuItem
                      onSelect={() => setTargetPageId(AUTO_PICK_VALUE)}
                      className={cn(
                        targetPageId === AUTO_PICK_VALUE && "bg-accent"
                      )}
                    >
                      <IconSparkles className="size-3.5 text-muted-foreground" />
                      Auto-pick with AI
                    </DropdownMenuItem>
                    {pages.map((page) => (
                      <DropdownMenuItem
                        key={page.id}
                        onSelect={() => setTargetPageId(page.id)}
                        className={cn(targetPageId === page.id && "bg-accent")}
                      >
                        <span className="truncate">
                          {page.title || page.url}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {error && (
                <div className="text-xs text-destructive">
                  {error}
                  {duplicateId && (
                    <>
                      {" "}
                      <Link
                        href={`/dashboard/prospects/${duplicateId}`}
                        className="font-medium underline underline-offset-2"
                      >
                        View the existing opportunity.
                      </Link>
                    </>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!url.trim() || submitting}
                  className="rounded-full bg-(--color-blaze-orange) text-white hover:bg-(--color-crimson-carrot) disabled:opacity-40"
                >
                  {submitting ? (
                    <IconLoader2 className="size-3.5 animate-spin" />
                  ) : null}
                  Submit
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
