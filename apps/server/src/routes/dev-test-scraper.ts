import { Router, type IRouter } from "express"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import type { PageType } from "../methods/competitor-backlinks/score-backlink-relevance.js"

const log = createLogger("route-dev-test-scraper")

type TestCase = {
  domain: string
  urlFrom: string
  pageType: PageType
  dr: number
  pageTitle: string
}

const TEST_CASES: TestCase[] = [
  {
    domain: "onelittleweb.com",
    urlFrom: "https://onelittleweb.com/top-tools/best-seo-tools-for-agencies/",
    pageType: "roundup",
    dr: 71,
    pageTitle: "15 Best SEO Tools for Agencies Tested on Real Client Work",
  },
  {
    domain: "backlinko.com",
    urlFrom: "https://backlinko.com/link-building-tools",
    pageType: "roundup",
    dr: 90,
    pageTitle: "10 AWESOME Link Building Tools in 2026",
  },
  {
    domain: "aioseo.com",
    urlFrom: "https://aioseo.com/best-link-building-tools/",
    pageType: "roundup",
    dr: 83,
    pageTitle: "11 Best Link Building Tools You Can't Afford to Miss for SEO",
  },
  {
    domain: "trafficthinktank.com",
    urlFrom: "https://trafficthinktank.com/moz-alternatives/",
    pageType: "roundup",
    dr: 69,
    pageTitle: "The 16 Best Moz Alternatives You Should Try in 2026",
  },
  {
    domain: "buzzstream.com",
    urlFrom: "https://www.buzzstream.com/blog/guest-posting-sites/",
    pageType: "resource",
    dr: 76,
    pageTitle:
      "100+ Quality Guest Posting Sites (Updated Post-HCU) - BuzzStream",
  },
]

async function callScraper(url: string): Promise<unknown | null> {
  const scraperUrl = process.env.SCRAPER_URL
  if (!scraperUrl) {
    log.warn("SCRAPER_URL not set")
    return null
  }
  try {
    const res = await fetch(`${scraperUrl}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(60_000),
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
}

export const devTestScraperRouter: IRouter = Router()

devTestScraperRouter.post("/dev/test-scraper", async (req, res) => {
  await withRouteLog("dev-test-scraper", async () => {
    log.info("starting scraper test", { cases: TEST_CASES.length })

    const output: unknown[] = []
    for (const tc of TEST_CASES) {
      log.info("scraping", {
        domain: tc.domain,
        pageType: tc.pageType,
        target: tc.urlFrom,
      })
      try {
        const scraperResult = await callScraper(tc.urlFrom)
        output.push({
          domain: tc.domain,
          urlFrom: tc.urlFrom,
          scraperTarget: tc.urlFrom,
          pageType: tc.pageType,
          dr: tc.dr,
          pageTitle: tc.pageTitle,
          scraperResult,
        })
      } catch (err) {
        output.push({ domain: tc.domain, error: String(err) })
      }
    }

    log.info("scraper test done", { total: output.length })
    log.info("output", { results: output })
    res.json({ ok: true, results: output })
  })
})
