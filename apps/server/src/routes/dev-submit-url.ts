import { supabaseAdmin } from "@workspace/supabase/admin"
import { Router, type IRouter } from "express"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { runSubmittedUrlPipeline } from "./prospect-submitted-url.js"

const log = createLogger("route-dev-submit-url")

export const devSubmitUrlRouter: IRouter = Router()

/**
 * Dev-only synchronous exercise of the full submit-url pipeline: inserts the
 * prospect row directly (bypassing the web app's auth/cap/duplicate checks,
 * which are exercised separately at the Next.js route) and awaits the
 * pipeline in-process instead of firing it off with `waitUntil`, so one curl
 * returns the final row + sequences with no UI, internal API key, or Vercel
 * involved.
 */
devSubmitUrlRouter.post("/dev/submit-url", async (req, res) => {
  const body = req.body as Record<string, unknown>
  const productId = typeof body?.productId === "string" ? body.productId.trim() : ""
  const url = typeof body?.url === "string" ? body.url.trim() : ""
  const productPageId = typeof body?.productPageId === "string" ? body.productPageId.trim() : null

  if (!productId || !url) {
    res.status(400).json({ error: "productId and url are required" })
    return
  }

  await withRouteLog(`dev-submit-url-${productId}`, async () => {
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, user_id")
      .eq("id", productId)
      .single()

    if (productError || !product) {
      log.warn("product not found", { productId })
      res.status(404).json({ error: "product not found" })
      return
    }

    let domain: string
    try {
      domain = new URL(url).hostname.replace(/^www\./, "")
    } catch {
      res.status(400).json({ error: "invalid url" })
      return
    }

    const { data: prospect, error: insertError } = await supabaseAdmin
      .from("backlink_prospects")
      .insert({
        product_id: productId,
        product_page_id: productPageId,
        found_url: url,
        domain,
        tier: "user_submitted",
        status: "new",
        enrichment_status: "pending",
        raw_metadata: { user_submitted: { submitted_at: new Date().toISOString(), target_page_mode: productPageId ? "manual" : "auto" } },
      })
      .select("id")
      .single()

    if (insertError || !prospect) {
      log.error("failed to insert dev prospect", { productId, error: insertError?.message })
      res.status(500).json({ error: insertError?.message ?? "insert failed" })
      return
    }

    log.info("running pipeline synchronously", { productId, prospectId: prospect.id })
    await runSubmittedUrlPipeline(product.user_id, productId, prospect.id)

    const [{ data: row }, { data: sequences }] = await Promise.all([
      supabaseAdmin.from("backlink_prospects").select("*").eq("id", prospect.id).single(),
      supabaseAdmin
        .from("prospect_sequences")
        .select("step, subject, body, scheduled_at")
        .eq("prospect_id", prospect.id)
        .order("step", { ascending: true }),
    ])

    res.json({ ok: true, prospect: row, sequences: sequences ?? [] })
  })
})
