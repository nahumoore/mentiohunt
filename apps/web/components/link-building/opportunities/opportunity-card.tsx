"use client"

import {
  IconArrowRight,
  IconCalendar,
  IconMailCheck,
  IconMailOff,
  IconSwords,
} from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"
import { useRouter } from "next/navigation"

function getDiceBearUrl(seed: string): string {
  return `https://api.dicebear.com/10.x/micah/svg?mouthVariant=smirk&facialHairVariant=&hairVariant=dannyPhantom,fonze,full,pixie&hairProbability=100&baseColor=f9c9b6,ac6651,f5bd8a&backgroundColor=ffffff&seed=${encodeURIComponent(seed)}`
}

import {
  TYPE_CONFIG,
  formatDate,
  type ProspectTier,
} from "@/app/dashboard/opportunities/_data"
import type { ProspectListItem } from "@/stores/prospect-store"

const TIER_BORDER: Record<ProspectTier, string> = {
  competitor_backlink: "border-l-amber-500",
  unlinked_mention: "border-l-violet-500",
}

function extractHostname(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

export function OpportunityCard({ prospect }: { prospect: ProspectListItem }) {
  const router = useRouter()
  const tierCfg = TYPE_CONFIG[prospect.tier]
  if (!tierCfg) return null
  const TierIcon = tierCfg.icon
  const avatarUrl = getDiceBearUrl(prospect.domain ?? prospect.id)
  const hasEmail = !!prospect.contact_email?.trim()
  const competitorHostname =
    prospect.tier === "competitor_backlink"
      ? extractHostname(prospect.target_url)
      : null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/dashboard/opportunities/${prospect.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ")
          router.push(`/dashboard/opportunities/${prospect.id}`)
      }}
      className={cn(
        "group cursor-pointer rounded-lg border border-l-4 border-border/60 bg-card",
        "transition-all hover:shadow-sm",
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
          <div className="ml-auto flex items-center gap-1.5">
            {prospect.site_relevance_score != null && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                  prospect.site_relevance_score >= 70
                    ? "bg-emerald-500/10 text-emerald-600"
                    : prospect.site_relevance_score >= 50
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-muted text-muted-foreground"
                )}
              >
                fit {prospect.site_relevance_score}/100
              </span>
            )}
            {prospect.domain_rating != null && (
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-sm font-semibold text-muted-foreground tabular-nums">
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
        </div>
      </div>

      <div className="border-t border-border/50" />

      <div className="flex items-center justify-between gap-4 px-5 py-3">
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
            {formatDate(prospect.discovered_at)}
          </span>
        </div>

        <IconArrowRight className="size-6 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  )
}
