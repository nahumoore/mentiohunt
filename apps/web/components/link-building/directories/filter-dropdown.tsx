import { IconChevronDown } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import type { ElementType } from "react"

import { ALL_FILTER_CONFIG } from "@/app/dashboard/directories/_data"

export type FilterOption<TValue extends string> = {
  value: TValue
  label: string
  icon: ElementType
  count?: number
}

export function FilterDropdown<TValue extends string>({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string
  value: TValue
  options: FilterOption<TValue>[]
  onValueChange: (value: TValue) => void
}) {
  const activeOption = options.find((o) => o.value === value)
  const ActiveIcon = activeOption?.icon
  const isFiltered = value !== "all"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "min-w-42 justify-between gap-2 border-border/70 bg-card/80 shadow-xs",
            isFiltered && "border-orange/40 bg-orange/10 text-foreground hover:bg-orange/15"
          )}
        >
          <span className="text-muted-foreground">{label}</span>
          <span className="inline-flex items-center gap-1.5">
            {ActiveIcon && <ActiveIcon className="size-3.5" />}
            {activeOption?.label ?? ALL_FILTER_CONFIG.label}
          </span>
          <IconChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-72">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => onValueChange(next as TValue)}
        >
          {options.map((option) => {
            const OptionIcon = option.icon
            return (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <OptionIcon className="size-4 text-muted-foreground" />
                <span>{option.label}</span>
                {typeof option.count === "number" && (
                  <span className="ml-auto text-muted-foreground tabular-nums">
                    {option.count}
                  </span>
                )}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
