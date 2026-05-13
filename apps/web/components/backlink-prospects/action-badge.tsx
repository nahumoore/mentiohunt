import { cn } from "@workspace/ui/lib/utils"

import {
  ACTION_TYPE_CONFIG,
  type ProspectActionType,
} from "@/app/dashboard/link-building/prospects/_data"

export function ActionBadge({ actionType }: { actionType: ProspectActionType }) {
  const cfg = ACTION_TYPE_CONFIG[actionType]
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
