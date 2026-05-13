"use client"

import { useMemo, useState } from "react"
import type { ElementType } from "react"
import { useRouter } from "next/navigation"
import {
  IconChevronDown,
  IconChevronRight,
  IconExternalLink,
  IconInfoCircle,
  IconLoader2,
  IconSearch,
  IconX,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import { supabaseClient } from "@/lib/supabase/client"
import { useProspectStore } from "@/stores/prospect-store"
import {
  ACTION_TYPE_CONFIG,
  ALL_FILTER_CONFIG,
  STATUS_CONFIG,
  STATUS_FILTERS,
  TYPE_CONFIG,
  formatDate,
  type ProspectActionType,
  type ProspectStatus,
  type ProspectTier,
} from "./_data"

const STATUS_OPTIONS = STATUS_FILTERS.filter(
  (filter): filter is { value: ProspectStatus; label: string; icon: ElementType } =>
    filter.value !== "all"
)

const DEFAULT_STATUS_FILTER: ProspectStatus = "new"

const TYPE_OPTIONS = Object.entries(TYPE_CONFIG) as [
  ProspectTier,
  (typeof TYPE_CONFIG)[ProspectTier],
][]

const ACTION_OPTIONS = Object.entries(ACTION_TYPE_CONFIG) as [
  ProspectActionType,
  (typeof ACTION_TYPE_CONFIG)[ProspectActionType],
][]

type FilterOption<TValue extends string> = {
  value: TValue
  label: string
  icon: ElementType
  count?: number
}

function FilterDropdown<TValue extends string>({
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
  const activeOption = options.find((option) => option.value === value)
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
            isFiltered &&
              "border-orange/40 bg-orange/10 text-foreground hover:bg-orange/15"
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
          onValueChange={(nextValue) => onValueChange(nextValue as TValue)}
        >
          {options.map((option) => {
            const OptionIcon = option.icon

            return (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <OptionIcon className="size-4 text-muted-foreground" />
                <span>{option.label}</span>
                {typeof option.count === "number" && (
                  <span className="ml-auto tabular-nums text-muted-foreground">
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

function TypeBadge({ type }: { type: ProspectTier }) {
  const cfg = TYPE_CONFIG[type]
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

function ActionBadge({ actionType }: { actionType: ProspectActionType }) {
  const cfg = ACTION_TYPE_CONFIG[actionType]
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

function StatusBadge({ status }: { status: ProspectStatus }) {
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

function ColumnHeader({
  label,
  description,
}: {
  label: string
  description: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span>{label}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`About ${label}`}
            className="rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            onClick={(event) => event.stopPropagation()}
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

function getTargetLabel(targetUrl: string) {
  try {
    const url = new URL(targetUrl)
    return `${url.hostname.replace(/^www\./, "")}${url.pathname === "/" ? "" : url.pathname}`
  } catch {
    return targetUrl
  }
}

export default function ProspectsPage() {
  const router = useRouter()
  const prospects = useProspectStore((state) => state.prospects)
  const updateProspectStatuses = useProspectStore(
    (state) => state.updateProspectStatuses
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProspectStatus | "all">(
    DEFAULT_STATUS_FILTER
  )
  const [typeFilter, setTypeFilter] = useState<ProspectTier | "all">("all")
  const [actionFilter, setActionFilter] = useState<
    ProspectActionType | "all"
  >("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [isUpdating, setIsUpdating] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(
      STATUS_FILTERS.filter((filter) => filter.value !== "all").map((filter) => [
        filter.value,
        0,
      ])
    ) as Record<ProspectStatus, number>

    prospects.forEach((prospect) => {
      counts[prospect.status] += 1
    })

    return counts
  }, [prospects])

  const typeCounts = useMemo(() => {
    const counts = Object.fromEntries(
      TYPE_OPTIONS.map(([type]) => [type, 0])
    ) as Record<ProspectTier, number>

    prospects.forEach((prospect) => {
      counts[prospect.tier] += 1
    })

    return counts
  }, [prospects])

  const actionCounts = useMemo(() => {
    const counts = Object.fromEntries(
      ACTION_OPTIONS.map(([actionType]) => [actionType, 0])
    ) as Record<ProspectActionType, number>

    prospects.forEach((prospect) => {
      counts[prospect.action_type] += 1
    })

    return counts
  }, [prospects])

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return prospects.filter((prospect) => {
      if (statusFilter !== "all" && prospect.status !== statusFilter) {
        return false
      }

      if (typeFilter !== "all" && prospect.tier !== typeFilter) {
        return false
      }

      if (actionFilter !== "all" && prospect.action_type !== actionFilter) {
        return false
      }

      if (!query) return true

      return (
        prospect.domain.toLowerCase().includes(query) ||
        getTargetLabel(prospect.target_url).toLowerCase().includes(query)
      )
    })
  }, [actionFilter, prospects, searchQuery, statusFilter, typeFilter])

  const filteredIds = useMemo(
    () => filtered.map((prospect) => prospect.id),
    [filtered]
  )
  const selectedVisibleCount = useMemo(
    () => filteredIds.filter((id) => selectedIds.has(id)).length,
    [filteredIds, selectedIds]
  )
  const allVisibleSelected =
    filteredIds.length > 0 && selectedVisibleCount === filteredIds.length
  const someVisibleSelected =
    selectedVisibleCount > 0 && selectedVisibleCount < filteredIds.length
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== DEFAULT_STATUS_FILTER ||
    typeFilter !== "all" ||
    actionFilter !== "all"

  function toggleProspectSelection(prospectId: string) {
    setBulkError(null)
    setSelectedIds((current) => {
      const next = new Set(current)

      if (next.has(prospectId)) {
        next.delete(prospectId)
      } else {
        next.add(prospectId)
      }

      return next
    })
  }

  function toggleVisibleSelection() {
    setBulkError(null)
    setSelectedIds((current) => {
      const next = new Set(current)

      if (allVisibleSelected) {
        filteredIds.forEach((id) => next.delete(id))
      } else {
        filteredIds.forEach((id) => next.add(id))
      }

      return next
    })
  }

  function clearFilters() {
    setSearchQuery("")
    setStatusFilter(DEFAULT_STATUS_FILTER)
    setTypeFilter("all")
    setActionFilter("all")
  }

  async function updateSelectedStatus(status: ProspectStatus) {
    if (selectedIds.size === 0 || isUpdating) return

    const ids = Array.from(selectedIds)
    const supabase = supabaseClient()

    setIsUpdating(true)
    setBulkError(null)

    try {
      const { data, error } = await supabase
        .from("backlink_prospects")
        .update({ status })
        .in("id", ids)
        .select("id")

      if (error) {
        setBulkError(error.message)
        return
      }

      const updatedIds = (data ?? []).map((prospect) => prospect.id)

      if (updatedIds.length === 0) {
        setBulkError("No prospects were updated. Please refresh and try again.")
        return
      }

      updateProspectStatuses(updatedIds, status)
      setSelectedIds((current) => {
        const next = new Set(current)
        updatedIds.forEach((id) => next.delete(id))
        return next
      })

      if (updatedIds.length !== ids.length) {
        setBulkError(
          `Updated ${updatedIds.length} of ${ids.length} selected prospects.`
        )
      }

      router.refresh()
    } catch (error) {
      setBulkError(
        error instanceof Error
          ? error.message
          : "Could not update selected prospects."
      )
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-border/70 pb-5">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-3 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            <span>Backlink prospects</span>
            <span className="h-px w-8 bg-orange" />
            <span className="tabular-nums">{filtered.length} shown</span>
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
            Opportunity queue
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Prioritized sites and submission paths where there is a realistic
            next action toward a backlink.
          </p>
        </div>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="border-b border-border/60 bg-gradient-to-r from-orange/8 via-card to-card px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative min-w-0 flex-1 xl:max-w-sm">
              <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Filter domain or target URL"
                className="bg-background/80 pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FilterDropdown
                label="Status"
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={STATUS_FILTERS.map((filter) => ({
                  value: filter.value,
                  label: filter.label,
                  icon: filter.icon,
                  count:
                    filter.value === "all"
                      ? prospects.length
                      : statusCounts[filter.value],
                }))}
              />
              <FilterDropdown
                label="Type"
                value={typeFilter}
                onValueChange={setTypeFilter}
                options={[
                  {
                    value: "all",
                    label: ALL_FILTER_CONFIG.label,
                    icon: ALL_FILTER_CONFIG.icon,
                    count: prospects.length,
                  },
                  ...TYPE_OPTIONS.map(([type, config]) => ({
                    value: type,
                    label: config.label,
                    icon: config.icon,
                    count: typeCounts[type],
                  })),
                ]}
              />
              <FilterDropdown
                label="Action"
                value={actionFilter}
                onValueChange={setActionFilter}
                options={[
                  {
                    value: "all",
                    label: ALL_FILTER_CONFIG.label,
                    icon: ALL_FILTER_CONFIG.icon,
                    count: prospects.length,
                  },
                  ...ACTION_OPTIONS.map(([actionType, config]) => ({
                    value: actionType,
                    label: config.label,
                    icon: config.icon,
                    count: actionCounts[actionType],
                  })),
                ]}
              />
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground"
                >
                  <IconX className="size-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="animate-in fade-in-0 slide-in-from-top-2 flex flex-col gap-3 border-b border-border/60 bg-card px-4 py-3 duration-200 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="text-sm">
              <span className="font-semibold tabular-nums">
                {selectedIds.size}
              </span>{" "}
              selected for bulk update
              {bulkError && (
                <p className="mt-1 text-xs text-destructive">{bulkError}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedIds(new Set())
                  setBulkError(null)
                }}
                disabled={isUpdating}
              >
                Clear selection
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="sm" disabled={isUpdating}>
                    {isUpdating ? (
                      <IconLoader2 className="size-4 animate-spin" />
                    ) : null}
                    Update status
                    <IconChevronDown className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-56">
                  <DropdownMenuLabel>Move selected to</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {STATUS_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onSelect={() => void updateSelectedStatus(option.value)}
                    >
                      <StatusBadge status={option.value} />
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <TooltipProvider>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="w-12 px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    <Checkbox
                      aria-label="Select all visible prospects"
                      checked={
                        allVisibleSelected
                          ? true
                          : someVisibleSelected
                            ? "indeterminate"
                            : false
                      }
                      disabled={filteredIds.length === 0}
                      onCheckedChange={toggleVisibleSelection}
                      className="cursor-pointer disabled:cursor-not-allowed"
                    />
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">
                    <ColumnHeader
                      label="Domain"
                      description="The site where this backlink opportunity was found."
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    <ColumnHeader
                      label="Type"
                      description="The prospect source or opportunity class."
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    <ColumnHeader
                      label="Action"
                      description="The recommended next step for this prospect."
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    <ColumnHeader
                      label="Target"
                      description="The page to review, submit through, or use for outreach context."
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    <ColumnHeader
                      label="Discovered"
                      description="When Mentiohunt added this prospect to your queue."
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    <ColumnHeader
                      label="Status"
                      description="Where this prospect sits in your outreach workflow."
                    />
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      {prospects.length === 0
                        ? "No backlink prospects yet. Add discovery inputs so Mentiohunt can build your queue."
                        : "No prospects match these filters yet."}
                    </td>
                  </tr>
                )}
                {filtered.map((prospect) => (
                  <tr
                    key={prospect.id}
                    onClick={() =>
                      router.push(
                        `/dashboard/link-building/prospects/${prospect.id}`
                      )
                    }
                    className={cn(
                      "cursor-pointer border-b border-border/40 transition-colors last:border-0 hover:bg-muted/40",
                      selectedIds.has(prospect.id) && "bg-orange/8 hover:bg-orange/12"
                    )}
                  >
                    <td className="px-4 py-3.5">
                      <Checkbox
                        aria-label={`Select ${prospect.domain}`}
                        checked={selectedIds.has(prospect.id)}
                        onClick={(event) => event.stopPropagation()}
                        onCheckedChange={() => toggleProspectSelection(prospect.id)}
                        className="cursor-pointer disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-2 py-3.5">
                      <span className="font-medium">{prospect.domain}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <TypeBadge type={prospect.tier} />
                    </td>
                    <td className="px-4 py-3.5">
                      <ActionBadge actionType={prospect.action_type} />
                    </td>
                    <td className="max-w-[280px] px-4 py-3.5">
                      <a
                        href={prospect.target_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <IconExternalLink className="size-3.5 shrink-0" />
                        <span className="truncate">
                          {getTargetLabel(prospect.target_url)}
                        </span>
                      </a>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap tabular-nums">
                      {formatDate(prospect.discovered_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={prospect.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <IconChevronRight className="size-4 text-muted-foreground" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TooltipProvider>
        </div>
      </Card>
    </div>
  )
}
