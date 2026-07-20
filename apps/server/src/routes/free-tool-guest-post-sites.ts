import { timingSafeEqual } from "node:crypto"
import { Router, type IRouter } from "express"
import { withRouteLog } from "../helpers/logger.js"
import { checkRateLimit } from "../helpers/rate-limit.js"
import { findGuestPostSitesByUrl } from "../methods/guest-post-sites/find-guest-post-sites-by-url.js"
import type { SiteContext } from "../methods/guest-post-sites/types.js"

export const freeToolGuestPostSitesRouter: IRouter = Router()

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

function parseSiteContext(raw: unknown): SiteContext | undefined {
  if (!raw || typeof raw !== "object") return undefined
  const obj = raw as Record<string, unknown>

  return {
    title: typeof obj.title === "string" ? obj.title : null,
    metaDescription: typeof obj.metaDescription === "string" ? obj.metaDescription : null,
    h1: Array.isArray(obj.h1) ? obj.h1.filter((v): v is string => typeof v === "string") : [],
    paragraphs: Array.isArray(obj.paragraphs)
      ? obj.paragraphs.filter((v): v is string => typeof v === "string")
      : [],
  }
}

freeToolGuestPostSitesRouter.post("/find-guest-post-sites-by-url", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const clientIp = req.header("x-forwarded-client-ip") ?? "unknown"
  const { allowed } = checkRateLimit("guest-post-sites-finder", clientIp)
  if (!allowed) {
    res.status(429).json({ error: "Daily limit reached. Come back tomorrow." })
    return
  }

  const rawUrl = typeof req.body.url === "string" ? req.body.url.trim() : ""
  const rawProductName =
    typeof req.body.productName === "string" ? req.body.productName.trim() : ""
  const siteContext = parseSiteContext(req.body.siteContext)

  if (!rawUrl) {
    res.status(400).json({ error: "url is required" })
    return
  }
  if (!rawProductName) {
    res.status(400).json({ error: "productName is required" })
    return
  }

  try {
    const result = await withRouteLog(
      `find-guest-post-sites-by-url-${new URL(rawUrl).hostname}`,
      () => findGuestPostSitesByUrl({ url: rawUrl, productName: rawProductName, siteContext })
    )
    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})
