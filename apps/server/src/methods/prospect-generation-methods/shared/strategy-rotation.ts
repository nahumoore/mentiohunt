import { isGenuineZeroYieldRun } from "./run-health.js"

export type RotationHistoryRun = {
  strategy: string
  started_at: string | null
  status: string
  prospects_created: number | null
  metadata: unknown
  error: string | null
  cost_usd?: number | null
}

const EXPLORATION_COOLDOWN_RUNS = 1
const EXHAUSTED_COOLDOWN_RUNS = 3
const EXHAUSTED_STREAK_THRESHOLD = 4

function newestFirst(runs: RotationHistoryRun[]): RotationHistoryRun[] {
  return [...runs].sort((a, b) => (a.started_at ?? "") < (b.started_at ?? "") ? 1 : -1)
}

function consecutiveZeroYieldRuns(runs: RotationHistoryRun[], strategy: string): number {
  let streak = 0

  for (const run of newestFirst(runs.filter((candidate) => candidate.strategy === strategy))) {
    if (!isGenuineZeroYieldRun(run)) break
    streak += 1
  }

  return streak
}

/**
 * Return the number of product run slots for which a strategy should be
 * held back after a clean zero-yield streak. The strategy remains eligible
 * for exploration once the cooldown expires.
 */
export function getStrategyCooldownRuns(runs: RotationHistoryRun[], strategy: string): number {
  const strategyRuns = newestFirst(runs.filter((run) => run.strategy === strategy))
  const latestZero = strategyRuns.find((run) => isGenuineZeroYieldRun(run))
  const latestZeroStartedAt = latestZero?.started_at
  if (!latestZeroStartedAt) return 0

  const streak = consecutiveZeroYieldRuns(strategyRuns, strategy)
  if (streak < 2) return 0

  const cooldown = streak >= EXHAUSTED_STREAK_THRESHOLD
    ? EXHAUSTED_COOLDOWN_RUNS
    : EXPLORATION_COOLDOWN_RUNS

  const newerProductRuns = runs.filter((run) =>
    run.started_at !== null && run.started_at > latestZeroStartedAt
  ).length

  return Math.max(0, cooldown - newerProductRuns)
}

/**
 * Preserve least-recently-run ordering. Cooldown is intentionally checked
 * separately so a productive strategy can move ahead of an exhausted one.
 */
export function orderStrategiesByStaleness<T extends string>(
  enabled: T[],
  runs: RotationHistoryRun[]
): T[] {
  const lastRunByStrategy = new Map<string, string>()

  for (const run of newestFirst(runs)) {
    if (!lastRunByStrategy.has(run.strategy)) {
      lastRunByStrategy.set(run.strategy, run.started_at ?? "")
    }
  }

  return enabled
    .map((strategy, index) => ({ strategy, index }))
    .sort((a, b) => {
      const aTime = lastRunByStrategy.get(a.strategy) ?? ""
      const bTime = lastRunByStrategy.get(b.strategy) ?? ""
      if (aTime === bTime) return a.index - b.index
      return aTime < bTime ? -1 : 1
    })
    .map(({ strategy }) => strategy as T)
}

function metadataNumber(metadata: unknown, ...keys: string[]): number | null {
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) return null
  const record = metadata as Record<string, unknown>
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
  }
  return null
}

/** Send-ready yield recorded by each source's enrichment funnel. */
export function getSendReadyCount(run: RotationHistoryRun): number {
  return metadataNumber(run.metadata, "enriched_with_contact", "enrichedWithContact")
    ?? Math.max(0, run.prospects_created ?? 0)
}

/**
 * Rank target-filling sources by recent send-ready output per dollar. A small
 * cost floor prevents legacy/unmetered zero-cost runs from dominating. New
 * sources receive a neutral exploration score instead of being buried.
 */
export function getStrategyEfficiency(runs: RotationHistoryRun[], strategy: string): number {
  const completed = newestFirst(
    runs.filter((run) => run.strategy === strategy && run.status === "completed" && !run.error)
  ).slice(0, 5)
  if (completed.length === 0) return 1

  const sendReady = completed.reduce((total, run) => total + getSendReadyCount(run), 0)
  const cost = completed.reduce((total, run) => total + Math.max(0, run.cost_usd ?? 0), 0)
  return sendReady / Math.max(cost, completed.length * 0.01)
}

/**
 * Adaptive cooldowns are based only on this source's own clock. Running a
 * different source no longer burns down an exhausted source's cooldown.
 */
export function isStrategyCoolingDown(
  runs: RotationHistoryRun[],
  strategy: string,
  now = new Date()
): boolean {
  const strategyRuns = newestFirst(runs.filter((run) => run.strategy === strategy))
  const latest = strategyRuns[0]
  if (!latest?.started_at) return false

  const streak = consecutiveZeroYieldRuns(strategyRuns, strategy)
  if (streak < 2) return false

  const cooldownDays = streak >= EXHAUSTED_STREAK_THRESHOLD ? 3 : 1
  return now.getTime() - new Date(latest.started_at).getTime() < cooldownDays * 24 * 60 * 60 * 1_000
}

export function orderStrategiesByEfficiency<T extends string>(
  enabled: T[],
  runs: RotationHistoryRun[]
): T[] {
  return enabled
    .map((strategy, index) => ({ strategy, index, efficiency: getStrategyEfficiency(runs, strategy) }))
    .sort((a, b) => b.efficiency - a.efficiency || a.index - b.index)
    .map(({ strategy }) => strategy)
}
