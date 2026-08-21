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
  IconLoader2,
  IconPlus,
  IconSearch,
  IconTrash,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import { useEffect, useMemo, useState, type KeyboardEvent } from "react"

import { PriorityReorderList } from "@/components/ui/priority-reorder-list"
import { MAX_TRACKED_PAGES } from "@/consts/billing"
import { PAGE_TYPE_CONFIG, type PageType } from "@/consts/page-types"
import { useQueryState } from "@/hooks/use-query-state"
import { usePagesStore } from "@/stores/pages-store"
import { useProductStore } from "@/stores/product-store"
import { useProspectStore } from "@/stores/prospect-store"


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

const PAGE_SIZE = 20

function toPageType(t: string): PageType {
  if (t in PAGE_TYPE_CONFIG) return t as PageType
  return "article"
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

function DeletePageButton({
  page,
  onDeleted,
}: {
  page: ProductPage
  onDeleted: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const displayUrl = getDisplayUrl(page.url)

  async function handleDelete() {
    setDeleting(true)
    setError(null)

    try {
      const res = await fetch("/api/pages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: page.id }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Failed to delete page.")
        return
      }

      onDeleted(page.id)
      setOpen(false)
    } catch {
      setError("Failed to delete page.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="shrink-0 text-muted-foreground/40 transition-colors hover:text-destructive"
          aria-label="Delete page"
        >
          <IconTrash className="size-4.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-xl">
        <DialogTitle>Delete page</DialogTitle>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Stop tracking{" "}
          <span className="font-medium text-foreground">{displayUrl}</span>?
          {page.opportunities_count > 0 && (
            <>
              {" "}
              This page has {page.opportunities_count} backlink
              {page.opportunities_count === 1 ? " opportunity" : " opportunities"} linked to
              it — those will stay, just without a page reference.
            </>
          )}
        </p>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="sm" className="rounded-full" disabled={deleting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            size="sm"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="rounded-full bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting ? <IconLoader2 className="size-3.5 animate-spin" /> : null}
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PageRow({
  page,
  onDeleted,
}: {
  page: ProductPage
  onDeleted: (id: string) => void
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
              <p className="truncate text-sm font-medium text-foreground">
                {page.title || displayUrl}
              </p>
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
              <span className="truncate text-xs text-muted-foreground">
                {displayUrl}
              </span>
            )}
            {page.description && (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                {page.description}
              </p>
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

      {/* Keywords col */}
      <td className="px-3 py-4 align-top">
        {page.matched_keywords.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {page.matched_keywords.slice(0, 4).map((kw) => (
              <span
                key={kw}
                className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] text-muted-foreground"
              >
                {kw}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </td>

      {/* Opportunities col */}
      <td className="px-3 py-4 align-top">
        <div className="flex items-center gap-1.5">
          <IconLink className="size-4 text-muted-foreground/50" />
          <span className="text-sm font-medium text-foreground tabular-nums">
            {page.opportunities_count}
          </span>
        </div>
      </td>

      {/* Actions col */}
      <td className="py-4 pr-6 pl-3 align-top">
        <div className="flex justify-center">
          <DeletePageButton page={page} onDeleted={onDeleted} />
        </div>
      </td>
    </tr>
  )
}

function AddPageBar({
  onAdd,
  disabled,
  disabledReason,
}: {
  onAdd: (page: ProductPage) => void
  disabled?: boolean
  disabledReason?: string
}) {
  const [url, setUrl] = useState("")
  const [pageType, setPageType] = useState<PageType>("landing_page")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    const trimmed = url.trim()
    if (!trimmed || submitting || disabled) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, page_type: pageType }),
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
        priority: (data.priority as PagePriority) ?? 5,
        matched_keywords: [],
        is_manual: true,
        opportunities_count: 0,
      })

      setUrl("")
      setPageType("landing_page")
    } catch {
      setError("Failed to add page.")
    } finally {
      setSubmitting(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return
    event.preventDefault()
    void handleSubmit()
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/50 disabled:opacity-50"
            >
              {(() => {
                const TypeIcon = PAGE_TYPE_CONFIG[pageType].icon
                return <TypeIcon className="size-3.5" />
              })()}
              <span className="hidden sm:inline">{PAGE_TYPE_CONFIG[pageType].label}</span>
              <IconChevronDown className="size-3.5" />
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
        <Input
          placeholder="https://yoursite.com/your-page"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled || submitting}
          className="h-10 flex-1 rounded-lg"
        />
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!url.trim() || submitting || disabled}
          className="h-10 shrink-0 rounded-lg bg-(--color-blaze-orange) text-white hover:bg-(--color-crimson-carrot) disabled:opacity-40"
        >
          {submitting ? (
            <IconLoader2 className="size-4 animate-spin" />
          ) : (
            <IconPlus className="size-4" />
          )}
          Add page
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {disabled && disabledReason && !error && (
        <p className="text-xs text-muted-foreground">{disabledReason}</p>
      )}
    </div>
  )
}

function PageReorderRow({
  page,
  onDeleted,
}: {
  page: ProductPage
  onDeleted: (id: string) => void
}) {
  const favicon = getFaviconUrl(page.url)
  const displayUrl = getDisplayUrl(page.url)
  const typeCfg = PAGE_TYPE_CONFIG[page.page_type]
  const TypeIcon = typeCfg.icon

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="shrink-0">
        {favicon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={favicon} alt="" width={14} height={14} className="size-3.5 rounded-sm" />
        ) : (
          <div className="size-3.5 rounded-sm bg-muted" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="truncate text-sm font-medium text-foreground">
            {page.title || displayUrl}
          </p>
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
        {page.title && (
          <span className="truncate text-xs text-muted-foreground">{displayUrl}</span>
        )}
      </div>
      <div className="hidden shrink-0 items-center gap-1.5 text-muted-foreground sm:flex">
        <TypeIcon className="size-3.5 shrink-0" />
        <span className="truncate text-xs">{typeCfg.label}</span>
      </div>
      {page.matched_keywords.length > 0 && (
        <div className="hidden shrink-0 flex-wrap gap-1 md:flex">
          {page.matched_keywords.slice(0, 2).map((kw) => (
            <span
              key={kw}
              className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] text-muted-foreground"
            >
              {kw}
            </span>
          ))}
        </div>
      )}
      <div className="flex shrink-0 items-center gap-1.5">
        <IconLink className="size-4 text-muted-foreground/50" />
        <span className="text-sm font-medium text-foreground tabular-nums">
          {page.opportunities_count}
        </span>
      </div>
      <DeletePageButton page={page} onDeleted={onDeleted} />
    </div>
  )
}

export function PagesTab({ onGoToKeywords }: { onGoToKeywords: () => void }) {
  const storePages = usePagesStore((s) => s.pages)
  const reorderPages = usePagesStore((s) => s.reorderPages)
  const addPage = usePagesStore((s) => s.addPage)
  const removePage = usePagesStore((s) => s.removePage)
  const prospects = useProspectStore((s) => s.prospects)
  const hasCompletedRun = useProspectStore((s) => s.hasCompletedRun)
  const product = useProductStore((s) => s.product)
  const targetKeywords = product?.target_keywords ?? []

  // Memoized so array/object identity is stable across re-renders that don't
  // actually change the underlying data — PriorityReorderList re-syncs its
  // local drag state whenever the `items` prop reference changes, and this
  // is recomputed with a fresh .filter().map().sort() on every render, which
  // would otherwise snap an in-progress drag back on every unrelated store
  // update (e.g. a live prospect count ticking in elsewhere on the page).
  const pages: ProductPage[] = useMemo(
    () =>
      storePages
        .filter((p) => p.is_target)
        .map((p) => {
          const count = prospects.filter((pr) => pr.product_page_id === p.id).length
          return {
            id: p.id,
            url: p.url,
            title: p.title,
            description: p.description,
            page_type: toPageType(p.page_type),
            priority: (p.priority as unknown as PagePriority) ?? 5,
            matched_keywords: p.matched_keywords ?? [],
            is_manual: p.is_manual,
            opportunities_count: count,
          }
        })
        .sort((a, b) => a.priority - b.priority),
    [storePages, prospects]
  )

  const atPagesLimit = pages.length >= MAX_TRACKED_PAGES
  // Products that predate the 5-page cap can carry many more than
  // MAX_TRACKED_PAGES rows until the manual reprocess pass (see
  // todo/tickets/2026-08-21-reprocess-over-cap-product-pages.md) trims and
  // renumbers them — a 5-slot drag list can't render that, so those
  // products fall back to the old sortable table until then.
  const overCap = pages.length > MAX_TRACKED_PAGES

  const [sortKey, setSortKey] = useQueryState<SortKey>(
    "sort",
    "priority",
    isSortKey
  )
  const [sortDir, setSortDir] = useQueryState<SortDir>("dir", "asc", isSortDir)
  const [search, setSearch] = useQueryState("q", "", isAnyString)
  const [pageParam, setPageParam] = useQueryState(
    "page",
    "1",
    isPositiveIntString
  )
  const currentPage = Number(pageParam)
  const setCurrentPage = (page: number) => setPageParam(String(page))

  const [reorderError, setReorderError] = useState<string | null>(null)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
    setCurrentPage(1)
  }

  async function handleReorderCommit(ordered: ProductPage[]): Promise<string | null> {
    const ids = ordered.map((p) => p.id)
    const prevIds = pages.map((p) => p.id)
    reorderPages(ids)
    setReorderError(null)

    try {
      const res = await fetch("/api/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        reorderPages(prevIds)
        const message = data.error ?? "Failed to reorder pages."
        setReorderError(message)
        return message
      }
      return null
    } catch {
      reorderPages(prevIds)
      const message = "Failed to reorder pages."
      setReorderError(message)
      return message
    }
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

  function handleDeletePage(id: string) {
    removePage(id)
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
      {targetKeywords.length === 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5">
          <IconAlertTriangle className="size-4 shrink-0 text-amber-500" />
          <p className="text-sm text-muted-foreground">
            You haven&apos;t set any target keywords yet, so we don&apos;t know
            which pages to build backlinks to.{" "}
            <button
              type="button"
              onClick={onGoToKeywords}
              className="font-medium text-foreground underline underline-offset-2 hover:text-amber-600"
            >
              Add your target keywords.
            </button>
          </p>
        </div>
      )}

      {overCap && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5">
          <IconAlertTriangle className="size-4 shrink-0 text-amber-500" />
          <p className="text-sm text-muted-foreground">
            You&apos;re tracking {pages.length} pages. The limit is now{" "}
            {MAX_TRACKED_PAGES} — we&apos;ll re-pick your top {MAX_TRACKED_PAGES}{" "}
            shortly, and you&apos;ll be able to drag them into priority order.
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        {overCap && (
          <div className="relative sm:w-64">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              type="search"
              placeholder="Search pages…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-md border-border/60 bg-white pl-8 text-sm shadow-sm"
            />
          </div>
        )}
        <AddPageBar
          onAdd={handleAddPage}
          disabled={atPagesLimit}
          disabledReason={`You're tracking ${pages.length}/${MAX_TRACKED_PAGES} pages, the max for now.`}
        />
      </div>

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
          <div className="w-full max-w-md">
            <AddPageBar
              onAdd={handleAddPage}
              disabled={atPagesLimit}
              disabledReason={`You're tracking ${pages.length}/${MAX_TRACKED_PAGES} pages, the max for now.`}
            />
          </div>
        </div>
      ) : !overCap ? (
        <div className="flex flex-col gap-3">
          {reorderError && <p className="text-xs text-destructive">{reorderError}</p>}
          <PriorityReorderList
            items={pages}
            getKey={(page) => page.id}
            max={MAX_TRACKED_PAGES}
            onReorderCommit={handleReorderCommit}
            placeholderLabel={(priority) => `Add a page to fill priority ${priority}`}
            renderItem={(page) => <PageReorderRow page={page} onDeleted={handleDeletePage} />}
          />
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
                    <div className="flex items-center gap-1.5">
                      <IconLink className="size-4 text-muted-foreground/50" />
                      <span className="text-sm font-medium text-foreground tabular-nums">
                        {page.opportunities_count}
                      </span>
                    </div>
                    <DeletePageButton page={page} onDeleted={handleDeletePage} />
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
                  <col className="w-[37%]" />
                  <col className="w-[9%]" />
                  <col className="w-[25%]" />
                  <col className="w-[21%]" />
                  <col className="w-[8%]" />
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
                      Keywords
                    </th>
                    <th className="py-3 pr-6 pl-3 text-left text-[0.65rem] font-bold tracking-wider text-muted-foreground/60 uppercase">
                      <div className="flex items-center gap-1.5">
                        Found Opportunities
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
                    <th className="py-3 pr-6 pl-3 text-left text-[0.65rem] font-bold tracking-wider text-muted-foreground/60 uppercase">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((page) => (
                    <PageRow key={page.id} page={page} onDeleted={handleDeletePage} />
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
