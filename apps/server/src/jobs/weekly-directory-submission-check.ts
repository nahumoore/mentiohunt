import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { sendDirectoryWeeklyDigestEmail } from "../helpers/emails/email.js"
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

  const allProductIds = settings.map((s) => s.product_id)

  const { data: products, error: productsError } = await supabaseAdmin
    .from("products")
    .select("id, product_name, user_id")
    .in("id", allProductIds)

  if (productsError || !products || products.length === 0) {
    log.warn("could not load products", { error: productsError?.message })
    return
  }

  const userIds = [...new Set(products.map((p) => p.user_id))]

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, email, name, active_trial")
    .in("id", userIds)
    .eq("active_trial", true)

  if (profilesError) {
    log.warn("could not load profiles", { error: profilesError.message })
    return
  }

  const activeUserIds = new Set((profiles ?? []).map((p) => p.id))
  const activeProductIds = products
    .filter((p) => activeUserIds.has(p.user_id))
    .map((p) => p.id)

  if (activeProductIds.length === 0) {
    log.info("no active users with directory settings, skipping")
    return
  }

  log.info(`checking ${activeProductIds.length}/${allProductIds.length} products (active users only)`)

  const limit = pLimit(3)
  const results = await Promise.allSettled(
    activeProductIds.map((productId) =>
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

  log.success(`weekly check complete`, { succeeded, failed, total: activeProductIds.length })

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))
  const productById = new Map(products.map((p) => [p.id, p]))

  const fulfilledResults = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<typeof r extends PromiseFulfilledResult<infer V> ? V : never>).value)

  await Promise.allSettled(
    fulfilledResults
      .filter((r) => r.gaps > 0 || r.newRows > 0)
      .map((r) => {
        const product = productById.get(r.productId)
        if (!product?.product_name) return Promise.resolve()
        const profile = profileById.get(product.user_id)
        if (!profile?.email) return Promise.resolve()

        return sendDirectoryWeeklyDigestEmail({
          to: profile.email,
          userId: profile.id,
          userName: profile.name,
          productName: product.product_name,
          checked: r.checked,
          indexed: r.indexed,
          gaps: r.gaps,
          errors: r.errors,
          newRows: r.newRows,
          totalActiveDirectories: r.totalActiveDirectories,
        })
      })
  )
}
