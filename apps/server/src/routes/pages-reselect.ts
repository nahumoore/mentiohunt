import { Router, type IRouter } from "express"
import { timingSafeEqual } from "node:crypto"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { crawlProductPages } from "../methods/product-pages/crawl-product-pages.js"

const log = createLogger("route-pages-reselect")

export const pagesReselectRouter: IRouter = Router()

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

pagesReselectRouter.post("/pages/reselect", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const body = req.body as Record<string, unknown>
  const productId = typeof body?.productId === "string" ? body.productId.trim() : ""

  if (!productId) {
    res.status(400).json({ error: "productId is required" })
    return
  }

  res.status(202).json({ queued: true })

  withRouteLog(`pages-reselect-${productId}`, () =>
    crawlProductPages(productId, { crawlLimit: 50 })
  ).catch((err) => log.error("unhandled reselect error", { error: String(err) }))
})
