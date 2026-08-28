export const DEFAULT_DAILY_DISCOVERY_SETTINGS = {
  adaptiveDiscoveryEnabled: true,
  target: 25,
  candidateCap: 40,
  attemptCap: 80,
  costCapUsd: 0.7,
} as const

export function utcQuotaDate(now = new Date()): string {
  return now.toISOString().slice(0, 10)
}

export function remainingDailyBudget(
  target: number,
  attemptCap: number,
  costCapUsd: number,
  readyCount: number,
  previousAttempts: number,
  previousCostUsd: number
) {
  return {
    targetRemaining: Math.max(0, target - readyCount),
    attemptsRemaining: Math.max(0, attemptCap - previousAttempts),
    costRemainingUsd: Math.max(
      0,
      Math.round((costCapUsd - previousCostUsd) * 10_000) / 10_000
    ),
  }
}
