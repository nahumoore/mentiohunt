import { cn } from "@workspace/ui/lib/utils"

import {
  SOURCE_CONFIG,
  type MediaMentionSource,
} from "@/app/dashboard/link-building/opportunities/_data"

export function SourceBadge({ source }: { source: MediaMentionSource }) {
  const cfg = SOURCE_CONFIG[source]
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        cfg.color
      )}
    >
      <Icon className="size-3" />
      {cfg.label}
    </span>
  )
}
