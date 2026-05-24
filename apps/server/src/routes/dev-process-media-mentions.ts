import { Router, type IRouter } from "express"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { processMediaMentionsForProduct } from "../methods/media-mentions/process-media-mentions-for-product.js"

const log = createLogger("route-dev-process-media-mentions")

export const devProcessMediaMentionsRouter: IRouter = Router()

devProcessMediaMentionsRouter.post("/dev-process-media-mentions", async (req, res) => {
  const { productId, userId } = req.body as { productId?: string; userId?: string }

  if (!productId || !userId) {
    log.warn("missing required fields", { productId, userId })
    res.status(400).json({ error: "productId and userId required" })
    return
  }

  log.info("starting", { productId, userId })

  try {
    await withRouteLog("dev-process-media-mentions", () =>
      processMediaMentionsForProduct(productId, userId)
    )
    log.info("done", { productId, userId })
    res.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.error("failed", { productId, userId, error: msg })
    res.status(502).json({ error: msg })
  }
})
