import { timingSafeEqual } from "node:crypto"
import { Router, type IRouter } from "express"
import { withRouteLog } from "../helpers/logger.js"
import { checkRateLimit } from "../helpers/rate-limit.js"
import { checkDirectoryOpportunitiesByUrl } from "../methods/directories/check-directory-opportunities-by-url.js"

export const directoryOpportunitiesByUrlRouter: IRouter = Router()

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

directoryOpportunitiesByUrlRouter.post(
  "/find-directory-opportunities-by-url",
  async (req, res) => {
    const expected = process.env.INTERNAL_API_KEY
    if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
      res.status(401).json({ error: "unauthorized" })
      return
    }

    const clientIp = req.header("x-forwarded-client-ip") ?? "unknown"
    const { allowed } = checkRateLimit("directory-backlink-opportunity-finder", clientIp)
    if (!allowed) {
      res.status(429).json({ error: "Daily limit reached. Come back tomorrow." })
      return
    }

    const rawUrl =
      typeof req.body.url === "string" ? req.body.url.trim() : ""
    const rawProductName =
      typeof req.body.productName === "string" ? req.body.productName.trim() : ""
    const freeOnly = req.body.freeOnly === true

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
        `find-directory-opportunities-by-url-${new URL(rawUrl).hostname}`,
        () => checkDirectoryOpportunitiesByUrl({ url: rawUrl, productName: rawProductName, freeOnly })
      )
      res.json(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      res.status(500).json({ error: message })
    }
  }
)
