import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { sendResourcePageInclusionAlertEmail } from "../helpers/emails/send-resource-page-inclusion-alert.js"
import { createLogger } from "../helpers/logger.js"
import { discoverResourcePageInclusions } from "../methods/prospect-generation-methods/resource-page-inclusion/index.js"

const log = createLogger("daily-backlink-discovery")

const PRODUCT_CONCURRENCY = 3
const DEFAULT_OPPORTUNITY_TYPES = ["resource_page_inclusion"]

/**
 * Daily scan for resource page inclusion opportunities — curated resource
 * pages where one of the product's existing pages would fit. Runs for every
 * paid/trial product with the resource_page_inclusion opportunity type
 * enabled, and emails the user a summary whenever it finds at least one new
 * prospect.
 */
export async function runDailyBacklinkDiscovery(): Promise<void> {
  log.info("starting")

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, user_id, product_name, product_description, website_url")

  if (error) {
    log.error("failed to fetch products", { error: error.message })
    return
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, email, name, tier, active_trial")
    .in("id", [...new Set((products ?? []).map((p) => p.user_id))])

  if (profilesError) {
    log.error("failed to fetch profiles", { error: profilesError.message })
    return
  }

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

  const eligible = (products ?? []).filter((p) => {
    const profile = profileById.get(p.user_id)
    return profile !== undefined && (profile.tier !== "free" || profile.active_trial)
  })

  log.info("products to process", {
    total: (products ?? []).length,
    eligible: eligible.length,
    skipped: (products ?? []).length - eligible.length,
  })

  const productLimit = pLimit(PRODUCT_CONCURRENCY)
  await Promise.allSettled(
    eligible.map((product) =>
      productLimit(async () => {
        const { data: settings } = await supabaseAdmin
          .from("backlink_prospects_settings")
          .select("dr_min, dr_max, voice_tone, offering, opportunity_types")
          .eq("product_id", product.id)
          .single()

        const opportunityTypes = settings?.opportunity_types ?? DEFAULT_OPPORTUNITY_TYPES
        if (!opportunityTypes.includes("resource_page_inclusion")) return

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
          log.info("resource page inclusions done", { productId: product.id, ...result })

          if (result.prospectsCreated > 0) {
            const profile = profileById.get(product.user_id)

            if (profile?.email) {
              await sendResourcePageInclusionAlertEmail({
                to: profile.email,
                userId: product.user_id,
                userName: profile.name,
                productName: product.product_name,
                prospectsCreated: result.prospectsCreated,
              })
            } else {
              log.warn("no profile email, skipping alert", { productId: product.id, userId: product.user_id })
            }
          }
        } catch (err) {
          log.error("resource page inclusions failed", { productId: product.id, error: String(err) })
        }
      })
    )
  )

  log.info("complete")
}
