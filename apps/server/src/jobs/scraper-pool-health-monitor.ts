import { createLogger } from "../helpers/logger.js"

const log = createLogger("scraper-pool-health-monitor")

// A pool sitting at active==capacity for one check is just busy — normal
// under real traffic. A pool sitting there AND at waiting==max_queue across
// multiple checks spanning this long is wedged: see
// 2026-08-25-scraper-pool-slots-leak-on-hung-request.md, where this state
// held for ~8 hours before anyone noticed by chance.
const STUCK_THRESHOLD_MS = 5 * 60 * 1000

type PoolStat = {
  active: number
  waiting: number
  capacity: number
  max_queue: number
  rejected: number
  abandoned: number
  timed_out: number
}

type ScraperHealthResponse = {
  status: string
  pools: Record<string, PoolStat>
}

// Module-level: persists across cron ticks within this process so we can
// tell "just became wedged" from "still wedged since last check".
const wedgedSince = new Map<string, number>()
const alreadyAlerted = new Set<string>()

export async function checkScraperPoolHealth(): Promise<void> {
  const scraperUrl = process.env.SCRAPER_URL
  if (!scraperUrl) return

  let health: ScraperHealthResponse
  try {
    const res = await fetch(`${scraperUrl}/health`, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) {
      log.warn("health check returned non-200", { status: res.status })
      return
    }
    health = (await res.json()) as ScraperHealthResponse
  } catch (err) {
    log.warn("health check failed", { error: String(err) })
    return
  }

  const now = Date.now()

  for (const [pool, stats] of Object.entries(health.pools)) {
    const wedged = stats.active >= stats.capacity && stats.waiting >= stats.max_queue

    if (!wedged) {
      wedgedSince.delete(pool)
      alreadyAlerted.delete(pool)
      continue
    }

    const since = wedgedSince.get(pool) ?? now
    wedgedSince.set(pool, since)

    const wedgedForMs = now - since
    if (wedgedForMs < STUCK_THRESHOLD_MS || alreadyAlerted.has(pool)) continue

    alreadyAlerted.add(pool)
    log.error(
      `scraper ${pool} pool wedged for ${Math.round(wedgedForMs / 60_000)}+ min: active==capacity and waiting==max_queue, nothing draining`,
      { pool, ...stats, wedgedForMs },
    )
  }
}
