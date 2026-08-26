"use client"

import {
  IconArrowRight,
  IconCalendar,
  IconFileText,
  IconLoader2,
  IconMailCheck,
  IconMailOff,
  IconSwords,
} from "@tabler/icons-react"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { useRouter } from "next/navigation"

import { getContactAvatarUrl } from "@/consts/contact-avatar"
import { usePagesStore } from "@/stores/pages-store"

import {
  STATUS_CONFIG,
  TYPE_CONFIG,
  formatDate,
  type ProspectTier,
} from "@/app/dashboard/prospects/_data"
import type { ProspectListItem } from "@/stores/prospect-store"

const TIER_BORDER: Record<ProspectTier, string> = {
  competitor_backlink: "border-l-amber-500",
  unlinked_mention: "border-l-violet-500",
  listicle_roundup: "border-l-blue-500",
  resource_page_inclusion: "border-l-emerald-500",
  broken_link_building: "border-l-rose-500",
  user_submitted: "border-l-sky-500",
}

function extractHostname(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

function getPageDisplay(url: string): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, "")
    return parsed.pathname !== "/" ? host + parsed.pathname : host
  } catch {
    return url
  }
}

export function OpportunityCard({ prospect }: { prospect: ProspectListItem }) {
  const router = useRouter()
  const pages = usePagesStore((state) => state.pages)
  const tierCfg = TYPE_CONFIG[prospect.tier]
  if (!tierCfg) return null
  const TierIcon = tierCfg.icon
  const statusCfg = STATUS_CONFIG[prospect.status]
  const StatusIcon = statusCfg.icon
  const avatarUrl = getContactAvatarUrl(prospect.domain ?? prospect.id)
  const hasEmail = !!prospect.contact_email?.trim()
  const isEnriching =
    prospect.enrichment_status === "pending" ||
    prospect.enrichment_status === "enriching"
  const competitorHostname =
    prospect.tier === "competitor_backlink"
      ? extractHostname(prospect.target_url)
      : null
  const sourcePage =
    prospect.source_page ??
    (prospect.product_page_id
      ? (pages.find((page) => page.id === prospect.product_page_id) ?? null)
      : null)

  function navigate() {
    if (isEnriching) return
    router.push(`/dashboard/prospects/${prospect.id}`)
  }

  return (
    <div
      role="button"
      tabIndex={isEnriching ? -1 : 0}
      onClick={navigate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") navigate()
      }}
      className={cn(
        "group rounded-lg border border-l-4 border-border/60 bg-card",
        "transition-all",
        isEnriching ? "cursor-default" : "cursor-pointer hover:shadow-sm",
        TIER_BORDER[prospect.tier]
      )}
    >
      <div className="flex flex-col gap-3 px-5 py-4">
        {/* badges row */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              tierCfg.color
            )}
          >
            <TierIcon className="size-3" />
            {tierCfg.label}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              statusCfg.color
            )}
          >
            <StatusIcon className="size-3" />
            {statusCfg.label}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            {prospect.domain_rating != null && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums",
                  prospect.domain_rating >= 60
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : prospect.domain_rating >= 30
                      ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                      : "bg-muted text-muted-foreground"
                )}
              >
                DR {prospect.domain_rating}
              </span>
            )}
          </div>
        </div>

        {/* domain / fallback title */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="size-7 shrink-0 overflow-hidden rounded-lg bg-white border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl}
                alt=""
                width={28}
                height={28}
                className="size-7"
              />
            </div>
            <p className="text-base font-semibold text-foreground">
              {prospect.domain ?? prospect.contact_name ?? tierCfg.label}
            </p>
          </div>
          {competitorHostname && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <IconSwords className="size-3 shrink-0 text-amber-500/70" />
              links to{" "}
              <span className="font-medium text-foreground/70">
                {competitorHostname}
              </span>
            </span>
          )}
          {sourcePage && (
            <span className="inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              <IconFileText className="size-3 shrink-0 text-emerald-500/70" />
              <span className="shrink-0">found using</span>
              <span className="truncate font-medium text-foreground/70">
                {sourcePage.title || getPageDisplay(sourcePage.url)}
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-border/50" />

      <div className="flex items-center justify-between gap-4 px-5 py-3">
        {isEnriching ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Skeleton className="h-3.5 w-24 rounded" />
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/60">
              <IconLoader2 className="size-3 shrink-0 animate-spin" />
              {prospect.enrichment_status === "enriching"
                ? "Finding contact…"
                : "Queued…"}
            </span>
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-3 text-xs text-muted-foreground">
            {/* contact readiness */}
            {hasEmail ? (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <IconMailCheck className="size-3.5 shrink-0" />
                {prospect.contact_name ?? prospect.contact_email}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted-foreground/60">
                <IconMailOff className="size-3.5 shrink-0" />
                No contact
              </span>
            )}

            <span className="text-border">·</span>

            <span className="flex items-center gap-1">
              <IconCalendar className="size-3 shrink-0" />
              {formatDate(prospect.last_interaction_at ?? prospect.discovered_at)}
            </span>
          </div>
        )}

        <IconArrowRight className="size-6 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  )
}
