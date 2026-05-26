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
import { toast } from "sonner"

import type { CommunityMention, MentionSortKey } from "@/app/dashboard/community-mentions/reply-queue/_data"
import { SORT_OPTIONS } from "@/app/dashboard/community-mentions/reply-queue/_data"
import { useCommunityMentionStore } from "@/stores/community-mention-store"
import { MentionCard } from "./mention-card"
import { MentionSidebar } from "./mention-sidebar"

const PAGE_SIZE = 5

export function MentionFeed() {
  const allMentions = useCommunityMentionStore((state) => state.mentions)
  const isLoading = useCommunityMentionStore((state) => state.isLoading)
  const hasRunningRun = useCommunityMentionStore((state) => state.hasRunningRun)
  const hasReplyQueueConfig = useCommunityMentionStore((state) => state.hasReplyQueueConfig)
  const updateMentionStatus = useCommunityMentionStore(
    (state) => state.updateMentionStatus
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState<MentionSortKey>("relevance")
  const [exitDirections, setExitDirections] = useState<Record<string, "left" | "right">>({})
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  function filtered(): CommunityMention[] {
    return allMentions
      .filter((m) => m.status === "new")
      .sort((a, b) => {
        switch (sortKey) {
          case "date":
            return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
          case "reactions":
            return b.engagement.reactions - a.engagement.reactions
          case "comments":
            return b.engagement.comments - a.engagement.comments
          default:
            return b.relevanceScore - a.relevanceScore
        }
      })
  }

  const filteredList = filtered()
  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE))
  const paginated = filteredList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function updateReplyStatus(id: string, status: "replied" | "dismissed") {
    fetch("/api/community-mentions/update-reply", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch(() => {})
  }

  function handleMarkReplied(id: string) {
    setExitDirections((prev) => ({ ...prev, [id]: "right" }))
    updateReplyStatus(id, "replied")
    setTimeout(() => {
      updateMentionStatus(id, "replied")
    }, 16)
  }

  function handleMarkDismissed(id: string) {
    setExitDirections((prev) => ({ ...prev, [id]: "left" }))
    updateReplyStatus(id, "dismissed")
    toast("Got it — we'll filter similar posts going forward.", {
      duration: 4000,
    })
    setTimeout(() => {
      updateMentionStatus(id, "dismissed")
    }, 16)
  }

  function handlePageChange(page: number) {
    setCurrentPage(page)
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0)
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

  if (allMentions.length === 0 && !hasRunningRun && hasReplyQueueConfig) {
    return (
      <section className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <IconLoader2 className="size-5 animate-spin text-primary" />
          </span>
          <h2 className="text-base font-semibold text-foreground">
            Loading threads and posts
          </h2>
          <p className="text-sm text-muted-foreground">
            Your first scan is queued. We&apos;ll search the communities you
            configured and surface relevant threads shortly.
          </p>
        </div>
      </section>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Sort by</span>
          <div className="flex gap-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setSortKey(opt.value); setCurrentPage(1) }}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  sortKey === opt.value
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {filteredList.length === 0 ? (
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
  )
}

function MentionFeedSkeleton() {
  return (
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
          <Skeleton className="mb-4 h-3 w-20" />
          <Skeleton className="mb-2 h-10 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
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
