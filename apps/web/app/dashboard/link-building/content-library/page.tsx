"use client"

import { useState, useMemo } from "react"
import {
  IconNotes,
  IconPlus,
  IconTrash,
  IconRefresh,
  IconEye,
  IconEyeOff,
  IconSitemap,
} from "@tabler/icons-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"
import {
  MOCK_ARTICLES,
  MOCK_SITEMAPS,
  SOURCE_CONFIG,
  SITEMAP_STATUS_CONFIG,
  formatDate,
  formatWordCount,
  type ArticleSource,
  type ArticleStatus,
  type Article,
  type Sitemap,
} from "./_data"

const SOURCE_FILTERS: { value: ArticleSource | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "manual", label: "Manual" },
  { value: "sitemap", label: "From Sitemap" },
]

function SourceBadge({ source }: { source: ArticleSource }) {
  const cfg = SOURCE_CONFIG[source]
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

function KeywordPills({ keywords }: { keywords: string[] }) {
  const visible = keywords.slice(0, 2)
  const extra = keywords.length - visible.length
  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((kw) => (
        <span
          key={kw}
          className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
        >
          {kw}
        </span>
      ))}
      {extra > 0 && (
        <span className="text-xs text-muted-foreground">+{extra}</span>
      )}
    </div>
  )
}

function OpportunityCount({ count }: { count: number }) {
  if (count === 0) {
    return <span className="text-xs text-muted-foreground">—</span>
  }
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary tabular-nums">
      {count}
    </span>
  )
}

function SitemapRow({
  sitemap,
  onRemove,
}: {
  sitemap: Sitemap
  onRemove: (id: string) => void
}) {
  const cfg = SITEMAP_STATUS_CONFIG[sitemap.status]
  const Icon = cfg.icon
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{sitemap.url}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {sitemap.articlesDiscovered} articles · Last crawled{" "}
          {formatDate(sitemap.lastCrawledAt)}
        </p>
      </div>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
          cfg.color
        )}
      >
        <Icon className="size-3" />
        {cfg.label}
      </span>
      <button
        onClick={() => onRemove(sitemap.id)}
        className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        title="Remove sitemap"
      >
        <IconTrash className="size-3.5" />
      </button>
    </div>
  )
}

function ArticleRow({
  article,
  onToggleStatus,
}: {
  article: Article
  onToggleStatus: (id: string) => void
}) {
  const isDisabled = article.status === "disabled"
  return (
    <tr
      className={cn(
        "border-b border-border/40 transition-colors last:border-0 hover:bg-muted/40",
        isDisabled && "opacity-50"
      )}
    >
      <td className="px-6 py-3.5">
        <div className="min-w-0">
          <p
            className={cn(
              "leading-snug font-medium",
              isDisabled && "line-through decoration-muted-foreground/50"
            )}
          >
            {article.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {article.url}
          </p>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <SourceBadge source={article.source} />
      </td>
      <td className="px-4 py-3.5 text-xs text-muted-foreground tabular-nums">
        {formatWordCount(article.wordCount)}
      </td>
      <td className="max-w-xs px-4 py-3.5">
        <KeywordPills keywords={article.targetKeywords} />
      </td>
      <td className="px-4 py-3.5">
        <OpportunityCount count={article.opportunityCount} />
      </td>
      <td className="px-4 py-3.5 text-xs text-muted-foreground tabular-nums">
        {formatDate(article.addedAt)}
      </td>
      <td className="px-4 py-3.5">
        <button
          onClick={() => onToggleStatus(article.id)}
          title={isDisabled ? "Enable article" : "Disable article"}
          className={cn(
            "rounded-lg p-1.5 transition-colors",
            isDisabled
              ? "text-muted-foreground hover:bg-muted hover:text-foreground"
              : "text-emerald-600 hover:bg-destructive/10 hover:text-destructive"
          )}
        >
          {isDisabled ? (
            <IconEyeOff className="size-4" />
          ) : (
            <IconEye className="size-4" />
          )}
        </button>
      </td>
    </tr>
  )
}

export default function ContentLibraryPage() {
  const [sourceFilter, setSourceFilter] = useState<ArticleSource | "all">("all")
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES)
  const [sitemaps, setSitemaps] = useState<Sitemap[]>(MOCK_SITEMAPS)

  const sourceCounts = useMemo(() => {
    const counts = Object.fromEntries(
      SOURCE_FILTERS.filter((f) => f.value !== "all").map((f) => [f.value, 0])
    ) as Record<ArticleSource, number>

    articles.forEach((article) => {
      counts[article.source] += 1
    })

    return counts
  }, [articles])

  const filtered = useMemo(() => {
    if (sourceFilter === "all") return articles
    return articles.filter((a) => a.source === sourceFilter)
  }, [sourceFilter, articles])

  function toggleArticleStatus(id: string) {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: (a.status === "active"
                ? "disabled"
                : "active") as ArticleStatus,
            }
          : a
      )
    )
  }

  function removeSitemap(id: string) {
    setSitemaps((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-orange/20 bg-[linear-gradient(135deg,var(--color-card)_0%,color-mix(in_oklch,var(--color-amber-glow)_10%,var(--color-card))_55%,var(--color-background)_100%)] p-4 shadow-sm ring-1 shadow-orange/5 ring-foreground/5 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              <IconNotes className="size-7 shrink-0" />
              Content library
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              These are the articles we&apos;re using to find backlink prospects for
              your queue. Keep the right pages active
              so discovery can match them against relevant sites.
            </p>
          </div>

          <p className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
            {articles.length} articles · {sitemaps.length} sitemaps
          </p>
        </div>
      </div>

      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles">
            <IconNotes className="size-4" />
            Articles
            <span data-slot="tab-count">
              {articles.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="sitemaps">
            <IconSitemap className="size-4" />
            Sitemaps
            <span data-slot="tab-count">
              {sitemaps.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="mt-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {SOURCE_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setSourceFilter(f.value)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
                      sourceFilter === f.value
                        ? "bg-foreground text-background shadow-sm"
                        : "bg-background text-muted-foreground ring-1 ring-border/70 hover:bg-orange/10 hover:text-foreground hover:ring-orange/30"
                    )}
                  >
                    {f.label}
                    {f.value !== "all" && (
                      <span className="ml-1.5 tabular-nums opacity-60">
                        {sourceCounts[f.value]}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground ring-1 ring-border/70 transition-all hover:bg-orange/10 hover:text-foreground hover:ring-orange/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none">
                  <IconRefresh className="size-3" />
                  Refresh all
                </button>
                <Button size="sm" className="shrink-0 rounded-full">
                  <IconPlus />
                  Add article
                </Button>
              </div>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                        Article
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Source
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Length
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Target keywords
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Prospects
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Added
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-12 text-center text-sm text-muted-foreground"
                        >
                          No articles found. Add one manually or connect a sitemap.
                        </td>
                      </tr>
                    )}
                    {filtered.map((article) => (
                      <ArticleRow
                        key={article.id}
                        article={article}
                        onToggleStatus={toggleArticleStatus}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sitemaps" className="mt-4">
          <Card>
            <CardHeader className="border-b border-border/60">
              <CardTitle>Sitemaps</CardTitle>
              <p className="row-start-2 text-xs text-muted-foreground">
                Add your sitemap URLs and we&apos;ll automatically pull in new
                articles as you publish. Pause or remove any sitemap at any time.
              </p>
              <CardAction>
                <Button variant="outline" size="sm">
                  <IconPlus />
                  Add sitemap
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {sitemaps.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No sitemaps added yet.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Add your sitemap.xml URL to automatically discover new articles.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {sitemaps.map((s) => (
                    <SitemapRow key={s.id} sitemap={s} onRemove={removeSitemap} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
