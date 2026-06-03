import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { createLogger } from "../../helpers/logger.js"
import { headCheck } from "./head-check.js"
import { SERP_BATCH_SIZE, serpBatchCheck } from "./serp-check.js"
import { toSlug } from "./slug.js"

const log = createLogger("directory-opportunities-by-url")

export type GapDirectory = {
  id: string
  name: string | null
  domain: string
  submit_url: string
  category: string | null
  is_free: boolean | null
  is_active: boolean | null
}

export type DirectoryOpportunitiesByUrlResult = {
  url: string
  productName: string
  checked: number
  listed: number
  gaps: number
  errors: number
  directories: GapDirectory[]
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export async function checkDirectoryOpportunitiesByUrl(input: {
  url: string
  productName: string
  freeOnly?: boolean
}): Promise<DirectoryOpportunitiesByUrlResult> {
  const { url, productName, freeOnly } = input
  const slug = toSlug(productName)

  let query = supabaseAdmin
    .from("directories")
    .select("id, name, domain, submit_url, slug_pattern, check_method, category, is_free, is_active")
    .eq("is_active", true)

  if (freeOnly) query = query.eq("is_free", true)

  const { data: directories, error: dirError } = await query

  if (dirError) throw new Error(`Failed to load directories: ${dirError.message}`)
  if (!directories || directories.length === 0) {
    log.warn("no active directories found")
    return { url, productName, checked: 0, listed: 0, gaps: 0, errors: 0, directories: [] }
  }

  log.info(`checking ${directories.length} directories`, { url, slug })

  // Phase 1: head_check directories concurrently
  const headDirs = directories.filter((d) => d.check_method === "head_check")
  const serpOnlyDirs = directories.filter((d) => d.check_method !== "head_check")

  const headLimit = pLimit(8)
  const headResults = await Promise.all(
    headDirs.map((dir) =>
      headLimit(async () => {
        try {
          const result = await headCheck(dir, slug)
          log.info("head_check finished", { url, domain: dir.domain, status: result.status })
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

  log.info(`serp batch: ${serpDirs.length} dirs → ${batches.length} queries`, { url })

  const batchLimit = pLimit(2)
  const batchMaps = await Promise.all(
    batches.map((batch, i) =>
      batchLimit(async () => {
        log.info(`serp batch ${i + 1}/${batches.length} started`, {
          url,
          domains: batch.map((d) => d.domain),
        })
        const map = await serpBatchCheck(batch, productName)
        log.info(`serp batch ${i + 1}/${batches.length} finished`, { url })
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
  const gapResults = results.filter((r) => r.result.status === "gap")
  const errors = results.filter((r) => r.result.status === "error").length

  const gapDirectories: GapDirectory[] = gapResults.slice(0, 10).map(({ dir }) => ({
    id: dir.id,
    name: dir.name,
    domain: dir.domain,
    submit_url: dir.submit_url,
    category: dir.category,
    is_free: dir.is_free,
    is_active: dir.is_active,
  }))

  log.success("done", { listed, gaps: gapResults.length, errors })

  return {
    url,
    productName,
    checked: directories.length,
    listed,
    gaps: gapResults.length,
    errors,
    directories: gapDirectories,
  }
}
