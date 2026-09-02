import { supabaseAdmin } from "@workspace/supabase/admin"
import { Router, type IRouter } from "express"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import {
  runDiscoveryForProduct,
  type DiscoveryProduct,
} from "../jobs/daily-backlink-discovery.js"

const log = createLogger("route-dev-run-daily-backlink-discovery")

export const devRunDailyBacklinkDiscoveryRouter: IRouter = Router()

devRunDailyBacklinkDiscoveryRouter.post(
  "/dev/run-daily-backlink-discovery",
  async (req, res) => {
    const { productId, skipEligibilityCheck } = req.body as {
      productId?: string
      skipEligibilityCheck?: boolean
    }

    if (!productId) {
      res.status(400).json({ error: "productId required" })
      return
    }

    await withRouteLog(
      `dev-run-daily-backlink-discovery-${productId}`,
      async () => {
        log.info("starting", {
          productId,
          skipEligibilityCheck: !!skipEligibilityCheck,
        })

        const { data: product, error: productError } = await supabaseAdmin
          .from("products")
          .select(
            "id, user_id, product_name, product_description, website_url, competitors, target_keywords"
          )
          .eq("id", productId)
          .single()

        if (productError || !product) {
          log.warn("product not found", {
            productId,
            error: productError?.message,
          })
          res.status(404).json({ error: "product not found" })
          return
        }

        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("email, name, tier, active_trial, onboarding_completed")
          .eq("id", product.user_id)
          .single()

        if (profileError || !profile) {
          log.warn("profile not found", {
            productId,
            userId: product.user_id,
            error: profileError?.message,
          })
          res.status(404).json({ error: "profile not found for product owner" })
          return
        }

        const eligible =
          profile.onboarding_completed &&
          (profile.tier !== "free" || profile.active_trial)

        if (!eligible && !skipEligibilityCheck) {
          log.warn("product not eligible (inactive/free)", { productId })
          res
            .status(422)
            .json({
              error: "product not eligible: not a paid or active-trial user",
            })
          return
        }

        const discoveryProduct: DiscoveryProduct = {
          ...product,
          competitors: (product.competitors as string[] | null) ?? null,
          target_keywords: (product.target_keywords as string[] | null) ?? null,
        }

        try {
          const result = await runDiscoveryForProduct(discoveryProduct, profile)
          log.info("done", { productId, ...result })
          res.json({
            ok: true,
            productId,
            product_name: product.product_name,
            ...result,
          })
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          log.error("failed", { productId, error: msg })
          res.status(502).json({ error: msg })
        }
      }
    )
  }
)
