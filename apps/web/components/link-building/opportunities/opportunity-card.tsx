import {
  IconCalendar,
  IconChevronRight,
  IconMail,
} from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"

import {
  ACTION_TYPE_CONFIG,
  STATUS_CONFIG,
  TYPE_CONFIG,
  formatDate,
  type ProspectTier,
} from "@/app/dashboard/link-building/opportunities/_data"
import type { ProspectListItem } from "@/stores/prospect-store"

const TIER_BORDER: Record<ProspectTier, string> = {
  competitor_backlink: "border-l-amber-500",
  unlinked_mention: "border-l-violet-500",
  media_mention: "border-l-sky-500",
}

function urlPath(raw: string): string {
  try {
    const path = new URL(raw).pathname
    return path === "/" ? "" : path
  } catch {
    return ""
  }
}

export function OpportunityCard({ prospect }: { prospect: ProspectListItem }) {
  const tierCfg = TYPE_CONFIG[prospect.tier]
  const statusCfg = STATUS_CONFIG[prospect.status]
  const actionCfg = ACTION_TYPE_CONFIG[prospect.action_type]
  const TierIcon = tierCfg.icon
  const StatusIcon = statusCfg.icon
  const ActionIcon = actionCfg.icon
  const path = urlPath(prospect.target_url)

  return (
    <Link
      href={`/dashboard/link-building/opportunities/${prospect.id}`}
      className={cn(
        "group flex flex-col gap-3 rounded-lg border border-border/60 border-l-4 bg-card px-5 py-4",
        "transition-all hover:border-border hover:shadow-sm",
        TIER_BORDER[prospect.tier]
      )}
    >
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
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            actionCfg.color
          )}
        >
          <ActionIcon className="size-3" />
          {actionCfg.label}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              statusCfg.color
            )}
          >
            <StatusIcon className="size-3" />
            {statusCfg.label}
          </span>
          <IconChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>

      <div>
        <p className="font-semibold text-foreground">{prospect.domain}</p>
        {path && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{path}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {prospect.contact_email && (
          <span className="flex items-center gap-1">
            <IconMail className="size-3 shrink-0" />
            <span className="truncate">{prospect.contact_email}</span>
          </span>
        )}
        <span className="flex items-center gap-1">
          <IconCalendar className="size-3 shrink-0" />
          {formatDate(prospect.discovered_at)}
        </span>
      </div>
    </Link>
  )
}
