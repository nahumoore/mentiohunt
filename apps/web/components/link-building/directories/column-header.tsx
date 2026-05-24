import { IconChevronDown, IconChevronRight, IconInfoCircle } from "@tabler/icons-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

export type SortDirection = "asc" | "desc"

export function ColumnHeader({
  label,
  description,
  sortable,
  sortDirection,
  onSort,
}: {
  label: string
  description: string
  sortable?: boolean
  sortDirection?: SortDirection | null
  onSort?: () => void
}) {
  const SortIcon =
    sortDirection === "asc"
      ? IconChevronRight
      : sortDirection === "desc"
        ? IconChevronDown
        : null

  return (
    <div className="flex items-center gap-1.5">
      {sortable ? (
        <button
          type="button"
          onClick={onSort}
          className="inline-flex items-center gap-1.5 rounded-md text-left transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
        >
          <span>{label}</span>
          {SortIcon ? (
            <SortIcon className="size-3.5" />
          ) : (
            <IconChevronDown className="size-3.5 opacity-35" />
          )}
        </button>
      ) : (
        <span>{label}</span>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`About ${label}`}
            className="rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <IconInfoCircle className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" align="start">
          {description}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
