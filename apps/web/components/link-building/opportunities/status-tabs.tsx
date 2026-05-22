import { cn } from "@workspace/ui/lib/utils"

import {
  STATUS_FILTERS,
  type ProspectStatus,
} from "@/app/dashboard/link-building/opportunities/_data"

type StatusTabValue = ProspectStatus | "all"

interface StatusTabsProps {
  value: StatusTabValue
  counts: Record<ProspectStatus, number>
  total: number
  onChange: (value: StatusTabValue) => void
}

export function StatusTabs({
  value,
  counts,
  total,
  onChange,
}: StatusTabsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {STATUS_FILTERS.map((tab) => {
        const Icon = tab.icon
        const count = tab.value === "all" ? total : counts[tab.value]
        const active = value === tab.value

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-foreground text-background"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-3" />
            {tab.label}
            <span className="tabular-nums opacity-70">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
