import { supabaseAdmin } from "@workspace/supabase/admin"
import { Router, type IRouter } from "express"
import { sendResourcePageInclusionAlertEmail } from "../helpers/emails/send-resource-page-inclusion-alert.js"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { discoverResourcePageInclusions } from "../methods/prospect-generation-methods/resource-page-inclusion/index.js"

const log = createLogger("route-dev-run-daily-backlink-discovery")

export const devRunDailyBacklinkDiscoveryRouter: IRouter = Router()

const DEFAULT_OPPORTUNITY_TYPES = ["resource_page_inclusion"]

devRunDailyBacklinkDiscoveryRouter.post("/dev/run-daily-backlink-discovery", async (req, res) => {
  const { productId, skipEligibilityCheck } = req.body as { productId?: string; skipEligibilityCheck?: boolean }

  if (!productId) {
    res.status(400).json({ error: "productId required" })
    return
  }

  await withRouteLog(`dev-run-daily-backlink-discovery-${productId}`, async () => {
    log.info("starting", { productId, skipEligibilityCheck: !!skipEligibilityCheck })

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, user_id, product_name, product_description, website_url")
      .eq("id", productId)
      .single()

    if (productError || !product) {
      log.warn("product not found", { productId, error: productError?.message })
      res.status(404).json({ error: "product not found" })
      return
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email, name, tier, active_trial")
      .eq("id", product.user_id)
      .single()

    if (profileError || !profile) {
      log.warn("profile not found", { productId, userId: product.user_id, error: profileError?.message })
      res.status(404).json({ error: "profile not found for product owner" })
      return
    }

    const eligible = profile.tier !== "free" || profile.active_trial

    if (!eligible && !skipEligibilityCheck) {
      log.warn("product not eligible (inactive/free)", { productId })
      res.status(422).json({ error: "product not eligible: not a paid or active-trial user" })
      return
    }

    const { data: settings } = await supabaseAdmin
      .from("backlink_prospects_settings")
      .select("dr_min, dr_max, voice_tone, offering, opportunity_types")
      .eq("product_id", productId)
      .single()

    const opportunityTypes = settings?.opportunity_types ?? DEFAULT_OPPORTUNITY_TYPES
    if (!opportunityTypes.includes("resource_page_inclusion")) {
      res.json({ ok: true, productId, skipped: "resource_page_inclusion not enabled for this product" })
      return
    }

    const filterSettings = {
      dr_min: settings?.dr_min ?? 0,
      dr_max: settings?.dr_max ?? null,
    }

    const emailSettings = {
      voice_tone: settings?.voice_tone ?? null,
      offering: settings?.offering ?? null,
    }

    try {
      const result = await discoverResourcePageInclusions(product, filterSettings, emailSettings)
      log.info("done", { productId, ...result })

      let emailSent = false
      if (result.prospectsCreated > 0) {
        if (profile.email) {
          await sendResourcePageInclusionAlertEmail({
            to: profile.email,
            userId: product.user_id,
            userName: profile.name,
            productName: product.product_name,
            prospectsCreated: result.prospectsCreated,
          })
          emailSent = true
        } else {
          log.warn("no profile email, skipping alert", { productId, userId: product.user_id })
        }
      }

      res.json({ ok: true, productId, product_name: product.product_name, emailSent, ...result })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error("failed", { productId, error: msg })
      res.status(502).json({ error: msg })
    }
  })
})
