import { Router, type IRouter } from "express"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { scraperHeavyLimit } from "../helpers/scraper-limits.js"

const log = createLogger("route-dev-test-scraper")

async function callScraper(url: string): Promise<unknown | null> {
  const scraperUrl = process.env.SCRAPER_URL
  if (!scraperUrl) {
    log.warn("SCRAPER_URL not set")
    return null
  }

  // Global heavy-pool slot: the abort timeout starts inside, once we hold it.
  return scraperHeavyLimit(async () => {
    try {
      const scraperApiKey = process.env.SCRAPER_API_KEY
      const res = await fetch(`${scraperUrl}/agent-scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(scraperApiKey ? { "x-api-key": scraperApiKey } : {}),
        },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(120_000),
      })
      if (!res.ok) {
        const body = await res.text().catch(() => "(unreadable)")
        log.warn("scraper error", { url, status: res.status, body })
        return null
      }
      return res.json()
    } catch (err) {
      log.warn("scraper call failed", { url, error: String(err) })
      return null
    }
  })
}

export const devTestScraperRouter: IRouter = Router()

devTestScraperRouter.post("/dev/test-scraper", async (req, res) => {
  await withRouteLog("dev-test-scraper", async () => {
    const url = typeof req.body.url === "string" ? req.body.url.trim() : ""

    if (!url) {
      res.status(400).json({ ok: false, error: "Missing url" })
      return
    }

    let domain: string
    try {
      domain = new URL(url).hostname
    } catch {
      res.status(400).json({ ok: false, error: "Invalid url" })
      return
    }

    log.info("starting scraper test", { domain, target: url })

    const scraperResult = await callScraper(url)

    log.info("scraper test done", { domain, hasResult: scraperResult !== null })
    log.info("output", { domain, url, scraperResult })
    res.json({ ok: true, domain, url, scraperResult })
  })
})
