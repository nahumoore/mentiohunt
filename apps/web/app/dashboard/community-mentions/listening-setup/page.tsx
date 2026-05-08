"use client"

import { useMemo, useState } from "react"
import {
  IconBan,
  IconBolt,
  IconMessageCircle,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconShieldCheck,
  IconTargetArrow,
  IconTrash,
} from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"

import {
  MOCK_LISTENING_SOURCES,
  MOCK_LISTENING_TOPICS,
  MOCK_REPLY_GUIDELINES,
  PLATFORM_CONFIG,
  SOURCE_STATUS_CONFIG,
  SOURCE_TYPE_CONFIG,
  formatDateTime,
  type ListeningPlatform,
  type ListeningSource,
  type ListeningSourceStatus,
  type ListeningSourceType,
} from "./_data"

function PlatformBadge({ platform }: { platform: ListeningPlatform }) {
  const cfg = PLATFORM_CONFIG[platform]
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

function SourceTypeBadge({ sourceType }: { sourceType: ListeningSourceType }) {
  const cfg = SOURCE_TYPE_CONFIG[sourceType]
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

function StatusBadge({ status }: { status: ListeningSourceStatus }) {
  const cfg = SOURCE_STATUS_CONFIG[status]
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

function PillList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function SourceRow({
  source,
  onRemove,
}: {
  source: ListeningSource
  onRemove: (id: string) => void
}) {
  return (
    <tr className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/40">
      <td className="min-w-[320px] px-6 py-3.5">
        <p className="font-medium leading-snug">{source.label}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {source.query}
        </p>
        {source.url ? (
          <p className="mt-1 truncate text-xs text-muted-foreground/80">
            {source.url}
          </p>
        ) : null}
      </td>
      <td className="px-4 py-3.5">
        <PlatformBadge platform={source.platform} />
      </td>
      <td className="px-4 py-3.5">
        <SourceTypeBadge sourceType={source.sourceType} />
      </td>
      <td className="px-4 py-3.5 text-muted-foreground tabular-nums">
        {source.postsFound}
      </td>
      <td className="px-4 py-3.5">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary tabular-nums">
          {source.qualifiedMentions}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground tabular-nums">
        {formatDateTime(source.lastScannedAt)}
      </td>
      <td className="px-4 py-3.5">
        <StatusBadge status={source.status} />
      </td>
      <td className="px-4 py-3.5">
        <button
          onClick={() => onRemove(source.id)}
          title="Remove source"
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <IconTrash className="size-3.5" />
        </button>
      </td>
    </tr>
  )
}

export default function ListeningSetupPage() {
  const [sources, setSources] = useState<ListeningSource[]>(MOCK_LISTENING_SOURCES)

  const sourceTotals = useMemo(() => {
    return sources.reduce(
      (totals, source) => {
        totals.postsFound += source.postsFound
        totals.qualifiedMentions += source.qualifiedMentions
        if (source.status === "active") totals.activeSources += 1
        return totals
      },
      { postsFound: 0, qualifiedMentions: 0, activeSources: 0 }
    )
  }, [sources])

  function removeSource(id: string) {
    setSources((prev) => prev.filter((source) => source.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-orange/20 bg-[linear-gradient(135deg,var(--color-card)_0%,color-mix(in_oklch,var(--color-amber-glow)_10%,var(--color-card))_55%,var(--color-background)_100%)] p-4 shadow-sm ring-1 shadow-orange/5 ring-foreground/5 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              <IconSearch className="size-7 shrink-0" />
              Listening setup
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Tune where Mentiohunt scans, which signals qualify a post, and how
              replies should sound before they enter the queue.
            </p>
          </div>

          <p className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
            {sourceTotals.activeSources} active · {sourceTotals.qualifiedMentions} qualified
          </p>
        </div>
      </div>

      <Tabs defaultValue="sources">
        <TabsList>
          <TabsTrigger value="sources">
            <IconSearch className="size-4" />
            Sources
            <span data-slot="tab-count">
              {sources.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="topics">
            <IconTargetArrow className="size-4" />
            Topics
          </TabsTrigger>
          <TabsTrigger value="guidelines">
            <IconShieldCheck className="size-4" />
            Reply guidelines
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="mt-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <MiniStat label="Posts scanned" value={sourceTotals.postsFound} />
                <MiniStat label="Qualified mentions" value={sourceTotals.qualifiedMentions} />
                <MiniStat label="Active sources" value={sourceTotals.activeSources} />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground ring-1 ring-border/70 transition-all hover:bg-orange/10 hover:text-foreground hover:ring-orange/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none">
                  <IconRefresh className="size-3" />
                  Scan now
                </button>
                <Button size="sm" className="shrink-0 rounded-full">
                  <IconPlus />
                  Add source
                </Button>
              </div>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                        Source
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Platform
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Posts
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Qualified
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Last scanned
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {sources.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-12 text-center text-sm text-muted-foreground"
                        >
                          No listening sources yet. Add a source to start scanning
                          for relevant community posts.
                        </td>
                      </tr>
                    )}
                    {sources.map((source) => (
                      <SourceRow
                        key={source.id}
                        source={source}
                        onRemove={removeSource}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="topics" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <TopicCard
              icon={IconTargetArrow}
              title="Product keywords"
              description="Terms that indicate the post is about the product category or core workflow."
              items={MOCK_LISTENING_TOPICS.productKeywords}
            />
            <TopicCard
              icon={IconBolt}
              title="Competitors"
              description="Brand names that can reveal alternative, comparison, and replacement conversations."
              items={MOCK_LISTENING_TOPICS.competitorNames}
            />
            <TopicCard
              icon={IconMessageCircle}
              title="Pain points"
              description="Problems that make a reply useful even when the post does not mention a tool directly."
              items={MOCK_LISTENING_TOPICS.painPoints}
            />
            <TopicCard
              icon={IconBan}
              title="Excluded terms"
              description="Terms that should suppress noisy, risky, or low-fit community posts."
              items={MOCK_LISTENING_TOPICS.excludedTerms}
            />
          </div>
        </TabsContent>

        <TabsContent value="guidelines" className="mt-4">
          <Card>
            <CardHeader className="border-b border-border/60">
              <CardTitle>Reply guidelines</CardTitle>
              <p className="row-start-2 text-xs text-muted-foreground">
                These constraints shape generated replies so they sound helpful,
                transparent, and appropriate for community conversations.
              </p>
              <CardAction>
                <Button variant="outline" size="sm">
                  Edit guidelines
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_0.8fr]">
                <Guideline label="Tone" value={MOCK_REPLY_GUIDELINES.tone} />
                <Guideline label="CTA style" value={MOCK_REPLY_GUIDELINES.ctaStyle} />
                <Guideline
                  label="Max length"
                  value={`${MOCK_REPLY_GUIDELINES.maxReplyLength} characters`}
                />
                <div className="rounded-3xl bg-muted/40 p-4 lg:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Preferred disclosure
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    {MOCK_REPLY_GUIDELINES.preferredDisclosure}
                  </p>
                </div>
                <div className="rounded-3xl bg-muted/40 p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Blocked claims
                  </p>
                  <div className="mt-3">
                    <PillList items={MOCK_REPLY_GUIDELINES.blockedClaims} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-card px-4 py-3 shadow-sm ring-1 ring-foreground/5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function TopicCard({
  icon: Icon,
  title,
  description,
  items,
}: {
  icon: React.ElementType
  title: string
  description: string
  items: string[]
}) {
  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange/10 text-pumpkin-spice">
            <Icon className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold tracking-tight">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <PillList items={items} />
      </CardContent>
    </Card>
  )
}

function Guideline({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-muted/40 p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6">{value}</p>
    </div>
  )
}
