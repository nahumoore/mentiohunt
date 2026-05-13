import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { createLogger } from "../../helpers/logger.js"
import { headCheck } from "./head-check.js"
import { SERP_BATCH_SIZE, serpBatchCheck } from "./serp-check.js"
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

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export async function checkProductDirectoryOpportunities(
  productId: string
): Promise<DirectoryOpportunitiesCheckResult> {
  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, product_name, website_url")
    .eq("id", productId)
    .single()

  if (productError || !product) {
    throw new Error(`Product not found: ${productId}`)
  }

  if (!product.product_name) {
    throw new Error(`Product ${productId} has no product_name set`)
  }

  const { data: settings } = await supabaseAdmin
    .from("product_backlink_discovery_settings")
    .select("opportunity_types")
    .eq("product_id", productId)
    .single()

  if (settings && !settings.opportunity_types.includes("directory")) {
    log.info("directory type not enabled for product, skipping", { productId })
    return { productId, checked: 0, listed: 0, gaps: 0, errors: 0, prospectsCreated: 0 }
  }

  const { data: directories, error: dirError } = await supabaseAdmin
    .from("directories")
    .select("id, domain, submit_url, slug_pattern, check_method")
    .eq("is_active", true)

  if (dirError) throw new Error(`Failed to load directories: ${dirError.message}`)
  if (!directories || directories.length === 0) {
    log.warn("no active directories found")
    return { productId, checked: 0, listed: 0, gaps: 0, errors: 0, prospectsCreated: 0 }
  }

  const slug = toSlug(product.product_name)
  log.info(`checking ${directories.length} directories`, { productId, slug })

  // Phase 1: head_check directories concurrently
  const headDirs = directories.filter((d) => d.check_method === "head_check")
  const serpOnlyDirs = directories.filter((d) => d.check_method !== "head_check")

  const headLimit = pLimit(8)
  const headResults = await Promise.all(
    headDirs.map((dir) =>
      headLimit(async () => {
        try {
          const result = await headCheck(dir, slug)
          log.info("head_check finished", { productId, domain: dir.domain, status: result.status, reason: result.reason })
          return { dir, result }
        } catch (err) {
          return { dir, result: { status: "error" as const, url: dir.submit_url, reason: String(err) } }
        }
      })
    )
  )

  // Phase 2: batch SERP for serp-only dirs + head_check fallbacks
  const headFallbackDirs = headResults.filter((r) => r.result.status === "error").map((r) => r.dir)
  const headSuccess = headResults.filter((r) => r.result.status !== "error")

  const serpDirs = [...serpOnlyDirs, ...headFallbackDirs]
  const batches = chunk(serpDirs, SERP_BATCH_SIZE)

  log.info(`serp batch: ${serpDirs.length} dirs → ${batches.length} queries`, { productId })

  const batchLimit = pLimit(2)
  const batchMaps = await Promise.all(
    batches.map((batch, i) =>
      batchLimit(async () => {
        log.info(`serp batch ${i + 1}/${batches.length} started`, {
          productId,
          domains: batch.map((d) => d.domain),
        })
        const map = await serpBatchCheck(batch, product.product_name)
        log.info(`serp batch ${i + 1}/${batches.length} finished`, { productId })
        return map
      })
    )
  )

  const serpResultMap = new Map(batchMaps.flatMap((m) => [...m]))

  const serpResults = serpDirs.map((dir) => ({
    dir,
    result: serpResultMap.get(dir.domain) ?? {
      status: "error" as const,
      url: dir.submit_url,
      reason: "missing from batch result",
    },
  }))

  const results = [...headSuccess, ...serpResults]

  const listed = results.filter((r) => r.result.status === "listed").length
  const gaps = results.filter((r) => r.result.status === "gap")
  const errors = results.filter((r) => r.result.status === "error").length

  let prospectsCreated = 0

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

    if (upsertError) throw new Error(`Failed to upsert prospects: ${upsertError.message}`)
    prospectsCreated = count ?? 0
  }

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
