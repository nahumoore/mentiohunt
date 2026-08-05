"use client"

import { IconExternalLink, IconSearch, IconTrash } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { formatRelativeCheck, STATUS_FILTERS } from "@/app/dashboard/link-tracker/_data"
import { LinkStatusChip } from "@/components/link-tracker/link-status-chip"
import { LinkTrackerEmpty } from "@/components/link-tracker/link-tracker-empty"
import { LinkTrackerPaywall } from "@/components/link-tracker/link-tracker-paywall"
import { captureEvent } from "@/lib/analytics"
import { EVENTS } from "@/lib/analytics-events"
import { useLinkTrackerStore, type TrackedLinkListItem, type TrackedLinkStatus } from "@/stores/link-tracker-store"
import { useProfileStore } from "@/stores/profile-store"

function faviconUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
}

function LinkTrackerSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden rounded-xl p-6">
      <div className="flex flex-col gap-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </Card>
  )
}

export function LinkTrackerClient() {
  const hydrated = useLinkTrackerStore((s) => s.hydrated)
  const links = useLinkTrackerStore((s) => s.links)
  const removeLink = useLinkTrackerStore((s) => s.removeLink)
  const profile = useProfileStore((s) => s.profile)
  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<TrackedLinkStatus | "all">("all")
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    captureEvent(EVENTS.LINK_TRACKER_VIEWED)
  }, [])

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return links.filter((link) => {
      if (statusFilter !== "all" && link.status !== statusFilter) return false
      if (!query) return true
      return (
        link.source_url.toLowerCase().includes(query) ||
        link.source_domain.toLowerCase().includes(query) ||
        (link.label ?? "").toLowerCase().includes(query)
      )
    })
  }, [links, searchQuery, statusFilter])

  async function handleRemove(link: TrackedLinkListItem) {
    if (removingId) return
    setRemovingId(link.id)
    try {
      const res = await fetch(`/api/link-tracker?id=${encodeURIComponent(link.id)}`, { method: "DELETE" })
      if (!res.ok) {
        toast.error("Failed to remove link.")
        return
      }
      removeLink(link.id)
      captureEvent(EVENTS.TRACKED_LINK_DELETED)
      toast.success("Link removed.")
    } catch {
      toast.error("Failed to remove link.")
    } finally {
      setRemovingId(null)
    }
  }

  if (!isPaid) {
    return <LinkTrackerPaywall />
  }

  if (!hydrated) {
    return <LinkTrackerSkeleton />
  }

  if (links.length === 0) {
    return (
      <Card className="px-6 py-4">
        <LinkTrackerEmpty />
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="gap-0 overflow-hidden rounded-xl py-0">
        <div className="border-b border-border/60 bg-linear-to-r from-orange/8 via-card to-card px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative min-w-0 flex-1 xl:max-w-sm">
              <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by URL or label"
                className="bg-background/80 pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    statusFilter === filter.value
                      ? "bg-(--color-blaze-orange) text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <TooltipProvider>
          {/* Mobile: stacked cards */}
          <div className="flex flex-col gap-3 p-4 sm:p-6 md:hidden">
            {filtered.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">No tracked links match your filters.</p>
            ) : (
              filtered.map((link) => (
                <div key={link.id} className="rounded-xl border border-border/60 bg-card px-4 py-3.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={faviconUrl(link.source_domain)} alt="" width={18} height={18} className="shrink-0 rounded-sm" />
                    <span className="min-w-0 flex-1 truncate font-medium">{link.label || link.source_domain}</span>
                    <a
                      href={link.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-muted-foreground/50 transition-colors hover:text-foreground"
                      aria-label={`Visit ${link.source_url}`}
                    >
                      <IconExternalLink className="size-3" />
                    </a>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{link.source_url}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <LinkStatusChip status={link.status} />
                    <span className="text-xs text-muted-foreground">{formatRelativeCheck(link.last_checked_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Page</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Last checked</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      No tracked links match your filters.
                    </td>
                  </tr>
                )}
                {filtered.map((link) => (
                  <tr key={link.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3.5">
                      <div className="flex min-w-0 items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={faviconUrl(link.source_domain)}
                          alt=""
                          width={18}
                          height={18}
                          className="shrink-0 rounded-sm"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-medium">{link.label || link.source_domain}</span>
                            <a
                              href={link.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 text-muted-foreground/50 transition-colors hover:text-foreground"
                              aria-label={`Visit ${link.source_url}`}
                            >
                              <IconExternalLink className="size-3" />
                            </a>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{link.source_url}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <LinkStatusChip status={link.status} />
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{formatRelativeCheck(link.last_checked_at)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={removingId === link.id}
                        onClick={() => handleRemove(link)}
                        className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <IconTrash className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TooltipProvider>
      </Card>
    </div>
  )
}
