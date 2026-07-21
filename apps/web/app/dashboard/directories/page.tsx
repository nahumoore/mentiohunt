"use client"

import {
  IconExternalLink,
  IconSearch,
  IconX,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import { useMemo, useState } from "react"

import { ColumnHeader, type SortDirection } from "@/components/link-building/directories/column-header"
import { DirectoriesPageSkeleton } from "@/components/link-building/directories/directories-page-skeleton"
import { DomainRatingCell } from "@/components/link-building/directories/domain-rating-cell"
import { PaidBadge } from "@/components/link-building/directories/paid-badge"
import { useDirectoryStore } from "@/stores/directory-store"

type SortKey = "domain" | "domain_rating" | "backlinks"

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

export default function DirectoriesPage() {
  const hydrated = useDirectoryStore((s) => s.hydrated)
  const directories = useDirectoryStore((s) => s.directories)

  const [searchQuery, setSearchQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("domain_rating")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return directories
    return directories.filter((d) => d.domain.toLowerCase().includes(query))
  }, [directories, searchQuery])

  const sorted = useMemo(() => {
    const next = [...filtered]
    next.sort((a, b) => {
      switch (sortKey) {
        case "domain":
          return compareText(a.domain, b.domain, sortDirection)
        case "domain_rating":
          return compareNumber(a.domain_rating, b.domain_rating, sortDirection)
        case "backlinks":
          return compareNumber(a.backlinks, b.backlinks, sortDirection)
      }
    })
    return next
  }, [filtered, sortKey, sortDirection])

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(nextKey)
    setSortDirection(nextKey === "domain" ? "asc" : "desc")
  }

  const hasActiveFilters = searchQuery.trim() !== ""

  return (
    <div className="flex flex-col gap-6">
      {!hydrated ? (
        <DirectoriesPageSkeleton />
      ) : directories.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              No directories available yet. Check back shortly.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="gap-0 overflow-hidden rounded-xl py-0">
          <div className="border-b border-border/60 bg-linear-to-r from-orange/8 via-card to-card px-4 py-3 sm:px-6">
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
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="text-muted-foreground"
                >
                  <IconX className="size-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Mobile: stacked cards — the wide multi-column table doesn't fit
              phone screens, so each directory renders as a card instead. */}
          <div className="flex flex-col gap-3 p-4 sm:p-6 md:hidden">
            {sorted.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                No directories match your search.
              </p>
            ) : (
              sorted.map((directory) => (
                <div
                  key={directory.id}
                  className="rounded-xl border border-border/60 bg-card px-4 py-3.5 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${directory.domain}&sz=32`}
                      alt=""
                      width={18}
                      height={18}
                      className="shrink-0 rounded-sm"
                    />
                    <span className="truncate font-medium">{directory.domain}</span>
                    <a
                      href={`https://${directory.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-muted-foreground/50 transition-colors hover:text-foreground"
                      aria-label={`Visit ${directory.domain}`}
                    >
                      <IconExternalLink className="size-3" />
                    </a>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      DR <DomainRatingCell value={directory.domain_rating} />
                    </span>
                    <span className="flex items-center gap-1">
                      Backlinks{" "}
                      <span className="font-medium tabular-nums text-foreground">
                        {directory.backlinks != null
                          ? Intl.NumberFormat("en", {
                              notation: "compact",
                              maximumFractionDigits: 1,
                            }).format(directory.backlinks)
                          : "—"}
                      </span>
                    </span>
                    <PaidBadge isFree={directory.is_free} />
                  </div>

                  {directory.submit_url && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-3 h-8 w-full gap-1.5 text-xs"
                    >
                      <a
                        href={directory.submit_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Submit
                        <IconExternalLink className="size-3" />
                      </a>
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>

          <TooltipProvider>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
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
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground" />
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      No directories match your search.
                    </td>
                  </tr>
                )}
                {sorted.map((directory) => (
                  <tr
                    key={directory.id}
                    className={cn(
                      "border-b border-border/40 last:border-0",
                    )}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${directory.domain}&sz=32`}
                          alt=""
                          width={18}
                          height={18}
                          className="shrink-0 rounded-sm"
                        />
                        <span className="font-medium">{directory.domain}</span>
                        <a
                          href={`https://${directory.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground/50 transition-colors hover:text-foreground"
                          aria-label={`Visit ${directory.domain}`}
                        >
                          <IconExternalLink className="size-3" />
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <DomainRatingCell value={directory.domain_rating} />
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-muted-foreground">
                      {directory.backlinks != null
                        ? Intl.NumberFormat("en", {
                            notation: "compact",
                            maximumFractionDigits: 1,
                          }).format(directory.backlinks)
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <PaidBadge isFree={directory.is_free} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {directory.submit_url ? (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                        >
                          <a
                            href={directory.submit_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Submit
                            <IconExternalLink className="size-3" />
                          </a>
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </TooltipProvider>
        </Card>
      )}
    </div>
  )
}
