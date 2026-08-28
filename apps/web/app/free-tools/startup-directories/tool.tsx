"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  IconArrowsSort,
  IconChartBar,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconExternalLink,
  IconFolderSearch,
  IconSearch,
  IconShieldCheck,
  IconSpeakerphone,
  IconWorld,
} from "@tabler/icons-react"
import type { ReactNode } from "react"
import type { Tables } from "@workspace/supabase/database-types"

import { AutomationCta, ToolHero } from "@/components/free-tools"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

type Directory = Tables<"directories">
type SortDirection = "asc" | "desc"
type SortKey =
  | "name"
  | "is_free"
  | "domain_rating"
  | "referring_domains"
  | "backlinks"
  | "dofollow_referring_domains"
  | "seo_metrics_updated_at"

const sortLabels: Record<SortKey, string> = {
  name: "Name",
  is_free: "Free",
  domain_rating: "Domain Rating",
  referring_domains: "Referring Domains",
  backlinks: "Backlinks",
  dofollow_referring_domains: "Dofollow Ref Domains",
  seo_metrics_updated_at: "Metrics Updated",
}

function getDirectoryIconUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
}

function formatNumber(value: number | null) {
  if (value === null) return "-"

  return new Intl.NumberFormat("en", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: value >= 10000 ? 1 : 0,
  }).format(value)
}

function formatDate(value: string | null) {
  if (!value) return "Pending"

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function toTitleCase(value: string | null) {
  if (!value) return "Uncategorized"

  return value
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function compareValues(a: string | number, b: string | number) {
  if (typeof a === "string" && typeof b === "string") {
    return a.localeCompare(b)
  }

  return Number(a) - Number(b)
}

function getSortValue(directory: Directory, sortKey: SortKey): string | number {
  const value = directory[sortKey]

  if (sortKey === "name") return directory.name.toLowerCase()
  if (sortKey === "is_free") return directory.is_free ? 1 : 0
  if (sortKey === "seo_metrics_updated_at") {
    return value ? new Date(String(value)).getTime() : 0
  }

  return typeof value === "number" ? value : -1
}

type PricingFilter = "all" | "free" | "paid"

const PAGE_SIZE = 50

export function StartupDirectoriesBrowser({
  directories,
}: {
  directories: Directory[]
}) {
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [pricingFilter, setPricingFilter] = useState<PricingFilter>("all")
  const [sortKey, setSortKey] = useState<SortKey>("domain_rating")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [page, setPage] = useState(1)

  const categories = Array.from(
    new Set(directories.map((directory) => directory.category).filter(Boolean))
  ).sort((a, b) => a!.localeCompare(b!)) as string[]

  const normalizedQuery = query.trim().toLowerCase()
  const sortedDirectories = directories
    .filter((directory) => {
      if (categoryFilter !== "all" && directory.category !== categoryFilter) {
        return false
      }

      if (pricingFilter === "free" && !directory.is_free) return false
      if (pricingFilter === "paid" && directory.is_free) return false

      if (!normalizedQuery) return true

      return [
        directory.name,
        directory.domain,
        directory.category,
        directory.submit_url,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    })
    .sort((left, right) => {
      const result = compareValues(
        getSortValue(left, sortKey),
        getSortValue(right, sortKey)
      )

      return sortDirection === "asc" ? result : -result
    })

  const pageCount = Math.max(1, Math.ceil(sortedDirectories.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const visibleDirectories = sortedDirectories.slice(
    pageStart,
    pageStart + PAGE_SIZE
  )

  useEffect(() => {
    setPage(1)
  }, [normalizedQuery, categoryFilter, pricingFilter, sortKey, sortDirection])

  function updateSort(nextSortKey: SortKey) {
    if (nextSortKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
      return
    }

    setSortKey(nextSortKey)
    setSortDirection(nextSortKey === "name" ? "asc" : "desc")
  }

  return (
    <>
      <section className="relative overflow-hidden px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-36 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-princeton-orange/5 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <ToolHero
            icon={IconFolderSearch}
            title="Startup Directory"
            highlight="Browser"
            description="Browse startup directories with sortable authority, backlink, pricing, verification, and submission signals. Build a shortlist, then run the gap scan to see which listings your product is missing."
          />
        </div>
      </section>

      <section className="relative overflow-hidden bg-background px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8 lg:pb-32">
        <div className="container relative mx-auto max-w-7xl">
          <div className="mb-5 flex flex-col gap-4 rounded-[1.5rem] border border-border bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                <IconArrowsSort size={20} stroke={2.4} />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold tracking-[-0.035em]">
                  {sortedDirectories.length} directories match
                </p>
                <p className="text-sm text-muted-foreground">
                  Sorted by {sortLabels[sortKey].toLowerCase()} {sortDirection}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterSelect
                value={categoryFilter}
                onChange={setCategoryFilter}
                aria-label="Filter by category"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {toTitleCase(category)}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                value={pricingFilter}
                onChange={(value) => setPricingFilter(value as PricingFilter)}
                aria-label="Filter by pricing"
              >
                <option value="all">All pricing</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </FilterSelect>
              <div className="relative w-full sm:w-[22rem]">
                <IconSearch
                  size={18}
                  stroke={2.3}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search directories..."
                  className="h-11 rounded-full border-border bg-card pl-11 pr-5 text-sm shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_28px_90px_-58px_rgba(255,96,0,0.65)]">
            <div className="overflow-x-auto">
              <table className="min-w-[1120px] w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/45 text-xs text-muted-foreground">
                  <tr>
                    <SortableHeader
                      label="Directory"
                      sortKey="name"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={updateSort}
                    />
                    <th className="px-4 py-3 font-medium">Category</th>
                    <SortableHeader
                      label="Pricing"
                      sortKey="is_free"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={updateSort}
                    />
                    <SortableHeader
                      label="DR"
                      sortKey="domain_rating"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={updateSort}
                    />
                    <SortableHeader
                      label="Ref domains"
                      sortKey="referring_domains"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={updateSort}
                    />
                    <SortableHeader
                      label="Backlinks"
                      sortKey="backlinks"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={updateSort}
                    />
                    <SortableHeader
                      label="Dofollow refs"
                      sortKey="dofollow_referring_domains"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={updateSort}
                    />
                    <SortableHeader
                      label="Updated"
                      sortKey="seo_metrics_updated_at"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={updateSort}
                    />
                  </tr>
                </thead>
                <tbody>
                  {sortedDirectories.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-sm text-muted-foreground"
                      >
                        No directories match that search yet.
                      </td>
                    </tr>
                  ) : (
                    visibleDirectories.map((directory) => (
                      <tr
                        key={directory.id}
                        className="border-b border-border/45 transition-colors last:border-0 hover:bg-[var(--color-blaze-orange)]/5"
                      >
                        <td className="px-4 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
                              <span
                                aria-hidden="true"
                                className="size-6 rounded-md bg-contain bg-center bg-no-repeat"
                                style={{
                                  backgroundImage: `url(${getDirectoryIconUrl(directory.domain)})`,
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-heading text-base font-semibold tracking-[-0.025em] text-foreground">
                                {directory.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                <span>{directory.domain}</span>
                                <a
                                  href={`https://${directory.domain}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`Open ${directory.domain}`}
                                  className="ml-1 inline-flex align-[-2px] text-muted-foreground outline-none transition-colors hover:text-[var(--color-princeton-orange)] focus-visible:ring-3 focus-visible:ring-ring/30"
                                >
                                  <IconExternalLink size={13} stroke={2.4} />
                                </a>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <DirectoryBadge>{toTitleCase(directory.category)}</DirectoryBadge>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={
                              directory.is_free
                                ? "rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                                : "rounded-full border border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-xs font-semibold text-[var(--color-princeton-orange)]"
                            }
                          >
                            {directory.is_free ? "Free" : "Paid"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <MetricCell
                            icon={IconChartBar}
                            value={directory.domain_rating ?? null}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <MetricCell
                            icon={IconWorld}
                            value={directory.referring_domains}
                          />
                        </td>
                        <td className="px-4 py-4 tabular-nums">
                          {formatNumber(directory.backlinks)}
                        </td>
                        <td className="px-4 py-4">
                          <MetricCell
                            icon={IconShieldCheck}
                            value={directory.dofollow_referring_domains}
                          />
                        </td>
                        <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                          {formatDate(directory.seo_metrics_updated_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {sortedDirectories.length > 0 && (
            <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-[1.5rem] border border-border bg-card/70 px-4 py-3 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Showing {pageStart + 1}&ndash;
                {pageStart + visibleDirectories.length} of{" "}
                {sortedDirectories.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full px-4 text-sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  <IconChevronLeft size={15} stroke={2.4} />
                  Previous
                </Button>
                <span className="px-1 text-sm text-muted-foreground tabular-nums">
                  Page {currentPage} of {pageCount}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full px-4 text-sm"
                  disabled={currentPage >= pageCount}
                  onClick={() =>
                    setPage((value) => Math.min(pageCount, value + 1))
                  }
                >
                  Next
                  <IconChevronRight size={15} stroke={2.4} />
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/20 bg-card p-6 shadow-[0_22px_80px_-58px_rgba(255,96,0,0.65)] sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                  <IconSpeakerphone size={22} stroke={2.4} />
                </div>
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                    Directory owners
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.045em] text-balance">
                    Want your directory considered for this list?
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                    Submit the directory details so we can review the fit,
                    submission URL, and backlink signals before adding it to the
                    public browser.
                  </p>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-11 rounded-full border-[var(--color-blaze-orange)]/25 bg-background/70 px-7 text-sm hover:bg-[var(--color-blaze-orange)]/8"
              >
                <Link href="/directory-submission">
                  Submit a directory
                  <IconExternalLink size={16} stroke={2.4} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>


      <section className="relative overflow-hidden bg-background px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-10 top-10 h-80 w-80 rounded-full bg-princeton-orange/7 blur-[100px]" />
        </div>
        <div className="container relative mx-auto max-w-6xl">
          <AutomationCta
            eyebrow="From table to queue"
            heading="Want to know which directories you are missing?"
            body="Browsing gives you a shortlist. The gap scanner compares your product URL against known directory opportunities and turns the next steps into a focused application queue."
          />
        </div>
      </section>
    </>
  )
}

function SortableHeader({
  label,
  sortKey,
  activeSortKey,
  direction,
  onSort,
}: {
  label: string
  sortKey: SortKey
  activeSortKey: SortKey
  direction: SortDirection
  onSort: (sortKey: SortKey) => void
}) {
  const active = sortKey === activeSortKey

  return (
    <th className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1.5 rounded-full outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        {label}
        {active && direction === "asc" ? (
          <IconChevronUp size={13} stroke={2.4} />
        ) : active ? (
          <IconChevronDown size={13} stroke={2.4} />
        ) : (
          <IconArrowsSort size={13} stroke={2.4} />
        )}
      </button>
    </th>
  )
}

function FilterSelect({
  value,
  onChange,
  children,
  "aria-label": ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  children: ReactNode
  "aria-label": string
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        className="h-11 w-full appearance-none rounded-full border border-border bg-card py-0 pl-4 pr-9 text-sm text-foreground shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30 sm:w-auto"
      >
        {children}
      </select>
      <IconChevronDown
        size={14}
        stroke={2.4}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60"
      />
    </div>
  )
}

function DirectoryBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground whitespace-nowrap">
      {children}
    </span>
  )
}

function MetricCell({
  icon: Icon,
  value,
}: {
  icon: typeof IconChartBar
  value: number | null
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm tabular-nums text-foreground">
      <Icon size={15} stroke={2.35} className="text-[var(--color-princeton-orange)]" />
      {formatNumber(value)}
    </span>
  )
}
