/**
 * One-off backfill: regenerate step2/step3 bodies for prospects currently
 * stuck on the hardcoded `buildFollowupBodies` template because daily
 * discovery didn't wire `onProspectCreated` through to `assignSequences`
 * (see daily-backlink-discovery.ts fix). Only touches:
 *   - `prospect_sequences` rows with step in (2, 3) and status = 'pending'
 *   - whose body is byte-for-byte the template text
 *   - belonging to active users (tier != 'free' OR active_trial)
 *
 * Never touches step 1 (already sent for many prospects) or rows that are
 * already 'sent'/'skipped'/'failed'.
 *
 * Usage:
 *   pnpm --filter server exec tsx src/scripts/backfill-followup-bodies.ts --dry-run
 *   pnpm --filter server exec tsx src/scripts/backfill-followup-bodies.ts
 */
import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger } from "../helpers/logger.js"
import { generateOutreachSequence } from "../methods/prospect-generation-methods/shared/generate-outreach-sequence.js"
import { resolveSenderName } from "../methods/prospect-generation-methods/shared/resolve-sender-name.js"
import { buildOutreachContext } from "../routes/prospect-manual-outreach.js"

const log = createLogger("backfill-followup-bodies")

const TEMPLATE_STEP2_MARKER = "Wanted to add one more reason this might be worth a look"
const TEMPLATE_STEP3_MARKER = "Last note from me. If the page is not being updated anymore"

const dryRun = process.argv.includes("--dry-run")

type TemplatedRow = {
  id: string
  step: number
  prospect_id: string
}

/** Flat queries + in-memory join, rather than a nested Supabase embed — avoids
 * depending on FK relationship configuration between prospect_sequences,
 * backlink_prospects, products, and profiles that this script doesn't control. */
async function findTemplatedRowsForActiveUsers(): Promise<Map<string, TemplatedRow[]>> {
  const { data: rows, error } = await supabaseAdmin
    .from("prospect_sequences")
    .select("id, step, prospect_id, body")
    .in("step", [2, 3])
    .eq("status", "pending")

  if (error) {
    throw new Error(`failed to load prospect_sequences: ${error.message}`)
  }

  const templated = (rows ?? []).filter((row) => {
    const body = row.body ?? ""
    return (
      (row.step === 2 && body.includes(TEMPLATE_STEP2_MARKER)) ||
      (row.step === 3 && body.includes(TEMPLATE_STEP3_MARKER))
    )
  })
  if (templated.length === 0) return new Map()

  const prospectIds = [...new Set(templated.map((r) => r.prospect_id))]
  const { data: prospects, error: prospectsError } = await supabaseAdmin
    .from("backlink_prospects")
    .select("id, product_id")
    .in("id", prospectIds)
  if (prospectsError) throw new Error(`failed to load backlink_prospects: ${prospectsError.message}`)
  const productIdByProspect = new Map((prospects ?? []).map((p) => [p.id, p.product_id]))

  const productIds = [...new Set([...productIdByProspect.values()])]
  const { data: products, error: productsError } = await supabaseAdmin
    .from("products")
    .select("id, user_id")
    .in("id", productIds)
  if (productsError) throw new Error(`failed to load products: ${productsError.message}`)
  const userIdByProduct = new Map((products ?? []).map((p) => [p.id, p.user_id]))

  const userIds = [...new Set([...userIdByProduct.values()])]
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, tier, active_trial")
    .in("id", userIds)
  if (profilesError) throw new Error(`failed to load profiles: ${profilesError.message}`)
  const activeByUser = new Map(
    (profiles ?? []).map((p) => [p.id, p.tier !== "free" || p.active_trial])
  )

  const byProspect = new Map<string, TemplatedRow[]>()
  for (const row of templated) {
    const productId = productIdByProspect.get(row.prospect_id)
    const userId = productId ? userIdByProduct.get(productId) : undefined
    const active = userId ? (activeByUser.get(userId) ?? false) : false
    if (!active) continue

    const list = byProspect.get(row.prospect_id) ?? []
    list.push({ id: row.id, step: row.step, prospect_id: row.prospect_id })
    byProspect.set(row.prospect_id, list)
  }
  return byProspect
}

async function backfillProspect(prospectId: string, rows: TemplatedRow[]): Promise<void> {
  const { data: prospect, error: prospectError } = await supabaseAdmin
    .from("backlink_prospects")
    .select(
      "id, product_id, tier, domain, target_url, found_url, contact_name, raw_metadata"
    )
    .eq("id", prospectId)
    .single()

  if (prospectError || !prospect) {
    log.warn("prospect not found, skipping", { prospectId, error: prospectError?.message })
    return
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, user_id, product_name, product_description, website_url")
    .eq("id", prospect.product_id)
    .single()

  if (productError || !product) {
    log.warn("product not found, skipping", { prospectId, error: productError?.message })
    return
  }

  const { data: settings } = await supabaseAdmin
    .from("backlink_prospects_settings")
    .select("voice_tone, offering")
    .eq("product_id", product.id)
    .maybeSingle()

  const sender = await resolveSenderName(product.user_id)
  const context = buildOutreachContext(
    prospect as {
      tier:
        | "competitor_backlink"
        | "unlinked_mention"
        | "listicle_roundup"
        | "resource_page_inclusion"
        | "user_submitted"
      domain: string | null
      target_url: string | null
      found_url: string | null
      raw_metadata: unknown
    }
  )

  const result = await generateOutreachSequence(product, context, {
    contactName: prospect.contact_name,
    senderName: sender.name,
    isPublicAccount: sender.isPublicAccount,
    voiceTone: settings?.voice_tone ?? null,
    offering: settings?.offering ?? null,
    authorBio: null,
  })

  if (!result) {
    log.warn("regeneration failed, leaving template in place", { prospectId })
    return
  }

  if (dryRun) {
    log.info("dry-run: would update", {
      prospectId,
      step2Preview: result.step2Body.slice(0, 80),
      step3Preview: result.step3Body.slice(0, 80),
    })
    return
  }

  for (const row of rows) {
    const body = row.step === 2 ? result.step2Body : result.step3Body
    const { error } = await supabaseAdmin.from("prospect_sequences").update({ body }).eq("id", row.id)
    if (error) {
      log.error("failed to update sequence row", { prospectId, rowId: row.id, error: error.message })
    }
  }

  log.success("backfilled", { prospectId })
}

async function main() {
  const byProspect = await findTemplatedRowsForActiveUsers()
  log.info(dryRun ? "dry-run start" : "backfill start", {
    prospects: byProspect.size,
    rows: [...byProspect.values()].reduce((n, r) => n + r.length, 0),
  })

  for (const [prospectId, rows] of byProspect) {
    await backfillProspect(prospectId, rows)
  }

  log.success(dryRun ? "dry-run done" : "backfill done", { prospects: byProspect.size })
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    log.error("backfill script failed", { error: String(err) })
    process.exit(1)
  })
