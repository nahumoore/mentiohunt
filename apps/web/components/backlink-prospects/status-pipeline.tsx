import { IconChevronRight } from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"

import {
  STATUS_CONFIG,
  type ProspectStatus,
} from "@/app/dashboard/link-building/prospects/_data"

const STATUS_ORDER: ProspectStatus[] = [
  "new",
  "submitted",
  "contacted",
  "replied",
  "won",
]

export function StatusPipeline({ status }: { status: ProspectStatus }) {
  if (status === "dismissed") {
    const cfg = STATUS_CONFIG.dismissed
    const Icon = cfg.icon
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          cfg.color
        )}
      >
        <Icon className="size-3.5" />
        {cfg.label}
      </span>
    )
  }

  const currentIdx = STATUS_ORDER.indexOf(status)

  return (
    <div className="flex flex-wrap items-center gap-0.5">
      {STATUS_ORDER.map((nextStatus, index) => {
        const cfg = STATUS_CONFIG[nextStatus]
        const Icon = cfg.icon
        const isActive = index === currentIdx
        const isPast = index < currentIdx

        return (
          <div key={nextStatus} className="flex items-center gap-0.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors",
                isActive
                  ? cfg.color
                  : isPast
                    ? "text-muted-foreground/50 line-through"
                    : "text-muted-foreground/30"
              )}
            >
              <Icon className="size-3" />
              {cfg.label}
            </span>
            {index < STATUS_ORDER.length - 1 && (
              <IconChevronRight className="size-3 shrink-0 text-muted-foreground/25" />
            )}
          </div>
        )
      })}
    </div>
  )
}
