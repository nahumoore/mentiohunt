import { supabaseAdmin } from "@workspace/supabase/admin"
import { Router, type IRouter } from "express"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { discoverCompetitorBacklinks } from "../methods/competitor-backlinks/discover-competitor-backlinks.js"

const log = createLogger("route-dev-discover-competitor-backlinks")

export const devDiscoverCompetitorBacklinksRouter: IRouter = Router()

devDiscoverCompetitorBacklinksRouter.post("/dev/discover-competitor-backlinks", async (req, res) => {
  const { productId } = req.body as { productId?: string }

  if (!productId) {
    res.status(400).json({ error: "productId required" })
    return
  }

  await withRouteLog(`dev-discover-competitor-backlinks-${productId}`, async () => {
    log.info("starting", { productId })

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, user_id, product_name, product_description, website_url, competitors")
      .eq("id", productId)
      .single()

    if (productError || !product) {
      log.warn("product not found", { productId })
      res.status(404).json({ error: "product not found" })
      return
    }

    const { data: settings } = await supabaseAdmin
      .from("backlink_prospects_settings")
      .select("dr_min, dr_max, voice_tone, offering")
      .eq("product_id", productId)
      .single()

    const filterSettings = {
      dr_min: settings?.dr_min ?? 0,
      dr_max: settings?.dr_max ?? null,
    }

    const emailSettings = {
      voice_tone: settings?.voice_tone ?? null,
      offering: settings?.offering ?? null,
    }

    log.info("product loaded", {
      productId,
      product_name: product.product_name,
      competitors: product.competitors?.length ?? 0,
      dr_min: filterSettings.dr_min,
      dr_max: filterSettings.dr_max,
    })

    try {
      const result = await discoverCompetitorBacklinks(product, filterSettings, emailSettings)
      log.info("done", { productId, ...result })
      res.json({ ok: true, productId, product_name: product.product_name, ...result })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error("failed", { productId, error: msg })
      res.status(502).json({ error: msg })
    }
  })
})
