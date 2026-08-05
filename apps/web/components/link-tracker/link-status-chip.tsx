import { TRACKED_LINK_STATUS_CONFIG } from "@/app/dashboard/link-tracker/_data"
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip"
import type { TrackedLinkStatus } from "@/stores/link-tracker-store"

export function LinkStatusChip({ status }: { status: TrackedLinkStatus }) {
  const config = TRACKED_LINK_STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.color}`}
        >
          <Icon className="size-3.5" />
          {config.label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{config.description}</TooltipContent>
    </Tooltip>
  )
}
