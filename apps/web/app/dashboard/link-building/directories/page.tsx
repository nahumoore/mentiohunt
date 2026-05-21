"use client"

import {
  IconChevronDown,
  IconChevronRight,
  IconCoins,
  IconInfoCircle,
  IconLayoutGrid,
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
import { useRouter } from "next/navigation"
import type { ElementType } from "react"
import { useEffect, useMemo, useState } from "react"

import { getDomainRatingColorScheme } from "@/components/backlink-opportunities/utils"
import { captureEvent } from "@/lib/analytics"
import { supabaseClient } from "@/lib/supabase/client"
import { useDirectorySubmissionStore } from "@/stores/directory-submission-store"
import {
  ALL_FILTER_CONFIG,
  STATUS_ACTIONS,
  STATUS_CONFIG,
  STATUS_FILTERS,
  formatDate,
  daysSince,
  type DirectorySubmissionStatus,
} from "./_data"

type SortKey =
  | "domain"
  | "domain_rating"
  | "backlinks"
  | "discovered_at"
  | "submitted_at"
  | "last_indexed_at"
  | "status"

type SortDirection = "asc" | "desc"

const DEFAULT_STATUS_FILTER: DirectorySubmissionStatus = "not_submitted"

const STATUS_OPTIONS = STATUS_FILTERS.filter(
  (f): f is { value: DirectorySubmissionStatus; label: string; icon: ElementType } =>
    f.value !== "all"
)

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

function StatusBadge({ status }: { status: DirectorySubmissionStatus }) {
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

function DomainRatingCell({ value }: { value: number | null | undefined }) {
  const scheme = getDomainRatingColorScheme(value ?? null)
  return (
    <span
      className={cn(
        "text-sm font-semibold tabular-nums",
        value == null ? "text-muted-foreground" : ""
      )}
      style={value == null ? undefined : { color: scheme.accent }}
    >
      {value ?? "—"}
    </span>
  )
}

function PaidBadge({ isFree }: { isFree: boolean | null | undefined }) {
  if (isFree == null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        <IconCoins className="size-3" />
        Unknown
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        isFree
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-red-500/10 text-red-600"
      )}
    >
      <IconCoins className="size-3" />
      {isFree ? "Free" : "Paid"}
    </span>
  )
}

function compareText(a: string, b: string, dir: SortDirection) {
  return dir === "asc" ? a.localeCompare(b) : b.localeCompare(a)
}

function compareNumber(
  a: number | null | undefined,
  b: number | null | undefined,
  dir: SortDirection
) {
  const l = a ?? -1
  const r = b ?? -1
  return dir === "asc" ? l - r : r - l
}

function compareDate(
  a: string | null | undefined,
  b: string | null | undefined,
  dir: SortDirection
) {
  const l = a ? new Date(a).getTime() : 0
  const r = b ? new Date(b).getTime() : 0
  return dir === "asc" ? l - r : r - l
}

export default function DirectoriesPage() {
  const router = useRouter()
  const submissions = useDirectorySubmissionStore((s) => s.submissions)
  const updateSubmissionStatuses = useDirectorySubmissionStore(
    (s) => s.updateSubmissionStatuses
  )

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<DirectorySubmissionStatus | "all">(
    DEFAULT_STATUS_FILTER
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [isUpdating, setIsUpdating] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("discovered_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  useEffect(() => {
    if (submissions.length > 0) {
      captureEvent("directories_page_viewed", {
        total_count: submissions.length,
        not_submitted_count: submissions.filter((s) => s.status === "not_submitted").length,
        submitted_count: submissions.filter((s) => s.status === "submitted").length,
        indexed_count: submissions.filter((s) => s.status === "indexed").length,
        not_indexed_count: submissions.filter((s) => s.status === "not_indexed").length,
        dismissed_count: submissions.filter((s) => s.status === "dismissed").length,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissions.length > 0])

  useEffect(() => {
    setSelectedIds(new Set())
    captureEvent("directories_filter_changed", {
      filter_value: statusFilter,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(
      STATUS_OPTIONS.map((f) => [f.value, 0])
    ) as Record<DirectorySubmissionStatus, number>
    submissions.forEach((s) => {
      counts[s.status] += 1
    })
    return counts
  }, [submissions])

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return submissions.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false
      if (!query) return true
      return s.domain.toLowerCase().includes(query)
    })
  }, [submissions, searchQuery, statusFilter])

  useEffect(() => {
    if (!searchQuery.trim()) return
    const timer = setTimeout(() => {
      captureEvent("directories_search_used", {
        query_length: searchQuery.trim().length,
        result_count: filtered.length,
      })
    }, 600)
    return () => clearTimeout(timer)
  }, [searchQuery, filtered.length])

  const sorted = useMemo(() => {
    const next = [...filtered]
    next.sort((a, b) => {
      switch (sortKey) {
        case "domain":
          return compareText(a.domain, b.domain, sortDirection)
        case "domain_rating":
          return compareNumber(a.directory?.domain_rating, b.directory?.domain_rating, sortDirection)
        case "backlinks":
          return compareNumber(a.directory?.backlinks, b.directory?.backlinks, sortDirection)
        case "submitted_at":
          return compareDate(a.submitted_at, b.submitted_at, sortDirection)
        case "last_indexed_at":
          return compareDate(a.last_indexed_at, b.last_indexed_at, sortDirection)
        case "status":
          return compareText(
            STATUS_CONFIG[a.status].label,
            STATUS_CONFIG[b.status].label,
            sortDirection
          )
        case "discovered_at":
          return compareDate(a.discovered_at, b.discovered_at, sortDirection)
      }
    })
    return next
  }, [filtered, sortDirection, sortKey])

  function toggleSort(nextKey: SortKey) {
    const nextDirection =
      sortKey === nextKey
        ? sortDirection === "asc"
          ? "desc"
          : "asc"
        : nextKey === "domain" || nextKey === "status"
          ? "asc"
          : "desc"
    captureEvent("directories_sorted", { sort_key: nextKey, sort_direction: nextDirection })
    if (sortKey === nextKey) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(nextKey)
    setSortDirection(nextDirection)
  }

  const filteredIds = useMemo(() => sorted.map((s) => s.id), [sorted])
  const selectedVisibleCount = useMemo(
    () => filteredIds.filter((id) => selectedIds.has(id)).length,
    [filteredIds, selectedIds]
  )
  const allVisibleSelected =
    filteredIds.length > 0 && selectedVisibleCount === filteredIds.length
  const someVisibleSelected =
    selectedVisibleCount > 0 && selectedVisibleCount < filteredIds.length
  const hasActiveFilters =
    searchQuery.trim() !== "" || statusFilter !== DEFAULT_STATUS_FILTER

  function toggleSelection(id: string) {
    setBulkError(null)
    setSelectedIds((cur) => {
      const next = new Set(cur)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleVisibleSelection() {
    setBulkError(null)
    if (!allVisibleSelected) {
      captureEvent("directories_bulk_selected", {
        count: filteredIds.length,
        status_filter: statusFilter,
      })
    }
    setSelectedIds((cur) => {
      const next = new Set(cur)
      if (allVisibleSelected) {
        filteredIds.forEach((id) => next.delete(id))
      } else {
        filteredIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  async function updateSelectedStatus(status: DirectorySubmissionStatus) {
    if (selectedIds.size === 0 || isUpdating) return

    const ids = Array.from(selectedIds)
    const supabase = supabaseClient()
    const extra: { submitted_at?: string } = {}

    if (status === "submitted") {
      extra.submitted_at = new Date().toISOString()
    }

    setIsUpdating(true)
    setBulkError(null)

    try {
      const { data, error } = await supabase
        .from("directory_submissions")
        .update({ status, ...extra })
        .in("id", ids)
        .select("id")

      if (error) {
        setBulkError(error.message)
        return
      }

      const updatedIds = (data ?? []).map((s) => s.id)

      if (updatedIds.length === 0) {
        captureEvent("directories_bulk_status_updated", {
          new_status: status,
          count: 0,
          success: false,
        })
        setBulkError("No rows updated. Please refresh and try again.")
        return
      }

      captureEvent("directories_bulk_status_updated", {
        new_status: status,
        count: updatedIds.length,
        success: true,
        partial: updatedIds.length !== ids.length,
      })

      updateSubmissionStatuses(updatedIds, status, extra.submitted_at ? { submitted_at: extra.submitted_at } : undefined)
      setSelectedIds((cur) => {
        const next = new Set(cur)
        updatedIds.forEach((id) => next.delete(id))
        return next
      })

      if (updatedIds.length !== ids.length) {
        setBulkError(`Updated ${updatedIds.length} of ${ids.length} selected.`)
      }

      router.refresh()
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Could not update.")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-border/70 pb-5">
        <div className="max-w-2xl">
          <h1 className="flex items-center font-heading text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
            <IconLayoutGrid className="mr-2 size-8" />
            Directories
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Track which directories your product is listed in and whether those
            listings are indexed by Google.
          </p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <IconLoader2 className="size-5 animate-spin text-primary" />
            </span>
            <h2 className="text-base font-semibold text-foreground">
              Scanning directories
            </h2>
            <p className="text-sm text-muted-foreground">
              We&apos;re checking which directories your product is listed in.
              This usually takes a few minutes — check back shortly.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <div className="border-b border-border/60 bg-gradient-to-r from-orange/8 via-card to-card px-4 py-3 sm:px-6">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative min-w-0 flex-1 xl:max-w-sm">
                <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by domain"
                  className="bg-background/80 pl-9"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FilterDropdown
                  label="Status"
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  options={STATUS_FILTERS.map((f) => ({
                    value: f.value,
                    label: f.label,
                    icon: f.icon,
                    count:
                      f.value === "all"
                        ? submissions.length
                        : statusCounts[f.value as DirectorySubmissionStatus],
                  }))}
                />
                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("")
                      setStatusFilter(DEFAULT_STATUS_FILTER)
                    }}
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
            <div className="flex animate-in flex-col gap-3 border-b border-border/60 bg-card px-4 py-3 duration-200 fade-in-0 slide-in-from-top-2 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="text-sm">
                <span className="font-semibold tabular-nums">{selectedIds.size}</span>{" "}
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
                      {isUpdating ? <IconLoader2 className="size-4 animate-spin" /> : null}
                      Update status
                      <IconChevronDown className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-56">
                    <DropdownMenuLabel>Move selected to</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {STATUS_ACTIONS.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onSelect={() => void updateSelectedStatus(status)}
                      >
                        <StatusBadge status={status} />
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
                        aria-label="Select all visible"
                        checked={
                          allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false
                        }
                        disabled={filteredIds.length === 0}
                        onCheckedChange={toggleVisibleSelection}
                        className="cursor-pointer disabled:cursor-not-allowed"
                      />
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">
                      <ColumnHeader
                        label="Domain"
                        description="The directory site."
                        sortable
                        sortDirection={sortKey === "domain" ? sortDirection : null}
                        onSort={() => toggleSort("domain")}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      <ColumnHeader
                        label="DR"
                        description="Domain Rating: authority score 0–100 for this directory."
                        sortable
                        sortDirection={sortKey === "domain_rating" ? sortDirection : null}
                        onSort={() => toggleSort("domain_rating")}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      <ColumnHeader
                        label="Backlinks"
                        description="Total backlink count for this directory domain."
                        sortable
                        sortDirection={sortKey === "backlinks" ? sortDirection : null}
                        onSort={() => toggleSort("backlinks")}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      <ColumnHeader
                        label="Paid"
                        description="Whether this directory requires payment to submit."
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      <ColumnHeader
                        label="Status"
                        description="Where this directory stands in your submission workflow."
                        sortable
                        sortDirection={sortKey === "status" ? sortDirection : null}
                        onSort={() => toggleSort("status")}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      <ColumnHeader
                        label="Submitted"
                        description="When you marked this directory as submitted."
                        sortable
                        sortDirection={sortKey === "submitted_at" ? sortDirection : null}
                        onSort={() => toggleSort("submitted_at")}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      <ColumnHeader
                        label="Indexed"
                        description="When Google last confirmed indexing your listing."
                        sortable
                        sortDirection={sortKey === "last_indexed_at" ? sortDirection : null}
                        onSort={() => toggleSort("last_indexed_at")}
                      />
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-12 text-center text-sm text-muted-foreground"
                      >
                        {submissions.length === 0
                          ? "No directories found yet. Discovery runs automatically after onboarding."
                          : "No directories match these filters."}
                      </td>
                    </tr>
                  )}
                  {sorted.map((submission) => {
                    const days = daysSince(submission.submitted_at)
                    return (
                      <tr
                        key={submission.id}
                        onClick={() => {
                          captureEvent("directories_row_clicked", {
                            submission_id: submission.id,
                            status: submission.status,
                            domain_rating: submission.directory?.domain_rating ?? null,
                            is_free: submission.directory?.is_free ?? null,
                          })
                          router.push(
                            `/dashboard/link-building/directories/${submission.id}`
                          )
                        }}
                        className={cn(
                          "cursor-pointer border-b border-border/40 transition-colors last:border-0 hover:bg-muted/40",
                          selectedIds.has(submission.id) && "bg-orange/8 hover:bg-orange/12"
                        )}
                      >
                        <td className="px-4 py-3.5">
                          <Checkbox
                            aria-label={`Select ${submission.domain}`}
                            checked={selectedIds.has(submission.id)}
                            onClick={(e) => e.stopPropagation()}
                            onCheckedChange={() => toggleSelection(submission.id)}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="px-2 py-3.5">
                          <span className="font-medium">{submission.domain}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <DomainRatingCell value={submission.directory?.domain_rating} />
                        </td>
                        <td className="px-4 py-3.5 tabular-nums text-muted-foreground">
                          {submission.directory?.backlinks != null
                            ? Intl.NumberFormat("en", {
                                notation: "compact",
                                maximumFractionDigits: 1,
                              }).format(submission.directory.backlinks)
                            : "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <PaidBadge isFree={submission.directory?.is_free} />
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={submission.status} />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground tabular-nums">
                          {submission.submitted_at
                            ? `${formatDate(submission.submitted_at)}${days !== null ? ` (${days}d)` : ""}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground tabular-nums">
                          {formatDate(submission.last_indexed_at)}
                        </td>
                        <td className="px-4 py-3.5">
                          <IconChevronRight className="size-4 text-muted-foreground" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </TooltipProvider>
          </div>
        </Card>
      )}
    </div>
  )
}
