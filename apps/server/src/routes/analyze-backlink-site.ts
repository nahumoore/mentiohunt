import { timingSafeEqual } from "node:crypto"
import { Router, type IRouter } from "express"
import { withRouteLog } from "../helpers/logger.js"
import { checkRateLimit } from "../helpers/rate-limit.js"
import { analyzeBacklinkSite } from "../methods/backlinks/analyze-backlink-site.js"

export const analyzeBacklinkSiteRouter: IRouter = Router()

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

analyzeBacklinkSiteRouter.post("/analyze-backlink-site", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const clientIp = req.header("x-forwarded-client-ip") ?? "unknown"
  const { allowed } = checkRateLimit("backlink-price-calculator", clientIp)
  if (!allowed) {
    res.status(429).json({ error: "Daily limit reached. Come back tomorrow." })
    return
  }

  const rawUrl = typeof req.body.url === "string" ? req.body.url.trim() : ""
  if (!rawUrl) {
    res.status(400).json({ error: "url is required" })
    return
  }

  try {
    const result = await withRouteLog(
      `analyze-backlink-site-${new URL(rawUrl).hostname}`,
      () => analyzeBacklinkSite({ url: rawUrl })
    )
    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(422).json({ error: message })
  }
})
