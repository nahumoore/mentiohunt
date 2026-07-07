import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { sendListicleAlertEmail } from "../helpers/emails/send-listicle-alert.js"
import { createLogger } from "../helpers/logger.js"
import { discoverListicleRoundups } from "../methods/listicle-roundup/discover-listicle-roundups.js"
import { assignSequences } from "../processes/onboarding/prospect-sequences.js"

const log = createLogger("listicle-roundup-discovery")

const PRODUCT_CONCURRENCY = 3
const DEFAULT_OPPORTUNITY_TYPES = ["competitor_backlink", "unlinked_mention", "listicle_roundup"]

/**
 * Daily 8am scan for "best X tools" / "top N alternatives" listicles where the
 * product isn't listed yet. Runs for every paid/trial product with the
 * listicle_roundup opportunity type enabled, and emails the user a summary
 * whenever it finds at least one new prospect.
 */
export async function runListicleRoundupDiscovery(): Promise<void> {
  log.info("starting")

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, user_id, product_name, product_description, website_url, competitors, profiles!inner(tier, active_trial)")

  if (error) {
    log.error("failed to fetch products", { error: error.message })
    return
  }

  const eligible = (products ?? []).filter((p) => {
    const profile = (p.profiles as unknown as { tier: string; active_trial: boolean }[] | null)?.[0]
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
        if (!opportunityTypes.includes("listicle_roundup")) return

        const filterSettings = {
          dr_min: settings?.dr_min ?? 0,
          dr_max: settings?.dr_max ?? null,
        }

        const emailSettings = {
          voice_tone: settings?.voice_tone ?? null,
          offering: settings?.offering ?? null,
        }

        try {
          const result = await discoverListicleRoundups(
            { ...product, competitors: (product.competitors as string[] | null) ?? [] },
            filterSettings,
            emailSettings
          )
          log.info("listicle roundup done", { productId: product.id, ...result })

          if (result.prospectsCreated > 0) {
            await assignSequences(product.user_id, product.id)

            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("email, name")
              .eq("id", product.user_id)
              .single()

            if (profile?.email) {
              await sendListicleAlertEmail({
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
          log.error("listicle roundup failed", { productId: product.id, error: String(err) })
        }
      })
    )
  )

  log.info("complete")
}
