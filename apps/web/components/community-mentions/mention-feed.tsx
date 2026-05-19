"use client"

import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import {
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconLoader2,
  IconRadar2,
} from "@tabler/icons-react"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"

import type {
  CommunityMention,
  MentionIntent,
  MentionSortKey,
  MentionStatus,
} from "@/app/dashboard/community-mentions/reply-queue/_data"
import { INTENT_CONFIG, SORT_OPTIONS } from "@/app/dashboard/community-mentions/reply-queue/_data"
import {
  PLATFORM_CONFIG,
  type MentionPlatform,
} from "@/consts/platform-config"
import { useCommunityMentionStore } from "@/stores/community-mention-store"
import { MentionCard } from "./mention-card"
import { MentionSidebar } from "./mention-sidebar"

const PAGE_SIZE = 5

type StatusFilter = MentionStatus | "all"
type PlatformFilter = MentionPlatform | "all"
type IntentFilter = MentionIntent | "all"

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "new", label: "New" },
  { value: "saved", label: "Saved" },
  { value: "replied", label: "Replied" },
  { value: "dismissed", label: "Dismissed" },
]

const PILL = "rounded-lg px-3 py-1 text-xs font-medium transition-colors"
const PILL_ACTIVE = "bg-primary text-white"
const PILL_IDLE = "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"

export function MentionFeed() {
  const allMentions = useCommunityMentionStore((state) => state.mentions)
  const isLoading = useCommunityMentionStore((state) => state.isLoading)
  const hasRunningRun = useCommunityMentionStore((state) => state.hasRunningRun)
  const updateMentionStatus = useCommunityMentionStore(
    (state) => state.updateMentionStatus
  )
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("new")
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all")
  const [intentFilter, setIntentFilter] = useState<IntentFilter>("all")
  const [sort, setSort] = useState<MentionSortKey>("relevance")
  const [currentPage, setCurrentPage] = useState(1)
  const [exitDirections, setExitDirections] = useState<Record<string, "left" | "right">>({})
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const pendingCount = allMentions.filter((m) => m.status === "new").length

  function filtered(): CommunityMention[] {
    return allMentions
      .filter((m) => statusFilter === "all" || m.status === statusFilter)
      .filter((m) => platformFilter === "all" || m.platform === platformFilter)
      .filter((m) => intentFilter === "all" || m.intent === intentFilter)
      .sort((a, b) => {
        switch (sort) {
          case "relevance": return b.relevanceScore - a.relevanceScore
          case "date": return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
          case "reactions": return b.engagement.reactions - a.engagement.reactions
          case "comments": return b.engagement.comments - a.engagement.comments
          default: return 0
        }
      })
  }

  const filteredList = filtered()
  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE))
  const paginated = filteredList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const showBatchComplete = filteredList.length === 0 && pendingCount === 0 && statusFilter === "new"

  function handleMarkReplied(id: string) {
    setExitDirections((prev) => ({ ...prev, [id]: "right" }))
    setTimeout(() => {
      updateMentionStatus(id, "replied")
    }, 16)
  }

  function handleMarkDismissed(id: string) {
    setExitDirections((prev) => ({ ...prev, [id]: "left" }))
    setTimeout(() => {
      updateMentionStatus(id, "dismissed")
    }, 16)
  }

  function handlePageChange(page: number) {
    setCurrentPage(page)
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0)
  }

  function handleStatusChange(v: StatusFilter) {
    setStatusFilter(v)
    setCurrentPage(1)
  }

  function handlePlatformChange(v: PlatformFilter) {
    setPlatformFilter(v)
    setCurrentPage(1)
  }

  function handleIntentChange(v: IntentFilter) {
    setIntentFilter(v)
    setCurrentPage(1)
  }

  function handleSortChange(v: MentionSortKey) {
    setSort(v)
    setCurrentPage(1)
  }

  if (isLoading) {
    return <MentionFeedSkeleton />
  }

  if (allMentions.length === 0 && hasRunningRun) {
    return (
      <section className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <IconLoader2 className="size-5 animate-spin text-primary" />
          </span>
          <h2 className="text-base font-semibold text-foreground">
            Scanning communities for mentions
          </h2>
          <p className="text-sm text-muted-foreground">
            We&apos;re searching Reddit and your configured communities for posts
            that match your product. This usually takes a few minutes — check
            back shortly.
          </p>
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <MentionFilters
          statusFilter={statusFilter}
          platformFilter={platformFilter}
          intentFilter={intentFilter}
          sort={sort}
          onStatusChange={handleStatusChange}
          onPlatformChange={handlePlatformChange}
          onIntentChange={handleIntentChange}
          onSortChange={handleSortChange}
        />
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
          <span>
            <span className="font-semibold text-foreground">{pendingCount}</span>{" "}
            pending mention{pendingCount !== 1 ? "s" : ""} to review
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {showBatchComplete ? (
            <section className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
              <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <IconRadar2 className="size-5 text-primary" />
                </span>
                <h2 className="text-base font-semibold text-foreground">You reviewed all pending mentions</h2>
                <p className="text-sm text-muted-foreground">
                  Fresh mentions will appear here as they&apos;re detected.
                </p>
              </div>
            </section>
          ) : filteredList.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No mentions match your filters.</p>
          ) : (
            <AnimatePresence mode="popLayout">
              {paginated.map((mention) => (
                <MentionCard
                  key={mention.id}
                  mention={mention}
                  exitDirection={exitDirections[mention.id]}
                  onMarkReplied={handleMarkReplied}
                  onMarkDismissed={handleMarkDismissed}
                />
              ))}
            </AnimatePresence>
          )}

          {totalPages > 1 && filteredList.length > 0 && (
            <nav aria-label="Mention pages" className="flex items-center justify-center gap-1 pt-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                aria-label="Previous page"
              >
                <IconArrowLeft className="size-3.5" />
              </button>
              <PageButtons currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                aria-label="Next page"
              >
                <IconArrowRight className="size-3.5" />
              </button>
            </nav>
          )}

          {totalPages > 1 && filteredList.length > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
          )}

          <AnimatePresence>
            {showScrollTop && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.2 }}
                className="flex justify-center pt-2 pb-4"
              >
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-xs font-semibold text-foreground shadow-sm transition-all hover:bg-muted hover:shadow-md"
                >
                  <IconArrowUp className="size-3.5" />
                  Scroll to top
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <MentionSidebar mentions={allMentions} />
      </div>
    </div>
  )
}

function MentionFeedSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-28 rounded-lg" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-24 rounded-lg" />
            <Skeleton className="h-7 w-28 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-5 w-44 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <section
              key={index}
              className="rounded-xl border border-border bg-card p-8"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="mb-4 h-6 w-4/5" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="mt-6 h-32 w-full" />
              <div className="mt-5 flex justify-between border-t border-border pt-5">
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-32 rounded-lg" />
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <Skeleton className="mb-5 h-3 w-28" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <Skeleton className="mb-5 h-3 w-32" />
            <div className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function MentionFilters({
  statusFilter,
  platformFilter,
  intentFilter,
  sort,
  onStatusChange,
  onPlatformChange,
  onIntentChange,
  onSortChange,
}: {
  statusFilter: StatusFilter
  platformFilter: PlatformFilter
  intentFilter: IntentFilter
  sort: MentionSortKey
  onStatusChange: (v: StatusFilter) => void
  onPlatformChange: (v: PlatformFilter) => void
  onIntentChange: (v: IntentFilter) => void
  onSortChange: (v: MentionSortKey) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold text-muted-foreground">Filters:</span>

        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStatusChange(opt.value)}
            className={cn(PILL, statusFilter === opt.value ? PILL_ACTIVE : PILL_IDLE)}
          >
            {opt.label}
          </button>
        ))}

        <span className="mx-1 h-4 w-px bg-border" />

        {(["all", "reddit", "bluesky"] as const).map((p) => (
          <button
            key={p}
            onClick={() => onPlatformChange(p)}
            className={cn(PILL, platformFilter === p ? PILL_ACTIVE : PILL_IDLE)}
          >
            {p === "all" ? "All platforms" : PLATFORM_CONFIG[p].label}
          </button>
        ))}

        <span className="mx-1 h-4 w-px bg-border" />

        <select
          value={intentFilter}
          onChange={(e) => onIntentChange(e.target.value as IntentFilter)}
          className="rounded-lg bg-muted px-2 py-1 text-xs font-medium text-foreground outline-none transition-colors hover:bg-muted/80 focus:ring-1 focus:ring-primary"
        >
          <option value="all">All intents</option>
          {(Object.keys(INTENT_CONFIG) as MentionIntent[]).map((key) => (
            <option key={key} value={key}>{INTENT_CONFIG[key].label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold text-muted-foreground">Sort:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSortChange(opt.value)}
            className={cn(PILL, sort === opt.value ? PILL_ACTIVE : PILL_IDLE)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function PageButtons({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const pages: (number | "ellipsis")[] = []

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push("ellipsis")
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push("ellipsis")
    pages.push(totalPages)
  }

  return (
    <>
      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="flex size-8 items-center justify-center text-xs text-muted-foreground">
            &hellip;
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={cn(
              "flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-colors",
              p === currentPage
                ? "bg-primary text-white"
                : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {p}
          </button>
        )
      )}
    </>
  )
}
