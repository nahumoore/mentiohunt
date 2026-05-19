import { cn } from "@workspace/ui/lib/utils"

import {
  TYPE_CONFIG,
  type ProspectTier,
} from "@/app/dashboard/link-building/opportunities/_data"

export function TypeBadge({ type }: { type: ProspectTier }) {
  const cfg = TYPE_CONFIG[type]
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
