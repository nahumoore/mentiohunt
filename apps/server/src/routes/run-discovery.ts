import { Router, type IRouter } from "express"
import { timingSafeEqual } from "node:crypto"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import {
  runDiscoveryForProduct,
  type DiscoveryProduct,
} from "../jobs/daily-backlink-discovery.js"

const log = createLogger("route-run-discovery")

export const runDiscoveryRouter: IRouter = Router()

// Rotation runs one strategy per call (see selectStrategyForRun in
// daily-backlink-discovery.ts) — capped rather than looped indefinitely so a
// product with no runnable strategies can't spin this forever.
const MAX_ROTATION_ATTEMPTS = 5

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

function readBodyString(body: unknown, key: string): string {
  if (body === null || typeof body !== "object") return ""
  const value = (body as Record<string, unknown>)[key]
  return typeof value === "string" ? value.trim() : ""
}

/**
 * Manually triggers the discovery rotation for one product — same code path
 * as the daily cron (runDiscoveryForProduct), not the onboarding pipeline
 * (no page re-crawl, no re-sending the onboarding-complete email). Meant for
 * re-testing a product after fixing an infra issue that broke a prior run,
 * without waiting for the next scheduled cron tick.
 */
runDiscoveryRouter.post("/internal/run-discovery", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const productId = readBodyString(req.body, "productId")
  if (!productId) {
    res.status(400).json({ error: "productId required" })
    return
  }

  const body = req.body !== null && typeof req.body === "object" ? (req.body as Record<string, unknown>) : {}
  const skipEligibilityCheck = body["skipEligibilityCheck"] === true
  const maxAttempts = Number(body["maxAttempts"])
  const attempts = Number.isFinite(maxAttempts) && maxAttempts > 0
    ? Math.min(maxAttempts, MAX_ROTATION_ATTEMPTS)
    : MAX_ROTATION_ATTEMPTS

  await withRouteLog(`run-discovery-${productId}`, async () => {
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, user_id, product_name, product_description, website_url, competitors, target_keywords")
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

    const discoveryProduct: DiscoveryProduct = {
      ...product,
      competitors: (product.competitors as string[] | null) ?? null,
      target_keywords: (product.target_keywords as string[] | null) ?? null,
    }

    const runs: Awaited<ReturnType<typeof runDiscoveryForProduct>>[] = []
    try {
      for (let i = 0; i < attempts; i++) {
        const result = await runDiscoveryForProduct(discoveryProduct, profile)
        runs.push(result)
        log.info("rotation attempt done", { productId, attempt: i + 1, ...result })
        // No runnable strategy left (or none enabled) — further attempts would repeat the same no-op.
        if (!result.strategy) break
      }

      res.json({
        ok: true,
        productId,
        product_name: product.product_name,
        attempts: runs.length,
        totalProspectsCreated: runs.reduce((sum, r) => sum + r.prospectsCreated, 0),
        totalCostUsd: runs.reduce((sum, r) => sum + r.totalCostUsd, 0),
        runs,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error("failed", { productId, error: msg })
      res.status(502).json({ error: msg, runs })
    }
  })
})
