import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { createLogger } from "../helpers/logger.js"
import { checkProductDirectoryOpportunities } from "../methods/directories/check-product-directories.js"

const log = createLogger("weekly-directory-check")

export async function runWeeklyDirectoryCheck(): Promise<void> {
  log.info("starting weekly directory submission check")

  const { data: settings, error } = await supabaseAdmin
    .from("product_backlink_discovery_settings")
    .select("product_id")

  if (error) throw new Error(`Failed to load product settings: ${error.message}`)
  if (!settings || settings.length === 0) {
    log.info("no products with directory type enabled, skipping")
    return
  }

  const productIds = settings.map((s) => s.product_id)
  log.info(`checking ${productIds.length} products`)

  const limit = pLimit(3)
  const results = await Promise.allSettled(
    productIds.map((productId) =>
      limit(() => checkProductDirectoryOpportunities(productId))
    )
  )

  let succeeded = 0
  let failed = 0
  for (const result of results) {
    if (result.status === "fulfilled") {
      succeeded++
    } else {
      failed++
      log.warn("product check failed", { error: String(result.reason) })
    }
  }

  log.success(`weekly check complete`, { succeeded, failed, total: productIds.length })
}
