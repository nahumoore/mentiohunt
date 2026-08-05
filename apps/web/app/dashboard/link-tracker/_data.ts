import {
  IconAlertTriangle,
  IconClock,
  IconCircleCheck,
  IconCircleX,
  IconLinkOff,
  IconArrowsExchange,
  IconMoodSad,
} from "@tabler/icons-react"
import type { ElementType } from "react"

import type { TrackedLinkStatus } from "@/stores/link-tracker-store"

export interface StatusConfig {
  label: string
  description: string
  icon: ElementType
  color: string
}

export const TRACKED_LINK_STATUS_CONFIG: Record<TrackedLinkStatus, StatusConfig> = {
  pending: {
    label: "Checking",
    description: "First check hasn't run yet — usually done within a minute or two.",
    icon: IconClock,
    color: "text-muted-foreground bg-muted",
  },
  live: {
    label: "Live",
    description: "Link is present and dofollow, pointing where expected.",
    icon: IconCircleCheck,
    color: "text-green-600 bg-green-500/10",
  },
  nofollow: {
    label: "Nofollow",
    description: "Link is still there but now marked nofollow, ugc, or sponsored.",
    icon: IconAlertTriangle,
    color: "text-amber-600 bg-amber-500/10",
  },
  target_changed: {
    label: "Target changed",
    description: "Link now points to a different URL on your domain.",
    icon: IconArrowsExchange,
    color: "text-yellow-600 bg-yellow-500/10",
  },
  removed: {
    label: "Removed",
    description: "We couldn't find your link on this page anymore.",
    icon: IconLinkOff,
    color: "text-red-600 bg-red-500/10",
  },
  page_dead: {
    label: "Page down",
    description: "The source page itself now 404s or errors out.",
    icon: IconCircleX,
    color: "text-red-600 bg-red-500/10",
  },
  check_failed: {
    label: "Couldn't verify",
    description: "We haven't been able to check this page successfully in a few tries.",
    icon: IconMoodSad,
    color: "text-muted-foreground bg-muted",
  },
}

export const STATUS_FILTERS: Array<{ value: TrackedLinkStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "nofollow", label: "Nofollow" },
  { value: "target_changed", label: "Target changed" },
  { value: "removed", label: "Removed" },
  { value: "page_dead", label: "Page down" },
  { value: "check_failed", label: "Couldn't verify" },
  { value: "pending", label: "Checking" },
]

export function formatRelativeCheck(iso: string | null): string {
  if (!iso) return "Not yet checked"
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffHours = Math.round(diffMs / (60 * 60 * 1000))
  if (diffHours < 1) return "Just now"
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}
