import { Router, type IRouter } from "express"
import { timingSafeEqual } from "node:crypto"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { fetchPageContent } from "../helpers/scraper-content-client.js"

const log = createLogger("route-onboarding-fetch-site")

export const onboardingFetchSiteRouter: IRouter = Router()

function verifyApiKey(provided: string | undefined, expected: string): boolean {
  if (!provided) return false
  try {
    const a = Buffer.from(provided)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

const TEXT_CHAR_LIMIT = 4_000

onboardingFetchSiteRouter.post("/onboarding/fetch-site", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const url = typeof req.body?.url === "string" ? req.body.url.trim() : ""
  if (!url) {
    res.status(400).json({ error: "url is required" })
    return
  }

  const scraped = await withRouteLog("onboarding-fetch-site", () => fetchPageContent(url))

  if (!scraped) {
    log.warn("scraper could not reach site", { url })
    res.status(502).json({ error: "Site unreachable via scraper" })
    return
  }

  // Same tiered escalation (light fetch -> real Chromium -> stealthy
  // Camoufox + residential proxy + Cloudflare-challenge solving) that already
  // gets past bot protection for backlink discovery and link tracking, used
  // here as onboarding's fallback when the plain Vercel-side fetch in
  // apps/web/lib/onboarding/fetch-site.ts gets bot-blocked.
  res.json({
    finalUrl: url,
    contentType: "text/html",
    status: 200,
    wasTruncated: scraped.text.length >= TEXT_CHAR_LIMIT,
    title: scraped.title || null,
    metaDescription: scraped.description || null,
    metaTags: [],
    h1: [],
    h2: [],
    paragraphs: scraped.text ? [scraped.text] : [],
  })
})
