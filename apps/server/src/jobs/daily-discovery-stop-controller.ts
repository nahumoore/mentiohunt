import {
  getStrategyPerformance,
  type RotationHistoryRun,
} from "../methods/prospect-generation-methods/shared/strategy-rotation.js"

export type DailyDiscoveryStopReason =
  | "target_reached"
  | "attempt_cap_reached"
  | "cost_cap_reached"
  | "sources_exhausted"

export type StrategyAttemptBudget = { remaining: number }

export type StrategyAllocation = {
  attemptBudget: StrategyAttemptBudget
  attemptLimit: number
  targetRemainingAtStart: number
  estimatedReadyRate: number
  explorationProbe: boolean
}

export type StrategySkipRecord = {
  strategy: string
  skipReason: string
}

type AllocationOptions = {
  history: RotationHistoryRun[]
  explorationProbe?: boolean
  higherYieldSourceRunnable?: boolean
}

const MAX_BOUNDED_BATCH = 20
const RESOURCE_PAGE_SHARE_WHILE_HIGHER_YIELD_RUNNABLE = 0.2
const RESOURCE_PAGE_MAX_ATTEMPTS = 8
const EXPLORATION_PROBE_ATTEMPTS = 5
const CONFIGURATION_SKIP_REASONS = new Set([
  "competitor_backlink_requires_product_name_or_valid_competitor",
  "unlinked_mention_requires_product_name",
  "listicle_roundup_requires_product_name",
  "resource_page_inclusion_requires_crawled_target_page",
  "broken_link_requires_valid_competitor",
  "broken_link_requires_crawled_replacement_page",
])

function roundMoney(value: number): number {
  return Math.round(value * 10_000) / 10_000
}

export function configurationReasonForSourceSkips(
  enabled: string[],
  skips: StrategySkipRecord[]
): string | undefined {
  if (skips.length !== enabled.length) return undefined
  if (!skips.every((skip) => CONFIGURATION_SKIP_REASONS.has(skip.skipReason))) return undefined
  if (skips.length === 1) return skips[0]?.skipReason
  return `selected_sources_missing_prerequisites:${skips.map((skip) => skip.skipReason).join(",")}`
}

/**
 * Owns the three limits shared by all discovery sources in one invocation.
 * Sources receive a local mutable attempt budget, preventing one source from
 * consuming attempts allocated to the rest of the queue.
 */
export class DailyDiscoveryStopController {
  private readyCount: number
  private attemptsRemainingValue: number
  private costRemainingValue: number

  constructor(
    private readonly target: number,
    readyCount: number,
    attemptsRemaining: number,
    costRemainingUsd: number
  ) {
    this.readyCount = Math.max(0, readyCount)
    this.attemptsRemainingValue = Math.max(0, attemptsRemaining)
    this.costRemainingValue = Math.max(0, costRemainingUsd)
  }

  get targetRemaining(): number {
    return Math.max(0, this.target - this.readyCount)
  }

  get attemptsRemaining(): number {
    return this.attemptsRemainingValue
  }

  get costRemainingUsd(): number {
    return this.costRemainingValue
  }

  get stopReason(): Exclude<DailyDiscoveryStopReason, "sources_exhausted"> | null {
    if (this.targetRemaining === 0) return "target_reached"
    if (this.attemptsRemaining === 0) return "attempt_cap_reached"
    if (this.costRemainingUsd <= 0) return "cost_cap_reached"
    return null
  }

  shouldStop(): boolean {
    return this.stopReason !== null
  }

  reconcileReadyCount(readyCount: number): void {
    this.readyCount = Math.max(this.readyCount, readyCount)
  }

  allocate(strategy: string, options: AllocationOptions): StrategyAllocation | null {
    if (this.shouldStop()) return null

    const performance = getStrategyPerformance(options.history, strategy)
    // Discount observed conversion so an unusually good small sample cannot
    // reserve too few attempts to fill the remaining target.
    const conservativeReadyRate = Math.max(0.05, performance.readyPerAttempt * 0.75)
    const attemptsForTarget = Math.ceil(this.targetRemaining / conservativeReadyRate)
    const attemptsAffordable = performance.costPerAttempt > 0
      ? Math.floor(this.costRemainingUsd / performance.costPerAttempt)
      : this.attemptsRemaining
    if (attemptsAffordable <= 0) {
      this.costRemainingValue = 0
      return null
    }

    let attemptLimit = Math.min(
      this.attemptsRemaining,
      attemptsAffordable,
      attemptsForTarget,
      MAX_BOUNDED_BATCH
    )

    if (strategy === "resource_page_inclusion" && options.higherYieldSourceRunnable) {
      const resourceShare = Math.max(
        1,
        Math.floor(this.attemptsRemaining * RESOURCE_PAGE_SHARE_WHILE_HIGHER_YIELD_RUNNABLE)
      )
      attemptLimit = Math.min(attemptLimit, resourceShare, RESOURCE_PAGE_MAX_ATTEMPTS)
    }

    if (options.explorationProbe) {
      attemptLimit = Math.min(attemptLimit, EXPLORATION_PROBE_ATTEMPTS)
    }

    if (attemptLimit <= 0) return null
    return {
      attemptBudget: { remaining: attemptLimit },
      attemptLimit,
      targetRemainingAtStart: this.targetRemaining,
      estimatedReadyRate: performance.readyPerAttempt,
      explorationProbe: options.explorationProbe ?? false,
    }
  }

  commit(allocation: StrategyAllocation, costUsd: number): number {
    const attemptsUsed = Math.max(
      0,
      Math.min(allocation.attemptLimit, allocation.attemptLimit - allocation.attemptBudget.remaining)
    )
    this.attemptsRemainingValue = Math.max(0, this.attemptsRemainingValue - attemptsUsed)
    this.costRemainingValue = Math.max(0, roundMoney(this.costRemainingValue - Math.max(0, costUsd)))
    return attemptsUsed
  }
}
