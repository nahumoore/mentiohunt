"use client"

import {
  IconArrowRight,
  IconExternalLink,
  IconMailCheck,
  IconMailOff,
} from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"
import { useRouter } from "next/navigation"

import { STATUS_CONFIG, TYPE_CONFIG } from "@/app/dashboard/opportunities/_data"
import type { ProspectListItem } from "@/stores/prospect-store"

function getDiceBearUrl(seed: string): string {
  return `https://api.dicebear.com/10.x/micah/svg?mouthVariant=smirk&facialHairVariant=&hairVariant=dannyPhantom,fonze,full,pixie&hairProbability=100&baseColor=f9c9b6,ac6651,f5bd8a&backgroundColor=ffffff&seed=${encodeURIComponent(seed)}`
}

function getFaviconUrl(domain: string | null): string | null {
  if (!domain) return null
  const host = domain.startsWith("http") ? new URL(domain).hostname : domain
  return `https://www.google.com/s2/favicons?domain=${host}&sz=32`
}

function stripDomain(url: string | null): string | null {
  if (!url) return null
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export function OpportunityPipelineRow({
  prospect,
}: {
  prospect: ProspectListItem
}) {
  const router = useRouter()
  const tierCfg = TYPE_CONFIG[prospect.tier]
  if (!tierCfg) return null

  const TierIcon = tierCfg.icon
  const hasEmail = !!prospect.contact_email?.trim()
  const avatarUrl = getDiceBearUrl(prospect.domain ?? prospect.id)
  const favicon = getFaviconUrl(prospect.domain)
  const displayDomain = stripDomain(prospect.domain)
  const dr = prospect.domain_rating
  const relevanceScore = prospect.site_relevance_score
  const relevancePercent = relevanceScore == null ? 0 : relevanceScore

  function navigate() {
    router.push(`/dashboard/opportunities/${prospect.id}`)
  }

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={navigate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") navigate()
      }}
      className="group cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30"
    >
      {/* Person col */}
      <td className="overflow-hidden py-4 pr-3 pl-6 align-top">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt=""
              width={36}
              height={36}
              className="size-9"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {prospect.contact_name ?? "Unknown contact"}
            </p>
            {hasEmail ? (
              <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-emerald-600">
                <IconMailCheck className="size-3 shrink-0" />
                <span className="truncate">{prospect.contact_email}</span>
              </span>
            ) : (
              <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground/60">
                <IconMailOff className="size-3 shrink-0" />
                No email found
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Status col */}
      <td className="px-3 py-4 align-top">
        {(() => {
          const statusCfg = STATUS_CONFIG[prospect.status]
          const StatusIcon = statusCfg.icon
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                statusCfg.color
              )}
            >
              <StatusIcon className="size-3 shrink-0" />
              {statusCfg.label}
            </span>
          )
        })()}
      </td>

      {/* Site col */}
      <td className="overflow-hidden px-3 py-4 align-top">
        <div className="flex min-w-0 items-start gap-2">
          {favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={favicon}
              alt=""
              width={24}
              height={24}
              className="mt-0.5 size-6 shrink-0 rounded-sm"
            />
          ) : (
            <div className="mt-0.5 size-6 shrink-0 rounded-sm bg-muted" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="truncate text-sm font-medium text-foreground">
                {displayDomain ?? "—"}
              </span>
              {prospect.domain && (
                <a
                  href={
                    prospect.domain.startsWith("http")
                      ? prospect.domain
                      : `https://${prospect.domain}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 hover:text-muted-foreground"
                  aria-label="Open site"
                >
                  <IconExternalLink className="size-3" />
                </a>
              )}
            </div>
            <span
              className={cn(
                "mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                tierCfg.color
              )}
            >
              <TierIcon className="size-3" />
              {tierCfg.label}
            </span>
          </div>
        </div>
      </td>

      {/* DR col */}
      <td className="px-3 py-4 align-top">
        <span className="font-mono text-2xl leading-none font-bold text-foreground tabular-nums">
          {dr ?? "—"}
        </span>
      </td>

      {/* Relevance col */}
      <td className="px-3 py-4 align-top">
        <span className="font-mono text-sm leading-none font-bold text-foreground tabular-nums">
          {relevanceScore == null ? "-" : `${relevanceScore}/100`}
        </span>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full",
              relevancePercent >= 70
                ? "bg-emerald-400"
                : relevancePercent >= 40
                  ? "bg-amber-400"
                  : "bg-red-400"
            )}
            style={{ width: `${relevancePercent}%` }}
          />
        </div>
      </td>

      {/* Action col */}
      <td className="py-4 pr-6 pl-3 align-top">
        <span className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
          Open
          <IconArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </td>
    </tr>
  )
}
