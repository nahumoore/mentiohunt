import { supabaseAdmin } from "@workspace/supabase/admin"
import { Router, type IRouter } from "express"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { enrichContact } from "../methods/prospect-generation-methods/competitor-backlink/enrich-contact.js"
import { discoverUnlinkedMentions } from "../methods/prospect-generation-methods/unlinked-mention/index.js"
import { extractDomainFromUrl } from "../methods/prospect-generation-methods/shared/url-filters.js"

const log = createLogger("route-dev-discover-unlinked-mentions")

export const devDiscoverUnlinkedMentionsRouter: IRouter = Router()

devDiscoverUnlinkedMentionsRouter.post("/dev/discover-unlinked-mentions", async (req, res) => {
  const { productId, targetUrls } = req.body as { productId?: string; targetUrls?: string[] }

  if (!productId) {
    res.status(400).json({ error: "productId required" })
    return
  }

  await withRouteLog(`dev-discover-unlinked-mentions-${productId}`, async () => {
    log.info("starting", { productId, mode: targetUrls?.length ? "enrich-only" : "full-discovery" })

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, user_id, product_name, product_description, website_url, target_keywords")
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

    const emailSettings = {
      voice_tone: settings?.voice_tone ?? null,
      offering: settings?.offering ?? null,
    }

    if (targetUrls && targetUrls.length > 0) {
      log.info("enrich-only mode", { productId, urlCount: targetUrls.length })

      try {
        const results = await Promise.all(
          targetUrls.map(async (url) => {
            const domain = extractDomainFromUrl(url)
            log.info("enriching", { url, domain })

            const contact = await enrichContact(url, "brand-mention", domain)

            if (!contact.email) {
              log.info("no email found", { url, domain, confidence: contact.confidence })
            }

            return { url, domain, contact }
          })
        )

        log.info("done", { productId, urlCount: targetUrls.length })
        res.json({ ok: true, productId, product_name: product.product_name, results })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        log.error("enrich-only failed", { productId, error: msg })
        res.status(502).json({ error: msg })
      }
      return
    }

    const filterSettings = {
      dr_min: settings?.dr_min ?? 0,
      dr_max: settings?.dr_max ?? null,
    }

    log.info("product loaded", {
      productId,
      product_name: product.product_name,
      dr_min: filterSettings.dr_min,
      dr_max: filterSettings.dr_max,
    })

    try {
      const result = await discoverUnlinkedMentions(product, filterSettings, emailSettings)
      log.info("done", { productId, ...result })
      res.json({ ok: true, productId, product_name: product.product_name, ...result })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error("failed", { productId, error: msg })
      res.status(502).json({ error: msg })
    }
  })
})
