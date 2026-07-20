import "../env.js"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { sendCompetitorBacklinkAlertEmail } from "../helpers/emails/send-competitor-backlink-alert.js"
import { discoverCompetitorBacklinks } from "../methods/prospect-generation-methods/competitor-backlink/index.js"
import { assignSequences } from "../processes/onboarding/prospect-sequences.js"

const PRODUCT_IDS = [
  "40fc8fa6-753c-4f5c-bc2f-b5e19d116007", // liam@identifywebdesign.co.uk
  "b7f5faaf-72e3-4cc9-ac78-5b991a361453", // alen@walletwallet.dev
]

async function main() {
  for (const productId of PRODUCT_IDS) {
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, user_id, product_name, product_description, website_url, competitors")
      .eq("id", productId)
      .single()

    if (productError || !product) {
      console.error(`[${productId}] failed to load product`, productError)
      continue
    }

    const { data: settings } = await supabaseAdmin
      .from("backlink_prospects_settings")
      .select("dr_min, dr_max, voice_tone, offering")
      .eq("product_id", productId)
      .single()

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, name")
      .eq("id", product.user_id)
      .single()

    const filterSettings = { dr_min: settings?.dr_min ?? 0, dr_max: settings?.dr_max ?? null }
    const emailSettings = { voice_tone: settings?.voice_tone ?? null, offering: settings?.offering ?? null }

    console.log(`[${productId}] rerunning competitor_backlink for ${product.product_name}`)

    const result = await discoverCompetitorBacklinks(
      { ...product, competitors: product.competitors ?? [] },
      filterSettings,
      emailSettings
    )

    console.log(`[${productId}] done`, result)

    if (result.prospectsCreated > 0) {
      await assignSequences(product.user_id, product.id)

      if (profile?.email) {
        await sendCompetitorBacklinkAlertEmail({
          to: profile.email,
          userId: product.user_id,
          userName: profile.name,
          productName: product.product_name,
          prospectsCreated: result.prospectsCreated,
        })
        console.log(`[${productId}] alert email sent to ${profile.email}`)
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("script failed", err)
    process.exit(1)
  })
