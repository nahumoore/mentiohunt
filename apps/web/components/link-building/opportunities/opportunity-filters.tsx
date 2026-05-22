import {
  IconChevronDown,
  IconListDetails,
  IconSearch,
  IconX,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

import {
  TYPE_CONFIG,
  type ProspectTier,
} from "@/app/dashboard/link-building/opportunities/_data"

type TypeFilterValue = ProspectTier | "all"

interface OpportunityFiltersProps {
  search: string
  typeFilter: TypeFilterValue
  typeCounts: Record<ProspectTier, number>
  total: number
  hasActiveFilters: boolean
  onSearchChange: (value: string) => void
  onTypeChange: (value: TypeFilterValue) => void
  onClear: () => void
}

const TYPE_OPTIONS = Object.entries(TYPE_CONFIG) as [
  ProspectTier,
  (typeof TYPE_CONFIG)[ProspectTier],
][]

export function OpportunityFilters({
  search,
  typeFilter,
  typeCounts,
  total,
  hasActiveFilters,
  onSearchChange,
  onTypeChange,
  onClear,
}: OpportunityFiltersProps) {
  const activeTypeCfg =
    typeFilter !== "all" ? TYPE_CONFIG[typeFilter] : undefined
  const ActiveTypeIcon = activeTypeCfg?.icon

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search domain or URL"
          className="bg-background/80 pl-9"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "justify-between gap-2 border-border/70 bg-card/80 shadow-xs",
              typeFilter !== "all" &&
                "border-orange/40 bg-orange/10 text-foreground hover:bg-orange/15"
            )}
          >
            <span className="text-muted-foreground">Type</span>
            <span className="inline-flex items-center gap-1.5">
              {ActiveTypeIcon ? (
                <ActiveTypeIcon className="size-3.5" />
              ) : (
                <IconListDetails className="size-3.5" />
              )}
              {activeTypeCfg?.label ?? "All"}
            </span>
            <IconChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-64">
          <DropdownMenuLabel>Opportunity type</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={typeFilter}
            onValueChange={(v) => onTypeChange(v as TypeFilterValue)}
          >
            <DropdownMenuRadioItem value="all">
              <IconListDetails className="size-4 text-muted-foreground" />
              <span>All</span>
              <span className="ml-auto text-muted-foreground tabular-nums">
                {total}
              </span>
            </DropdownMenuRadioItem>
            {TYPE_OPTIONS.map(([tier, cfg]) => {
              const Icon = cfg.icon
              return (
                <DropdownMenuRadioItem key={tier} value={tier}>
                  <Icon className="size-4 text-muted-foreground" />
                  <span>{cfg.label}</span>
                  <span className="ml-auto text-muted-foreground tabular-nums">
                    {typeCounts[tier]}
                  </span>
                </DropdownMenuRadioItem>
              )
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground"
        >
          <IconX className="size-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
