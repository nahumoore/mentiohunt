"use client"

import {
  IconAlertCircle,
  IconChevronDown,
  IconFileText,
  IconLinkPlus,
  IconLoader2,
  IconLock,
  IconSearch,
  IconSparkles,
  IconWorld,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { useMemo, useState } from "react"

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
  const [pagePickerOpen, setPagePickerOpen] = useState(false)
  const [pageQuery, setPageQuery] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duplicateId, setDuplicateId] = useState<string | null>(null)

  const pages = usePagesStore((s) => s.pages)
  const upsertProspectDetail = useProspectStore((s) => s.upsertProspectDetail)
  const profile = useProfileStore((s) => s.profile)
  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"

  const selectedPage = pages.find((p) => p.id === targetPageId)

  const filteredPages = useMemo(() => {
    const q = pageQuery.trim().toLowerCase()
    if (!q) return pages
    return pages.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) || p.url.toLowerCase().includes(q)
    )
  }, [pages, pageQuery])

  const showAutoPick = "auto-pick with ai".includes(pageQuery.trim().toLowerCase())

  function reset() {
    setUrl("")
    setTargetPageId(AUTO_PICK_VALUE)
    setPageQuery("")
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
            <div className="flex items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--color-blaze-orange)/10 text-(--color-blaze-orange)">
                <IconLinkPlus className="size-4" />
              </div>
              <DialogTitle>Submit a prospect URL</DialogTitle>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Found an article that&apos;s a great fit? Paste it below —
              we&apos;ll find the site owner&apos;s contact, pick the best page
              of yours to pitch, and schedule the outreach automatically. Up
              to {PAID_MAX_URL_SUBMISSIONS_PER_DAY} a day.
            </p>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[0.7rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                  Article URL
                </label>
                <div className="relative">
                  <IconWorld className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="https://theirsite.com/their-article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    autoFocus
                    className="rounded-md pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.7rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                  Which of your pages to pitch
                </label>
                <Popover
                  open={pagePickerOpen}
                  onOpenChange={(next) => {
                    setPagePickerOpen(next)
                    if (!next) setPageQuery("")
                  }}
                >
                  <PopoverTrigger asChild>
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
                          <>
                            <IconFileText className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">
                              {selectedPage?.title || selectedPage?.url}
                            </span>
                          </>
                        )}
                      </span>
                      <IconChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-(--radix-popover-trigger-width) rounded-xl p-0"
                  >
                    <div className="relative border-b border-border">
                      <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        autoFocus
                        value={pageQuery}
                        onChange={(e) => setPageQuery(e.target.value)}
                        placeholder="Type a page title or URL..."
                        className="h-10 w-full rounded-t-xl bg-transparent pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                      {showAutoPick && (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetPageId(AUTO_PICK_VALUE)
                            setPagePickerOpen(false)
                          }}
                          className={cn(
                            "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/50",
                            targetPageId === AUTO_PICK_VALUE && "bg-accent"
                          )}
                        >
                          <IconSparkles className="size-3.5 shrink-0 text-muted-foreground" />
                          Auto-pick with AI
                        </button>
                      )}
                      {filteredPages.map((page) => (
                        <button
                          key={page.id}
                          type="button"
                          onClick={() => {
                            setTargetPageId(page.id)
                            setPagePickerOpen(false)
                          }}
                          className={cn(
                            "flex w-full min-w-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/50",
                            targetPageId === page.id && "bg-accent"
                          )}
                        >
                          <IconFileText className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">
                              {page.title || page.url}
                            </span>
                            {page.title && (
                              <span className="block truncate text-xs text-muted-foreground">
                                {page.url}
                              </span>
                            )}
                          </span>
                        </button>
                      ))}
                      {!showAutoPick && filteredPages.length === 0 && (
                        <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                          No pages match &ldquo;{pageQuery}&rdquo;
                        </p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <IconAlertCircle className="mt-0.5 size-3.5 shrink-0" />
                  <span>
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
                  </span>
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
