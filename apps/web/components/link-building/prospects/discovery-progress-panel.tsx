"use client"

import {
  IconAlertTriangle,
  IconCircleCheck,
  IconLoader2,
} from "@tabler/icons-react"
import { Card } from "@workspace/ui/components/card"
import Link from "next/link"
import { useEffect } from "react"

import { captureEvent } from "@/lib/analytics"
import { isDiscoveryRunning, type ProspectRunItem } from "@/lib/prospect-runs"
import { PROSPECT_TIER_CONFIG, type ProspectTier } from "@/lib/opportunity-types"
import { useProspectStore, type ProspectListItem } from "@/stores/prospect-store"

const STRATEGY_ORDER: ProspectTier[] = [
  "competitor_backlink",
  "unlinked_mention",
  "listicle_roundup",
]

type StrategyRunView = {
  strategy: ProspectTier
  status: ProspectRunItem["status"]
  count: number
}

function isProspectTier(value: string): value is ProspectTier {
  return value in PROSPECT_TIER_CONFIG
}

// One row per strategy, from its most recent run. Counts come from prospects
// discovered during that run — `prospects_created` only gets written when a
// run completes, so live counts must be derived from the streaming rows.
function buildStrategyViews(
  runs: ProspectRunItem[],
  prospects: ProspectListItem[]
): StrategyRunView[] {
  const latestByStrategy = new Map<ProspectTier, ProspectRunItem>()
  for (const run of runs) {
    if (!isProspectTier(run.strategy)) continue
    if (!latestByStrategy.has(run.strategy)) latestByStrategy.set(run.strategy, run)
  }

  return STRATEGY_ORDER.filter((strategy) => latestByStrategy.has(strategy)).map(
    (strategy) => {
      const run = latestByStrategy.get(strategy)!
      const liveCount = prospects.filter(
        (prospect) =>
          prospect.tier === strategy &&
          (!run.started_at ||
            (prospect.discovered_at && prospect.discovered_at >= run.started_at))
      ).length

      return {
        strategy,
        status: run.status,
        // Guard against the visible count dipping when a run flips to
        // completed and `prospects_created` lags behind the streamed rows.
        count: Math.max(run.prospects_created ?? 0, liveCount),
      }
    }
  )
}

function StrategyStatusRow({ view }: { view: StrategyRunView }) {
  const config = PROSPECT_TIER_CONFIG[view.strategy]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3 text-left">
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-md ${config.color}`}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{config.label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {config.description}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 text-xs">
        {view.status === "running" || view.status === "pending" ? (
          <>
            <IconLoader2 className="size-3.5 animate-spin text-(--color-blaze-orange)" />
            <span className="text-muted-foreground">
              Scanning…{" "}
              <span className="font-semibold text-foreground">
                {view.count} found
              </span>
            </span>
          </>
        ) : view.status === "completed" ? (
          <>
            <IconCircleCheck className="size-3.5 text-emerald-500" />
            <span className="text-muted-foreground">
              Done —{" "}
              <span className="font-semibold text-foreground">
                {view.count} {view.count === 1 ? "opportunity" : "opportunities"}
              </span>
            </span>
          </>
        ) : (
          <>
            <IconAlertTriangle className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">
              Didn&apos;t finish — retries on the next daily run
            </span>
          </>
        )}
      </div>
    </div>
  )
}

export function DiscoveryProgressPanel() {
  const runs = useProspectStore((state) => state.runs)
  const prospects = useProspectStore((state) => state.prospects)
  const views = buildStrategyViews(runs, prospects)

  useEffect(() => {
    captureEvent("discovery_progress_viewed", {
      runningCount: runs.filter(
        (run) => run.status === "running" || run.status === "pending"
      ).length,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Card className="rounded-xl border border-border px-6 py-12 shadow-sm">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-(--color-blaze-orange)/10">
            <IconLoader2 className="size-5 animate-spin text-(--color-blaze-orange)" />
          </span>
          <h2 className="text-base font-semibold text-foreground">
            Building your prospect queue
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            We&apos;re analyzing your site and competitors to surface relevant
            backlink opportunities. New ones appear below as we find them —
            you&apos;ll also receive an email once done!
          </p>
        </div>

        {views.length > 0 ? (
          <div className="flex w-full flex-col gap-2">
            {views.map((view) => (
              <StrategyStatusRow key={view.strategy} view={view} />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconLoader2 className="size-3.5 animate-spin" />
            Starting discovery…
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Stronger competitor lists find more opportunities — you can add
          competitors anytime in{" "}
          <Link
            href="/dashboard/prospects/settings"
            className="font-medium text-(--color-blaze-orange) hover:underline"
          >
            Discovery settings
          </Link>
          .
        </p>
      </div>
    </Card>
  )
}

export function DiscoveryProgressBanner() {
  const runs = useProspectStore((state) => state.runs)
  const prospects = useProspectStore((state) => state.prospects)

  if (!isDiscoveryRunning(runs)) return null

  const views = buildStrategyViews(runs, prospects)

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <IconLoader2 className="size-4 animate-spin text-(--color-blaze-orange)" />
        <span>
          Discovery still running — new opportunities appear here as we find
          them
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {views.map((view) => {
          const config = PROSPECT_TIER_CONFIG[view.strategy]
          const Icon = config.icon
          const running = view.status === "running" || view.status === "pending"
          return (
            <span
              key={view.strategy}
              className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs text-muted-foreground"
            >
              <Icon className="size-3.5" />
              <span className="font-medium text-foreground">{view.count}</span>
              {running ? (
                <IconLoader2 className="size-3 animate-spin" />
              ) : view.status === "completed" ? (
                <IconCircleCheck className="size-3 text-emerald-500" />
              ) : (
                <IconAlertTriangle className="size-3" />
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function DiscoveryZeroResultsEmpty({ allFailed }: { allFailed: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <IconAlertTriangle className="size-5 text-muted-foreground" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p className="text-base font-semibold text-foreground">
          {allFailed
            ? "Discovery didn't finish"
            : "No opportunities found on this run"}
        </p>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          {allFailed
            ? "Something interrupted this discovery run — we'll retry automatically on the next daily run."
            : "Discovery reruns daily, and better inputs surface more opportunities. Adding competitors and keywords is the fastest way to improve results."}
        </p>
      </div>
      <Link
        href="/dashboard/prospects/settings"
        className="text-sm font-medium text-(--color-blaze-orange) hover:underline"
      >
        Review discovery settings
      </Link>
    </div>
  )
}
