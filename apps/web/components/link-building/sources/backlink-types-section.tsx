"use client"

import { IconListNumbers } from "@tabler/icons-react"
import { Switch } from "@workspace/ui/components/switch"
import { cn } from "@workspace/ui/lib/utils"
import type { ReactNode } from "react"

import type { OpportunityType } from "@/lib/opportunity-types"
import { TYPE_CONFIG } from "@/lib/opportunity-types"

type BacklinkTypesSectionProps = {
  opportunityTypes: OpportunityType[]
  activeTypes: Set<OpportunityType>
  onToggle: (type: OpportunityType) => void
  footer: ReactNode
}

export function BacklinkTypesSection({
  opportunityTypes,
  activeTypes,
  onToggle,
  footer,
}: BacklinkTypesSectionProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
      <div className="border-b border-border/70 px-5 py-4">
        <p className="text-sm font-medium">Backlink types</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Choose the sources you want Mentiohunt to look for.
        </p>
      </div>
      {opportunityTypes.map((type) => {
        const cfg = TYPE_CONFIG[type]
        const Icon = cfg.icon
        const isActive = activeTypes.has(type)

        return (
          <div
            key={type}
            onClick={() => onToggle(type)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onToggle(type)
            }}
            role="switch"
            aria-checked={isActive}
            tabIndex={0}
            className={cn(
              "group flex items-center gap-4 border-b border-border/70 px-5 py-4 transition-colors last:border-b-0",
              "cursor-pointer hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset",
              !isActive && "opacity-50 grayscale hover:opacity-80"
            )}
          >
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-2xl",
                cfg.color
              )}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-sm font-medium">{cfg.label}</p>
                {!isActive && (
                  <span className="text-xs text-muted-foreground">Paused</span>
                )}
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                {cfg.description}
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={() => onToggle(type)}
              onClick={(event) => event.stopPropagation()}
              className="mt-0.5 shrink-0"
              tabIndex={-1}
            />
          </div>
        )
      })}
      <div
        className={cn(
          "flex items-center gap-4 border-b border-border/70 px-5 py-4 last:border-b-0",
          "cursor-not-allowed opacity-50 grayscale"
        )}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl text-blue-600 bg-blue-500/10">
          <IconListNumbers className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-medium">Listicle &amp; Roundup Inclusion</p>
            <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
              Coming soon
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Find "best X tools" and "top N alternatives" posts ranking in your niche. Pitch adding your product. High intent, recurring as posts get updated.
          </p>
        </div>
        <Switch checked={false} disabled className="mt-0.5 shrink-0" tabIndex={-1} />
      </div>
      {footer}
    </div>
  )
}
