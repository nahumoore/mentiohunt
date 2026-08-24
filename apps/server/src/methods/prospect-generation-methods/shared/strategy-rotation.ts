import { isGenuineZeroYieldRun } from "./run-health.js"

export type RotationHistoryRun = {
  strategy: string
  started_at: string | null
  status: string
  prospects_created: number | null
  metadata: unknown
  error: string | null
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
