import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { sendMediaMentionsDigestEmail } from "../helpers/emails/send-media-mentions-digest.js"
import { createLogger } from "../helpers/logger.js"
import { discoverMentionsForProduct } from "../methods/media-mentions/discover-mentions-for-product.js"

const log = createLogger("job-run-reply-queue")

export async function runReplyQueue(): Promise<void> {
  log.info("job started")
  try {
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("active_trial", true)
      .not("email", "is", null)

    if (profilesError || !profiles || profiles.length === 0) {
      log.info("no active profiles")
      return
    }

    const userIds = profiles.map((p) => p.id)

    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, user_id, product_name, product_description, website_url, competitors")
      .in("user_id", userIds)

    if (productsError || !products || products.length === 0) {
      log.info("no products found")
      return
    }

    log.info("processing products", { count: products.length })

    const limit = pLimit(3)
    const countByUserId = new Map<string, number>()
    let totalProspects = 0
    let totalCostUsd = 0

    await Promise.all(
      products.map((product) =>
        limit(async () => {
          try {
            const result = await discoverMentionsForProduct(product)
            totalProspects += result.prospectsCreated
            totalCostUsd += result.totalCostUsd
            log.info("product done", {
              productId: product.id,
              product_name: product.product_name,
              prospectsCreated: result.prospectsCreated,
              cost_usd: result.totalCostUsd.toFixed(4),
            })
            if (result.prospectsCreated > 0) {
              countByUserId.set(
                product.user_id,
                (countByUserId.get(product.user_id) ?? 0) + result.prospectsCreated
              )
            }
          } catch (err) {
            log.error("product discovery failed", {
              productId: product.id,
              product_name: product.product_name,
              error: String(err),
            })
          }
        })
      )
    )

    log.info("all products processed", {
      products: products.length,
      totalProspects,
      total_cost_usd: totalCostUsd.toFixed(4),
    })

    const profilesToNotify = profiles.filter((p) => (countByUserId.get(p.id) ?? 0) > 0)
    log.info("sending digests", { users: profilesToNotify.length })

    await Promise.allSettled(
      profilesToNotify.map((profile) => {
        const count = countByUserId.get(profile.id)!
        return sendMediaMentionsDigestEmail({
          to: profile.email!,
          userId: profile.id,
          inserted: count,
          bySource: {},
        })
      })
    )
  } catch (err) {
    log.error("job failed", { error: String(err) })
  }
}
