import { IconClock } from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"

import {
  getDeadlineInfo,
  type DeadlineUrgency,
} from "@/app/dashboard/link-building/opportunities/_data"

const URGENCY_COLOR: Record<DeadlineUrgency, string> = {
  passed: "text-muted-foreground bg-muted",
  urgent: "text-red-600 bg-red-500/10",
  soon: "text-orange-600 bg-orange-500/10",
  normal: "text-muted-foreground bg-muted/60",
}

export function DeadlinePill({ deadline }: { deadline: string | null }) {
  const info = getDeadlineInfo(deadline)
  if (!info) return null

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        URGENCY_COLOR[info.urgency]
      )}
    >
      <IconClock className="size-3 shrink-0" />
      {info.label}
    </span>
  )
}
