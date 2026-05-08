"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { IconChevronRight, IconMessage2Share } from "@tabler/icons-react"

import { Card } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

import {
  INTENT_CONFIG,
  MOCK_COMMUNITY_MENTIONS,
  PLATFORM_CONFIG,
  STATUS_CONFIG,
  formatShortDateTime,
  scoreColor,
  type MentionIntent,
  type MentionPlatform,
  type MentionStatus,
} from "./_data"

const STATUS_FILTERS: { value: MentionStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "saved", label: "Saved" },
  { value: "replied", label: "Replied" },
  { value: "dismissed", label: "Dismissed" },
]

function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
        scoreColor(score)
      )}
    >
      {score}
    </span>
  )
}

function PlatformBadge({ platform }: { platform: MentionPlatform }) {
  const cfg = PLATFORM_CONFIG[platform]
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        cfg.color
      )}
    >
      <Icon className="size-3" />
      {cfg.label}
    </span>
  )
}

function IntentBadge({ intent }: { intent: MentionIntent }) {
  const cfg = INTENT_CONFIG[intent]
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        cfg.color
      )}
    >
      <Icon className="size-3" />
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status }: { status: MentionStatus }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        cfg.color
      )}
    >
      <Icon className="size-3" />
      {cfg.label}
    </span>
  )
}

export default function ReplyQueuePage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<MentionStatus | "all">("all")

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(
      STATUS_FILTERS.filter((filter) => filter.value !== "all").map((filter) => [
        filter.value,
        0,
      ])
    ) as Record<MentionStatus, number>

    MOCK_COMMUNITY_MENTIONS.forEach((mention) => {
      counts[mention.status] += 1
    })

    return counts
  }, [])

  const filteredMentions = useMemo(() => {
    if (statusFilter === "all") return MOCK_COMMUNITY_MENTIONS
    return MOCK_COMMUNITY_MENTIONS.filter(
      (mention) => mention.status === statusFilter
    )
  }, [statusFilter])

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-orange/20 bg-[linear-gradient(135deg,var(--color-card)_0%,color-mix(in_oklch,var(--color-amber-glow)_10%,var(--color-card))_55%,var(--color-background)_100%)] p-4 shadow-sm ring-1 shadow-orange/5 ring-foreground/5 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              <IconMessage2Share className="size-7 shrink-0" />
              Reply queue
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Posts where Mentiohunt found a relevant conversation, scored the
              fit, and prepared a reply for human review.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:max-w-md lg:justify-end">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
                  statusFilter === filter.value
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-background/60 text-muted-foreground ring-1 ring-border/70 hover:bg-orange/10 hover:text-foreground hover:ring-orange/30"
                )}
              >
                {filter.label}
                {filter.value !== "all" && (
                  <span className="ml-1.5 tabular-nums opacity-60">
                    {statusCounts[filter.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                  Post
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Platform
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Intent
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Relevance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Posted
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Next action
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredMentions.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-sm text-muted-foreground"
                  >
                    No community mentions with this status yet.
                  </td>
                </tr>
              )}
              {filteredMentions.map((mention) => (
                <tr
                  key={mention.id}
                  onClick={() =>
                    router.push(
                      `/dashboard/community-mentions/reply-queue/${mention.id}`
                    )
                  }
                  className="cursor-pointer border-b border-border/40 transition-colors last:border-0 hover:bg-muted/40"
                >
                  <td className="min-w-[320px] px-6 py-3.5">
                    <p className="font-medium leading-snug">{mention.postTitle}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {mention.postExcerpt}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/80">
                      {mention.sourceName} · {mention.authorName}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <PlatformBadge platform={mention.platform} />
                  </td>
                  <td className="px-4 py-3.5">
                    <IntentBadge intent={mention.intent} />
                  </td>
                  <td className="px-4 py-3.5">
                    <ScoreBadge score={mention.relevanceScore} />
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={mention.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground tabular-nums">
                    {formatShortDateTime(mention.postedAt)}
                  </td>
                  <td className="min-w-[180px] px-4 py-3.5 text-muted-foreground">
                    {mention.nextAction}
                  </td>
                  <td className="px-4 py-3.5">
                    <IconChevronRight className="size-4 text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
