import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger } from "../helpers/logger.js"
import { discoverCompetitorBacklinks } from "../methods/competitor-backlinks/discover-competitor-backlinks.js"
import { discoverUnlinkedMentions } from "../methods/unlinked-mentions/discover-unlinked-mentions.js"

const log = createLogger("daily-backlink-discovery")

export async function runDailyBacklinkDiscovery(): Promise<void> {
  log.info("starting")

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, user_id, product_name, product_description, website_url, competitors, profiles!inner(tier, active_trial)")
    .not("competitors", "is", null)

  if (error) {
    log.error("failed to fetch products", { error: error.message })
    return
  }

  const eligible = (products ?? []).filter((p) => {
    if (!Array.isArray(p.competitors) || (p.competitors as string[]).length === 0) return false
    const profile = (p.profiles as unknown as { tier: string; active_trial: boolean }[] | null)?.[0]
    return profile !== undefined && (profile.tier !== "free" || profile.active_trial)
  })

  log.info("products to process", {
    total: (products ?? []).length,
    eligible: eligible.length,
    skipped: (products ?? []).length - eligible.length,
  })

  for (const product of eligible) {
    const { data: settings } = await supabaseAdmin
      .from("backlink_prospects_settings")
      .select("dr_min, dr_max, voice_tone, offering, opportunity_types")
      .eq("product_id", product.id)
      .single()

    const filterSettings = {
      dr_min: settings?.dr_min ?? 0,
      dr_max: settings?.dr_max ?? null,
    }

    const emailSettings = {
      voice_tone: settings?.voice_tone ?? null,
      offering: settings?.offering ?? null,
    }

    const opportunityTypes = settings?.opportunity_types ?? ["competitor_backlink", "unlinked_mention"]

    if (opportunityTypes.includes("competitor_backlink")) {
      try {
        const result = await discoverCompetitorBacklinks(
          { ...product, competitors: product.competitors as string[] },
          filterSettings,
          emailSettings
        )
        log.info("competitor done", { productId: product.id, ...result })
      } catch (err) {
        log.error("competitor failed", { productId: product.id, error: String(err) })
      }
    }

    if (opportunityTypes.includes("unlinked_mention")) {
      try {
        const result = await discoverUnlinkedMentions(product, filterSettings, emailSettings)
        log.info("unlinked mentions done", { productId: product.id, ...result })
      } catch (err) {
        log.error("unlinked mentions failed", { productId: product.id, error: String(err) })
      }
    }
  }

  log.info("complete")
}
