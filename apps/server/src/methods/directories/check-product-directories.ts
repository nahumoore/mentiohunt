import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { createLogger } from "../../helpers/logger.js"
import { headCheck } from "./head-check.js"
import { serpCheck } from "./serp-check.js"
import { toSlug } from "./slug.js"

const log = createLogger("directory-opportunities-check")

export type DirectoryOpportunitiesCheckResult = {
  productId: string
  checked: number
  listed: number
  gaps: number
  errors: number
  prospectsCreated: number
}

export async function checkProductDirectoryOpportunities(
  productId: string
): Promise<DirectoryOpportunitiesCheckResult> {
  // Step 1: Load the product we are checking directory opportunities for.
  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, product_name, website_url")
    .eq("id", productId)
    .single()

  if (productError || !product) {
    throw new Error(`Product not found: ${productId}`)
  }

  // Step 2: Ensure the product has a name we can use to derive listing URLs and SERP queries.
  if (!product.product_name) {
    throw new Error(`Product ${productId} has no product_name set`)
  }

  // Step 3: Load backlink discovery settings to confirm directory opportunities are enabled.
  const { data: settings } = await supabaseAdmin
    .from("product_backlink_discovery_settings")
    .select("opportunity_types")
    .eq("product_id", productId)
    .single()

  if (settings && !settings.opportunity_types.includes("directory")) {
    log.info("directory type not enabled for product, skipping", { productId })
    return {
      productId,
      checked: 0,
      listed: 0,
      gaps: 0,
      errors: 0,
      prospectsCreated: 0,
    }
  }

  // Step 4: Load every active directory that should be checked for this product.
  const { data: directories, error: dirError } = await supabaseAdmin
    .from("directories")
    .select("id, domain, submit_url, slug_pattern, check_method")
    .eq("is_active", true)

  if (dirError)
    throw new Error(`Failed to load directories: ${dirError.message}`)
  if (!directories || directories.length === 0) {
    log.warn("no active directories found")
    return {
      productId,
      checked: 0,
      listed: 0,
      gaps: 0,
      errors: 0,
      prospectsCreated: 0,
    }
  }

  const slug = toSlug(product.product_name)
  log.info(`checking ${directories.length} directories`, { productId, slug })

  // Step 5: Limit concurrent checks so we do not fan out too aggressively.
  const limit = pLimit(8)

  // Step 6: Check each directory — head_check first when configured, serp_check as fallback.
  const results = await Promise.all(
    directories.map((dir) =>
      limit(async () => {
        const startedAt = Date.now()

        log.info("directory check started", {
          productId,
          directoryId: dir.id,
          domain: dir.domain,
          method: dir.check_method,
          submitUrl: dir.submit_url,
        })

        try {
          let result = dir.check_method === "head_check"
            ? await headCheck(dir, slug)
            : await serpCheck(dir, product.product_name)

          if (result.status === "error" && dir.check_method === "head_check") {
            log.info("head_check blocked, falling back to serp_check", {
              productId,
              directoryId: dir.id,
              domain: dir.domain,
              reason: result.reason,
            })
            result = await serpCheck(dir, product.product_name)
          }

          log.info("directory check finished", {
            productId,
            directoryId: dir.id,
            domain: dir.domain,
            status: result.status,
            resultUrl: result.url,
            reason: result.reason,
            durationMs: Date.now() - startedAt,
          })

          return { dir, result }
        } catch (err) {
          log.error("directory check threw unexpectedly", {
            productId,
            directoryId: dir.id,
            domain: dir.domain,
            submitUrl: dir.submit_url,
            err: String(err),
            durationMs: Date.now() - startedAt,
          })

          return {
            dir,
            result: {
              status: "error" as const,
              url: dir.submit_url,
              reason: String(err),
            },
          }
        }
      })
    )
  )

  // Step 8: Summarize check results into listed, gap, and error counts.
  const listed = results.filter((r) => r.result.status === "listed").length
  const gaps = results.filter((r) => r.result.status === "gap")
  const errors = results.filter((r) => r.result.status === "error").length

  let prospectsCreated = 0

  // Step 9: Create backlink prospects for directory gaps, ignoring duplicates from earlier runs.
  if (gaps.length > 0) {
    const rows = gaps.map(({ dir }) => ({
      product_id: productId,
      directory_id: dir.id,
      domain: dir.domain,
      target_url: dir.submit_url,
      tier: "directory" as const,
      action_type: "self_service" as const,
      status: "new" as const,
      notes: null as string | null,
    }))

    const { error: upsertError, count } = await supabaseAdmin
      .from("backlink_prospects")
      .upsert(rows, { ignoreDuplicates: true, count: "exact" })

    if (upsertError)
      throw new Error(`Failed to upsert prospects: ${upsertError.message}`)
    prospectsCreated = count ?? 0
  }

  // Step 10: Log and return the final listing-check summary.
  log.success(`done`, { listed, gaps: gaps.length, errors, prospectsCreated })

  return {
    productId,
    checked: directories.length,
    listed,
    gaps: gaps.length,
    errors,
    prospectsCreated,
  }
}
