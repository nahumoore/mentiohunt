"use client"

import {
  IconAlertTriangle,
  IconArrowDown,
  IconArrowsSort,
  IconArrowUp,
  IconChevronDown,
  IconExternalLink,
  IconFiles,
  IconInfoCircle,
  IconLink,
  IconLinkFilled,
  IconLoader2,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconX,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import { useEffect, useState } from "react"

import Link from "next/link"

import { PAGE_TYPE_CONFIG, type PageType } from "@/consts/page-types"
import { useQueryState } from "@/hooks/use-query-state"
import { usePagesStore } from "@/stores/pages-store"
import { useProductStore } from "@/stores/product-store"
import { useProspectStore, type ProspectListItem } from "@/stores/prospect-store"


type PagePriority = 1 | 2 | 3 | 4 | 5

type ProductPage = {
  id: string
  url: string
  title: string | null
  description: string | null
  page_type: PageType
  priority: PagePriority
  matched_keywords: string[]
  is_manual: boolean
  opportunities_count: number
}

const SITE_WIDE_TIER_LABELS: Partial<Record<ProspectListItem["tier"], string>> = {
  competitor_backlink: "Competitor backlinks",
  unlinked_mention: "Unlinked mentions",
  listicle_roundup: "Listicle roundups",
}

const PAGE_SIZE = 20

function toPageType(t: string): PageType {
  if (t in PAGE_TYPE_CONFIG) return t as PageType
  return "article"
}

function PriorityIcons({
  filled,
  size = "size-4",
}: {
  filled: number
  size?: string
}) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) =>
        i < filled ? (
          <IconLinkFilled key={i} className={size} style={{ color: "var(--color-blaze-orange)" }} />
        ) : (
          <IconLink key={i} className={cn(size, "text-muted-foreground/30")} />
        )
      )}
    </span>
  )
}

type SortKey = "page" | "type" | "priority" | "opportunities"
type SortDir = "asc" | "desc"

function isSortKey(value: string): value is SortKey {
  return (
    value === "page" ||
    value === "type" ||
    value === "priority" ||
    value === "opportunities"
  )
}

function isSortDir(value: string): value is SortDir {
  return value === "asc" || value === "desc"
}

function isAnyString(value: string): value is string {
  return true
}

function isPositiveIntString(value: string): value is string {
  return /^[1-9]\d*$/.test(value)
}

function sortPages(
  pages: ProductPage[],
  key: SortKey,
  dir: SortDir
): ProductPage[] {
  return [...pages].sort((a, b) => {
    let cmp = 0
    if (key === "page") cmp = (a.title ?? a.url).localeCompare(b.title ?? b.url)
    else if (key === "type") cmp = a.page_type.localeCompare(b.page_type)
    else if (key === "priority") cmp = a.priority - b.priority
    else if (key === "opportunities")
      cmp = a.opportunities_count - b.opportunities_count
    return dir === "asc" ? cmp : -cmp
  })
}

function SortButton({
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  sortKey: SortKey
  activeKey: SortKey
  dir: SortDir
  onSort: (k: SortKey) => void
}) {
  const active = sortKey === activeKey
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="flex items-center text-muted-foreground/40 transition-colors hover:text-muted-foreground"
      aria-label={`Sort by ${sortKey}`}
    >
      {!active && <IconArrowsSort className="size-3.5" />}
      {active && dir === "asc" && (
        <IconArrowUp className="size-3.5 text-muted-foreground" />
      )}
      {active && dir === "desc" && (
        <IconArrowDown className="size-3.5 text-muted-foreground" />
      )}
    </button>
  )
}

function getFaviconUrl(url: string) {
  try {
    const { hostname } = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch {
    return null
  }
}

function getDisplayUrl(url: string) {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname === "/" ? "" : parsed.pathname
    return `${parsed.hostname}${path}`
  } catch {
    return url
  }
}

function PriorityInfoPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center text-muted-foreground/50 transition-colors hover:text-muted-foreground"
          aria-label="Priority explained"
        >
          <IconInfoCircle className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="rounded-xl">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">
              How relevance works
            </p>
            <PopoverClose asChild>
              <button
                type="button"
                className="text-muted-foreground/50 transition-colors hover:text-muted-foreground"
              >
                <IconX className="size-3.5" />
              </button>
            </PopoverClose>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Score from 1 to 5 measures how well this page matches your target
            keywords. Pages at 3+ are eligible for resource-page and
            broken-link discovery, and the highest scorer wins when we
            auto-pick which page to pitch.
          </p>
          <div className="space-y-1.5 pt-0.5">
            {(
              [
                [5, "closely matches your target keywords"],
                [3, "partial match"],
                [1, "barely related"],
              ] as const
            ).map(([score, desc]) => (
              <div key={score} className="flex items-center gap-2.5">
                <PriorityIcons filled={score} size="size-3" />
                <span className="text-xs font-medium text-foreground">
                  {score}
                </span>
                <span className="text-xs text-muted-foreground">— {desc}</span>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function PriorityDropdown({
  value,
  onChange,
}: {
  value: PagePriority
  onChange: (p: PagePriority) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 transition-opacity hover:opacity-70"
          aria-label={`Priority: ${value}`}
        >
          <PriorityIcons filled={value} />
          <IconChevronDown className="size-3 text-muted-foreground/50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40 rounded-xl">
        {([5, 4, 3, 2, 1] as const).map((p) => (
          <DropdownMenuItem
            key={p}
            onSelect={() => onChange(p)}
            className={cn("focus:bg-muted focus:text-foreground", value === p && "bg-muted")}
          >
            <PriorityIcons filled={p} size="size-3.5" />
            <span className="font-medium text-foreground">{p}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function PageRow({
  page,
  onPriorityChange,
}: {
  page: ProductPage
  onPriorityChange: (id: string, priority: PagePriority) => void
}) {
  const favicon = getFaviconUrl(page.url)
  const displayUrl = getDisplayUrl(page.url)
  const typeCfg = PAGE_TYPE_CONFIG[page.page_type]
  const TypeIcon = typeCfg.icon

  return (
    <tr className="group border-b border-border/60 transition-colors last:border-0 hover:bg-muted/20">
      {/* Page col */}
      <td className="overflow-hidden py-4 pr-3 pl-6 align-top">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="mt-0.5 shrink-0">
            {favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={favicon}
                alt=""
                width={14}
                height={14}
                className="size-3.5 rounded-sm"
              />
            ) : (
              <div className="size-3.5 rounded-sm bg-muted" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="truncate text-xs text-muted-foreground">
                {displayUrl}
              </span>
              <a
                href={page.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 hover:text-muted-foreground"
                aria-label="Open page"
              >
                <IconExternalLink className="size-3" />
              </a>
            </div>
            {page.title && (
              <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                {page.title}
              </p>
            )}
            {page.description && (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                {page.description}
              </p>
            )}
            {page.matched_keywords.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {page.matched_keywords.slice(0, 4).map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] text-muted-foreground"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Type col */}
      <td className="px-3 py-4 align-top">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <TypeIcon className="size-3.5 shrink-0" />
          <span className="truncate text-xs">{typeCfg.label}</span>
        </div>
      </td>

      {/* Priority col */}
      <td className="px-3 py-4 align-top">
        <PriorityDropdown
          value={page.priority}
          onChange={(p) => onPriorityChange(page.id, p)}
        />
      </td>

      {/* Opportunities col */}
      <td className="py-4 pr-6 pl-3 align-top">
        <div className="flex items-center gap-1.5">
          <IconLink className="size-4 text-muted-foreground/50" />
          <span className="text-sm font-medium text-foreground tabular-nums">
            {page.opportunities_count}
          </span>
        </div>
      </td>
    </tr>
  )
}

function AddPageDialog({ onAdd }: { onAdd: (page: ProductPage) => void }) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [pageType, setPageType] = useState<PageType>("landing_page")
  const [priority, setPriority] = useState<PagePriority>(3)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), page_type: pageType, priority }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Failed to add page.")
        return
      }

      onAdd({
        id: data.id,
        url: data.url,
        title: data.title,
        description: data.description,
        page_type: toPageType(data.page_type),
        priority: (data.priority as PagePriority) ?? priority,
        matched_keywords: [],
        is_manual: true,
        opportunities_count: 0,
      })

      setUrl("")
      setPageType("landing_page")
      setPriority(3)
      setOpen(false)
    } catch {
      setError("Failed to add page.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="rounded-full bg-(--color-blaze-orange) text-white hover:bg-(--color-crimson-carrot)"
        >
          <IconPlus className="size-4" />
          Add page
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-xl">
        <DialogTitle>Add page</DialogTitle>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[0.7rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
              URL
            </label>
            <Input
              placeholder="https://yoursite.com/your-page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
              className="rounded-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[0.7rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                Page type
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors hover:bg-muted/50"
                  >
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      {(() => {
                        const TypeIcon = PAGE_TYPE_CONFIG[pageType].icon
                        return <TypeIcon className="size-3.5" />
                      })()}
                      {PAGE_TYPE_CONFIG[pageType].label}
                    </span>
                    <IconChevronDown className="size-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl">
                  {(Object.keys(PAGE_TYPE_CONFIG) as PageType[]).map((t) => {
                    const TypeIcon = PAGE_TYPE_CONFIG[t].icon
                    return (
                      <DropdownMenuItem
                        key={t}
                        onSelect={() => setPageType(t)}
                        className={cn(pageType === t && "bg-accent")}
                      >
                        <TypeIcon className="size-3.5 text-muted-foreground" />
                        {PAGE_TYPE_CONFIG[t].label}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1.5">
              <label className="text-[0.7rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                Priority
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors hover:bg-muted/50"
                  >
                    <span className="flex items-center gap-1.5">
                      <PriorityIcons filled={priority} size="size-3.5" />
                      <span className="font-medium text-foreground">
                        {priority}
                      </span>
                    </span>
                    <IconChevronDown className="size-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl">
                  {([5, 4, 3, 2, 1] as const).map((p) => (
                    <DropdownMenuItem
                      key={p}
                      onSelect={() => setPriority(p)}
                      className={cn("focus:bg-muted focus:text-foreground", priority === p && "bg-muted")}
                    >
                      <PriorityIcons filled={p} size="size-3.5" />
                      <span className="font-medium text-foreground">{p}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm" className="rounded-full" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              size="sm"
              disabled={!url.trim() || submitting}
              className="rounded-full bg-(--color-blaze-orange) text-white hover:bg-(--color-crimson-carrot) disabled:opacity-40"
            >
              {submitting ? <IconLoader2 className="size-3.5 animate-spin" /> : null}
              Add page
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const TRIAL_BANNER_KEY = "pages-trial-banner-dismissed"

export function PagesClient() {
  const storePages = usePagesStore((s) => s.pages)
  const updatePagePriority = usePagesStore((s) => s.updatePagePriority)
  const addPage = usePagesStore((s) => s.addPage)
  const prospects = useProspectStore((s) => s.prospects)
  const hasCompletedRun = useProspectStore((s) => s.hasCompletedRun)
  const product = useProductStore((s) => s.product)
  const targetKeywords = product?.target_keywords ?? []

  const pages: ProductPage[] = storePages
    .filter((p) => p.is_target)
    .map((p) => {
      const count = prospects.filter((pr) => pr.product_page_id === p.id).length
      return {
        id: p.id,
        url: p.url,
        title: p.title,
        description: p.description,
        page_type: toPageType(p.page_type),
        priority: (p.priority as unknown as PagePriority) ?? 3,
        matched_keywords: p.matched_keywords ?? [],
        is_manual: p.is_manual,
        opportunities_count: count,
      }
    })

  const siteWideProspects = prospects.filter((pr) => !pr.product_page_id)
  const siteWideByTier = new Map<string, number>()
  for (const pr of siteWideProspects) {
    siteWideByTier.set(pr.tier, (siteWideByTier.get(pr.tier) ?? 0) + 1)
  }

  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [sortKey, setSortKey] = useQueryState<SortKey>(
    "sort",
    "priority",
    isSortKey
  )
  const [sortDir, setSortDir] = useQueryState<SortDir>("dir", "desc", isSortDir)
  const [search, setSearch] = useQueryState("q", "", isAnyString)
  const [pageParam, setPageParam] = useQueryState(
    "page",
    "1",
    isPositiveIntString
  )
  const currentPage = Number(pageParam)
  const setCurrentPage = (page: number) => setPageParam(String(page))

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
    setCurrentPage(1)
  }

  useEffect(() => {
    if (localStorage.getItem(TRIAL_BANNER_KEY) === "1") setBannerDismissed(true)
  }, [])

  function dismissBanner() {
    localStorage.setItem(TRIAL_BANNER_KEY, "1")
    setBannerDismissed(true)
  }

  function handlePriorityChange(id: string, priority: PagePriority) {
    const prev = storePages.find((p) => p.id === id)?.priority
    updatePagePriority(id, priority as Parameters<typeof updatePagePriority>[1])

    fetch("/api/pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, priority }),
    }).then((res) => {
      if (!res.ok && prev !== undefined) {
        updatePagePriority(id, prev as Parameters<typeof updatePagePriority>[1])
      }
    }).catch(() => {
      if (prev !== undefined) {
        updatePagePriority(id, prev as Parameters<typeof updatePagePriority>[1])
      }
    })
  }

  function handleAddPage(page: ProductPage) {
    addPage({
      id: page.id,
      url: page.url,
      title: page.title,
      description: page.description,
      page_type: page.page_type,
      priority: page.priority,
      relevance_score: null,
      matched_keywords: page.matched_keywords,
      is_target: true,
      is_manual: page.is_manual,
    })
  }

  const [rescanning, setRescanning] = useState(false)
  const [rescanMessage, setRescanMessage] = useState<string | null>(null)

  async function handleRescan() {
    if (rescanning) return
    setRescanning(true)
    setRescanMessage(null)
    try {
      const res = await fetch("/api/pages/reselect", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setRescanMessage(data.error ?? "Failed to start scan.")
        return
      }
      setRescanMessage("Scanning your site — this can take a few minutes. Refresh to see updates.")
    } catch {
      setRescanMessage("Failed to reach the server.")
    } finally {
      setRescanning(false)
    }
  }

  const sorted = sortPages(pages, sortKey, sortDir)
  const q = search.trim().toLowerCase()
  const filtered = q
    ? sorted.filter(
        (p) =>
          p.url.toLowerCase().includes(q) ||
          (p.title ?? "").toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q)
      )
    : sorted

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  useEffect(() => {
    setPageParam("1")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  return (
    <div className="flex flex-col gap-6">
      {/* Summary banner */}
      {!bannerDismissed && targetKeywords.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-2.5">
          <IconSearch className="size-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Tracking{" "}
            <span className="font-medium text-foreground">
              {pages.length} target page{pages.length === 1 ? "" : "s"}
            </span>{" "}
            matched to{" "}
            <span className="font-medium text-foreground">
              {targetKeywords.length} keyword{targetKeywords.length === 1 ? "" : "s"}
            </span>
            .
          </p>
          <button
            type="button"
            onClick={dismissBanner}
            className="ml-auto shrink-0 text-muted-foreground/50 transition-colors hover:text-muted-foreground"
            aria-label="Dismiss"
          >
            <IconX className="size-3.5" />
          </button>
        </div>
      )}
      {targetKeywords.length === 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5">
          <IconAlertTriangle className="size-4 shrink-0 text-amber-500" />
          <p className="text-sm text-muted-foreground">
            You haven&apos;t set any target keywords yet, so we don&apos;t know
            which pages to build backlinks to.{" "}
            <Link
              href="/dashboard/prospects/settings?tab=keywords"
              className="font-medium text-foreground underline underline-offset-2 hover:text-amber-600"
            >
              Add your target keywords.
            </Link>
          </p>
        </div>
      )}

      {/* Site-wide opportunities */}
      {siteWideProspects.length > 0 && (
        <Card className="rounded-xl border border-border px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Site-wide opportunities — {siteWideProspects.length}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                These pitch your site as a whole, so they aren&apos;t tied to a
                single page.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SITE_WIDE_TIER_LABELS).map(([tier, label]) => {
                const count = siteWideByTier.get(tier) ?? 0
                if (count === 0) return null
                return (
                  <Link
                    key={tier}
                    href={`/dashboard/prospects?tier=${tier}`}
                    className="rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  >
                    {label} — {count}
                  </Link>
                )
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            type="search"
            placeholder="Search pages…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border-border/60 bg-white pl-8 text-sm shadow-sm sm:w-64"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleRescan()}
            disabled={rescanning || targetKeywords.length === 0}
            className="rounded-full"
          >
            {rescanning ? (
              <IconLoader2 className="size-3.5 animate-spin" />
            ) : (
              <IconRefresh className="size-3.5" />
            )}
            Re-scan my site
          </Button>
          <AddPageDialog onAdd={handleAddPage} />
        </div>
      </div>
      {rescanMessage && (
        <p className="text-xs text-muted-foreground">{rescanMessage}</p>
      )}

      {/* States */}
      {pages.length === 0 && !hasCompletedRun ? (
        <Card className="rounded-xl border border-border px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-(--color-blaze-orange)/10">
              <IconLoader2 className="size-5 animate-spin text-(--color-blaze-orange)" />
            </span>
            <h2 className="text-base font-semibold text-foreground">
              Scanning your site for pages
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              We&apos;re fetching your sitemap and picking the pages that best
              match your target keywords. This usually takes a few minutes —
              you&apos;ll receive an email once done!
            </p>
          </div>
        </Card>
      ) : pages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-(--color-blaze-orange)/10">
            <IconFiles className="size-5 text-(--color-blaze-orange)" />
          </span>
          <h2 className="text-base font-semibold text-foreground">
            No pages tracked yet
          </h2>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            We couldn&apos;t find matching pages on your site automatically.
            Add the pages you want to earn backlinks to yourself instead.
          </p>
          <AddPageDialog onAdd={handleAddPage} />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Mobile: stacked cards — the fixed-width table doesn't fit phone
              screens, so each page renders as a card instead of a row. */}
          <div className="flex flex-col gap-3 md:hidden">
            {paginated.map((page) => {
              const favicon = getFaviconUrl(page.url)
              const displayUrl = getDisplayUrl(page.url)
              const typeCfg = PAGE_TYPE_CONFIG[page.page_type]
              const TypeIcon = typeCfg.icon

              return (
                <div
                  key={page.id}
                  className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm"
                >
                  <div className="flex min-w-0 items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {favicon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={favicon}
                          alt=""
                          width={14}
                          height={14}
                          className="size-3.5 rounded-sm"
                        />
                      ) : (
                        <div className="size-3.5 rounded-sm bg-muted" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="truncate text-xs text-muted-foreground">
                        {displayUrl}
                      </span>
                      {page.title && (
                        <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                          {page.title}
                        </p>
                      )}
                      {page.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {page.description}
                        </p>
                      )}
                      {page.matched_keywords.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {page.matched_keywords.slice(0, 3).map((kw) => (
                            <span
                              key={kw}
                              className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] text-muted-foreground"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground"
                      aria-label="Open page"
                    >
                      <IconExternalLink className="size-3" />
                    </a>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <TypeIcon className="size-3.5 shrink-0" />
                      <span className="truncate text-xs">{typeCfg.label}</span>
                    </div>
                    <PriorityDropdown
                      value={page.priority}
                      onChange={(p) => handlePriorityChange(page.id, p)}
                    />
                    <div className="flex items-center gap-1.5">
                      <IconLink className="size-4 text-muted-foreground/50" />
                      <span className="text-sm font-medium text-foreground tabular-nums">
                        {page.opportunities_count}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Table card */}
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm md:block">
            <TooltipProvider>
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[18%]" />
                  <col className="w-[22%]" />
                  <col className="w-[30%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20">
                    <th className="py-3 pr-3 pl-6 text-left text-[0.65rem] font-bold tracking-wider text-muted-foreground/60 uppercase">
                      <div className="flex items-center gap-1.5">
                        Page
                        <SortButton
                          sortKey="page"
                          activeKey={sortKey}
                          dir={sortDir}
                          onSort={handleSort}
                        />
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-[0.65rem] font-bold tracking-wider text-muted-foreground/60 uppercase">
                      <div className="flex items-center gap-1.5">
                        Type
                        <SortButton
                          sortKey="type"
                          activeKey={sortKey}
                          dir={sortDir}
                          onSort={handleSort}
                        />
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-[0.65rem] font-bold tracking-wider text-muted-foreground/60 uppercase">
                      <div className="flex items-center gap-1.5">
                        Relevance
                        <SortButton
                          sortKey="priority"
                          activeKey={sortKey}
                          dir={sortDir}
                          onSort={handleSort}
                        />
                        <PriorityInfoPopover />
                      </div>
                    </th>
                    <th className="py-3 pr-6 pl-3 text-left text-[0.65rem] font-bold tracking-wider text-muted-foreground/60 uppercase">
                      <div className="flex items-center gap-1.5">
                        Opportunities
                        <SortButton
                          sortKey="opportunities"
                          activeKey={sortKey}
                          dir={sortDir}
                          onSort={handleSort}
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="flex items-center text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                            >
                              <IconInfoCircle className="size-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Backlink opportunities found for this page so far.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((page) => (
                    <PageRow
                      key={page.id}
                      page={page}
                      onPriorityChange={handlePriorityChange}
                    />
                  ))}
                </tbody>
              </table>
            </TooltipProvider>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-muted-foreground">
                {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="h-7 rounded-full px-3 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="h-7 rounded-full px-3 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
