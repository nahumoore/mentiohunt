import { cn } from "@workspace/ui/lib/utils"

import { STATUS_CONFIG, type DirectorySubmissionStatus } from "@/app/dashboard/link-building/directories/_data"

export function StatusBadge({ status }: { status: DirectorySubmissionStatus }) {
  const cfg = STATUS_CONFIG[status]
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
