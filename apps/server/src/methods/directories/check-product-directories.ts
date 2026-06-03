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
  indexed: number
  gaps: number
  errors: number
  newRows: number
  totalActiveDirectories: number
}

export type DirectoryOpportunitiesCheckOptions = {
  maxDirectories?: number
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export async function checkProductDirectoryOpportunities(
  productId: string,
  options: DirectoryOpportunitiesCheckOptions = {}
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

  const { count: activeDirectoryCount, error: activeDirectoryCountError } =
    await supabaseAdmin
      .from("directories")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)

  if (activeDirectoryCountError) {
    log.warn("failed to count active directories", {
      error: activeDirectoryCountError.message,
    })
  }

  let directoriesQuery = supabaseAdmin
    .from("directories")
    .select("id, domain, submit_url, slug_pattern, check_method, domain_rating")
    .eq("is_active", true)

  if (typeof options.maxDirectories === "number") {
    directoriesQuery = directoriesQuery.limit(options.maxDirectories)
  }

  const { data: directories, error: dirError } = await directoriesQuery

  if (dirError) throw new Error(`Failed to load directories: ${dirError.message}`)
  if (!directories || directories.length === 0) {
    log.warn("no matching active directories found", { productId })
    return {
      productId,
      checked: 0,
      indexed: 0,
      gaps: 0,
      errors: 0,
      newRows: 0,
      totalActiveDirectories: activeDirectoryCount ?? 0,
    }
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

  const indexedResults = results.filter((r) => r.result.status === "listed")
  const gapResults = results.filter((r) => r.result.status === "gap")
  const errorCount = results.filter((r) => r.result.status === "error").length

  // Phase 3: write to directory_submissions

  const now = new Date().toISOString()
  const checkedDirectoryIds = directories.map((d) => d.id)

  // Step A: insert new rows for all checked directories (ignoreDuplicates keeps existing rows intact)
  const baseRows = directories.map((dir) => ({
    product_id: productId,
    directory_id: dir.id,
    domain: dir.domain,
    status: "not_submitted" as const,
    last_checked_at: now,
  }))

  const { count: insertCount, error: insertError } = await supabaseAdmin
    .from("directory_submissions")
    .upsert(baseRows, { ignoreDuplicates: true, count: "exact" })

  if (insertError) throw new Error(`Failed to upsert directory_submissions: ${insertError.message}`)

  // Step B: update last_checked_at on all existing rows we just checked
  const { error: touchError } = await supabaseAdmin
    .from("directory_submissions")
    .update({ last_checked_at: now })
    .eq("product_id", productId)
    .in("directory_id", checkedDirectoryIds)

  if (touchError) log.warn("failed to update last_checked_at", { productId, error: touchError.message })

  // Step C: update indexed rows (set status=indexed, listing_url, last_indexed_at)
  if (indexedResults.length > 0) {
    const updateLimit = pLimit(5)
    await Promise.all(
      indexedResults.map(({ dir, result }) =>
        updateLimit(() =>
          supabaseAdmin
            .from("directory_submissions")
            .update({
              status: "indexed",
              listing_url: result.url,
              last_indexed_at: now,
              last_checked_at: now,
            })
            .eq("product_id", productId)
            .eq("directory_id", dir.id)
            .neq("status", "dismissed")
        )
      )
    )
  }

  // Step D: age submitted → not_indexed after 30 days (only if we ran a check recently)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  await supabaseAdmin
    .from("directory_submissions")
    .update({ status: "not_indexed" })
    .eq("product_id", productId)
    .eq("status", "submitted")
    .lt("submitted_at", thirtyDaysAgo)
    .not("last_checked_at", "is", null)

  log.success("done", {
    indexed: indexedResults.length,
    gaps: gapResults.length,
    errors: errorCount,
    newRows: insertCount ?? 0,
  })

  return {
    productId,
    checked: directories.length,
    indexed: indexedResults.length,
    gaps: gapResults.length,
    errors: errorCount,
    newRows: insertCount ?? 0,
    totalActiveDirectories: activeDirectoryCount ?? directories.length,
  }
}
