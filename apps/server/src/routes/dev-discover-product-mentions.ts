import { supabaseAdmin } from "@workspace/supabase/admin"
import { Router, type IRouter } from "express"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { discoverMentionsForProduct } from "../methods/media-mentions/discover-mentions-for-product.js"

const log = createLogger("route-dev-discover-product-mentions")

export const devDiscoverProductMentionsRouter: IRouter = Router()

devDiscoverProductMentionsRouter.post("/dev/discover-product-mentions", async (req, res) => {
  const { productId } = req.body as { productId?: string }

  if (!productId) {
    res.status(400).json({ error: "productId required" })
    return
  }

  await withRouteLog(`dev-discover-product-mentions-${productId}`, async () => {
    log.info("starting", { productId })

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select("id, user_id, product_name, product_description, website_url, competitors")
      .eq("id", productId)
      .single()

    if (error || !product) {
      log.warn("product not found", { productId })
      res.status(404).json({ error: "product not found" })
      return
    }

    log.info("product loaded", { productId, product_name: product.product_name })

    try {
      const result = await discoverMentionsForProduct(product)
      log.info("done", { productId, ...result })
      res.json({ ok: true, productId, product_name: product.product_name, ...result })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error("failed", { productId, error: msg })
      res.status(502).json({ error: msg })
    }
  })
})
