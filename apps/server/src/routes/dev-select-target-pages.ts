import { Router, type IRouter } from "express"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { crawlProductPages } from "../methods/product-pages/crawl-product-pages.js"

const log = createLogger("route-dev-select-target-pages")

export const devSelectTargetPagesRouter: IRouter = Router()

function numberOrUndefined(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined
  return value
}

devSelectTargetPagesRouter.post("/dev/select-target-pages", async (req, res) => {
  const body = req.body as { productId?: string; crawlLimit?: number; keepTop?: number }
  const productId = typeof body.productId === "string" ? body.productId.trim() : ""

  if (!productId) {
    res.status(400).json({ error: "productId required" })
    return
  }

  await withRouteLog(`dev-select-target-pages-${productId}`, async () => {
    const crawlLimit = numberOrUndefined(body.crawlLimit) ?? 50
    const keepTop = numberOrUndefined(body.keepTop)
    log.info("starting", { productId, crawlLimit, keepTop })

    try {
      const result = await crawlProductPages(productId, { crawlLimit, keepTop })
      log.info("done", { productId, ...result })
      res.json({ ok: true, productId, ...result })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error("failed", { productId, error: msg })
      res.status(502).json({ error: msg })
    }
  })
})
