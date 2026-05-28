export const FREE_TOOLS_DAILY_LIMIT = 10

export const FREE_TOOL_NAMES = {
  directoryOpportunityFinder: "directory-opportunity-finder",
  directoryBacklinkOpportunityFinder: "directory-backlink-opportunity-finder",
  backlinkPriceCalculator: "backlink-price-calculator",
  backlinkOpportunityFinder: "backlink-opportunity-finder",
  competitorBacklinkGap: "competitor-backlink-gap",
} as const

export type FreeToolName =
  (typeof FREE_TOOL_NAMES)[keyof typeof FREE_TOOL_NAMES]

// In-memory rate limiter — resets on deploy/restart, breaks with multiple instances
type RateLimitEntry = { count: number; date: string }
const rateLimitStore = new Map<string, RateLimitEntry>()

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

export function checkFreeToolRateLimit(
  tool: FreeToolName,
  ip: string
): { allowed: boolean; remaining: number } {
  const today = todayUTC()
  const key = `${tool}:${ip}:${today}`

  const entry = rateLimitStore.get(key)

  if (!entry || entry.date !== today) {
    rateLimitStore.set(key, { count: 1, date: today })
    return { allowed: true, remaining: FREE_TOOLS_DAILY_LIMIT - 1 }
  }

  if (entry.count >= FREE_TOOLS_DAILY_LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: FREE_TOOLS_DAILY_LIMIT - entry.count }
}
