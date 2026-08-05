"use client"

import {
  IconAlertCircle,
  IconFileUpload,
  IconLoader2,
  IconLock,
  IconRadar2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Textarea } from "@workspace/ui/components/textarea"
import Link from "next/link"
import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { TRACKED_LINKS_MAX_PER_PRODUCT } from "@/consts/billing"
import { captureEvent } from "@/lib/analytics"
import { EVENTS } from "@/lib/analytics-events"
import { useLinkTrackerStore, type TrackedLinkListItem } from "@/stores/link-tracker-store"
import { useProfileStore } from "@/stores/profile-store"

const PAYWALL_BULLETS = [
  "Daily checks on every backlink you've earned",
  "Instant flag when a link is removed or nofollowed",
  "One digest email a day, not a wall of alerts",
]

type ParsedRow = { source_url: string; expected_target_url: string | null; label: string | null }

function parseBulkText(text: string): ParsedRow[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [sourceUrl, targetUrl, label] = line.split(",").map((part) => part.trim())
      return {
        source_url: sourceUrl ?? "",
        expected_target_url: targetUrl || null,
        label: label || null,
      }
    })
    .filter((row) => row.source_url.length > 0)
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

function AddTrackedLinksPaywall() {
  return (
    <>
      <DialogTitle className="flex items-center gap-2">
        <IconLock className="size-4 text-muted-foreground" />
        Link Tracker is a paid-plan feature
      </DialogTitle>
      <p className="mt-1 text-xs text-muted-foreground">
        Watch backlinks you&apos;ve already earned so you find out the moment one disappears.
      </p>
      <ul className="mt-4 space-y-2">
        {PAYWALL_BULLETS.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2 text-sm text-foreground">
            <IconSparkles className="mt-0.5 size-3.5 shrink-0 text-(--color-blaze-orange)" />
            {bullet}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex justify-end gap-2">
        <DialogClose asChild>
          <Button type="button" variant="ghost" size="sm" className="rounded-full">
            Not now
          </Button>
        </DialogClose>
        <Button asChild size="sm" className="rounded-full bg-(--color-blaze-orange) text-white hover:bg-(--color-crimson-carrot)">
          <Link href="/dashboard/billing">Upgrade to unlock</Link>
        </Button>
      </div>
    </>
  )
}

export function AddTrackedLinksDialog() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"single" | "bulk">("single")

  const [sourceUrl, setSourceUrl] = useState("")
  const [expectedTargetUrl, setExpectedTargetUrl] = useState("")
  const [label, setLabel] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [bulkText, setBulkText] = useState("")
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const profile = useProfileStore((s) => s.profile)
  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"
  const addLinks = useLinkTrackerStore((s) => s.addLinks)
  const trackedCount = useLinkTrackerStore((s) => s.links.length)

  const bulkRows = useMemo(() => parseBulkText(bulkText), [bulkText])

  function reset() {
    setSourceUrl("")
    setExpectedTargetUrl("")
    setLabel("")
    setError(null)
    setBulkText("")
    setBulkError(null)
    setTab("single")
  }

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sourceUrl.trim() || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/link-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_url: sourceUrl.trim(),
          expected_target_url: expectedTargetUrl.trim() || null,
          label: label.trim() || null,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        captureEvent(EVENTS.TRACKED_LINK_ADD_FAILED, {
          reason: res.status === 409 ? "duplicate" : res.status === 403 ? "not_paid_or_cap" : "invalid_url",
        })
        setError(data.error ?? "Failed to add link.")
        return
      }

      addLinks([data as TrackedLinkListItem])
      captureEvent(EVENTS.TRACKED_LINK_ADDED, { origin: "manual" })
      toast.success("Link added — first check runs in a few seconds.")
      reset()
      setOpen(false)
    } catch {
      setError("Failed to add link.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleBulkSubmit() {
    if (bulkRows.length === 0 || bulkSubmitting) return

    setBulkSubmitting(true)
    setBulkError(null)

    let insertedTotal = 0
    let skippedTotal = 0

    try {
      for (const batch of chunk(bulkRows, 50)) {
        const res = await fetch("/api/link-tracker/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: batch }),
        })
        const data = await res.json()

        if (!res.ok) {
          setBulkError(data.error ?? "Failed to import links.")
          break
        }

        const inserted = (data.inserted ?? []) as TrackedLinkListItem[]
        const skipped = (data.skipped ?? []) as unknown[]
        insertedTotal += inserted.length
        skippedTotal += skipped.length
        if (inserted.length > 0) addLinks(inserted)
      }

      if (insertedTotal > 0) {
        captureEvent(EVENTS.TRACKED_LINKS_BULK_IMPORTED, { inserted: insertedTotal, skipped: skippedTotal })
        toast.success(
          skippedTotal > 0
            ? `${insertedTotal} link${insertedTotal === 1 ? "" : "s"} added, ${skippedTotal} skipped.`
            : `${insertedTotal} link${insertedTotal === 1 ? "" : "s"} added.`
        )
        reset()
        setOpen(false)
      } else if (!bulkError) {
        setBulkError("None of these links could be added — check the URLs and try again.")
      }
    } catch {
      setBulkError("Failed to import links.")
    } finally {
      setBulkSubmitting(false)
    }
  }

  function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? "")
      setBulkText((prev) => (prev.trim() ? `${prev.trim()}\n${text}` : text))
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const remainingCapacity = TRACKED_LINKS_MAX_PER_PRODUCT - trackedCount

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
          <IconRadar2 className="size-4" />
          Track a link
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-xl">
        {!isPaid ? (
          <AddTrackedLinksPaywall />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--color-blaze-orange)/10 text-(--color-blaze-orange)">
                <IconRadar2 className="size-4" />
              </div>
              <DialogTitle>Track a backlink</DialogTitle>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Paste a page that already links to you — we&apos;ll check it every day and flag anything that changes.
              {remainingCapacity <= 20 && remainingCapacity > 0 ? ` ${remainingCapacity} slots left.` : null}
            </p>

            <Tabs value={tab} onValueChange={(v) => setTab(v as "single" | "bulk")} className="mt-4 gap-4">
              <TabsList>
                <TabsTrigger value="single">
                  <IconWorld className="size-4" />
                  <span>Single URL</span>
                </TabsTrigger>
                <TabsTrigger value="bulk">
                  <IconFileUpload className="size-4" />
                  <span>Bulk import</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="single">
                <form onSubmit={handleSingleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[0.7rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                      Page that links to you
                    </label>
                    <div className="relative">
                      <IconWorld className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="https://theirsite.com/their-article"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                        autoFocus
                        className="rounded-md pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[0.7rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                      Which of your pages it should link to (optional)
                    </label>
                    <Input
                      placeholder="https://yoursite.com/pricing"
                      value={expectedTargetUrl}
                      onChange={(e) => setExpectedTargetUrl(e.target.value)}
                      className="rounded-md"
                    />
                    <p className="text-[0.7rem] text-muted-foreground">
                      Helps us match the right link on pages that link to you more than once.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[0.7rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                      Label (optional)
                    </label>
                    <Input
                      placeholder="e.g. Guest post on Acme Blog"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      maxLength={120}
                      className="rounded-md"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      <IconAlertCircle className="mt-0.5 size-3.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <DialogClose asChild>
                      <Button type="button" variant="ghost" size="sm" className="rounded-full" disabled={submitting}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!sourceUrl.trim() || submitting}
                      className="rounded-full bg-(--color-blaze-orange) text-white hover:bg-(--color-crimson-carrot) disabled:opacity-40"
                    >
                      {submitting ? <IconLoader2 className="size-3.5 animate-spin" /> : null}
                      Track link
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="bulk">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[0.7rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                      One page per line
                    </label>
                    <Textarea
                      placeholder={"https://theirsite.com/post-1\nhttps://theirsite.com/post-2, https://yoursite.com/pricing, Guest post"}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      className="min-h-32 rounded-xl font-mono text-xs"
                    />
                    <p className="text-[0.7rem] text-muted-foreground">
                      Optional target URL and label as extra columns: <code>page-url, your-page-url, label</code>
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFilePicked}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <IconFileUpload className="size-4" />
                      Upload CSV
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {bulkRows.length > 0
                        ? `${bulkRows.length} URL${bulkRows.length === 1 ? "" : "s"} ready to import`
                        : "No URLs yet"}
                    </p>
                  </div>

                  {bulkError && (
                    <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      <IconAlertCircle className="mt-0.5 size-3.5 shrink-0" />
                      <span>{bulkError}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <DialogClose asChild>
                      <Button type="button" variant="ghost" size="sm" className="rounded-full" disabled={bulkSubmitting}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleBulkSubmit}
                      disabled={bulkRows.length === 0 || bulkSubmitting}
                      className="rounded-full bg-(--color-blaze-orange) text-white hover:bg-(--color-crimson-carrot) disabled:opacity-40"
                    >
                      {bulkSubmitting ? <IconLoader2 className="size-3.5 animate-spin" /> : null}
                      Import {bulkRows.length > 0 ? bulkRows.length : ""} links
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
