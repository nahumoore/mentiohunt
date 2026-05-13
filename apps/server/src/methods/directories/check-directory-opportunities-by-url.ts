import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { createLogger } from "../../helpers/logger.js"
import { headCheck } from "./head-check.js"
import { serpCheck } from "./serp-check.js"
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

export async function checkDirectoryOpportunitiesByUrl(input: {
  url: string
  productName: string
}): Promise<DirectoryOpportunitiesByUrlResult> {
  const { url, productName } = input
  const slug = toSlug(productName)

  const { data: directories, error: dirError } = await supabaseAdmin
    .from("directories")
    .select("id, name, domain, submit_url, slug_pattern, check_method, category, is_free, is_active")
    .eq("is_active", true)

  if (dirError) throw new Error(`Failed to load directories: ${dirError.message}`)
  if (!directories || directories.length === 0) {
    log.warn("no active directories found")
    return { url, productName, checked: 0, listed: 0, gaps: 0, errors: 0, directories: [] }
  }

  log.info(`checking ${directories.length} directories`, { url, slug })

  const limit = pLimit(8)

  const results = await Promise.all(
    directories.map((dir) =>
      limit(async () => {
        const startedAt = Date.now()

        log.info("directory check started", {
          url,
          directoryId: dir.id,
          domain: dir.domain,
          method: dir.check_method,
        })

        try {
          let result =
            dir.check_method === "head_check"
              ? await headCheck(dir, slug)
              : await serpCheck(dir, productName)

          if (result.status === "error" && dir.check_method === "head_check") {
            log.info("head_check blocked, falling back to serp_check", {
              url,
              directoryId: dir.id,
              domain: dir.domain,
              reason: result.reason,
            })
            result = await serpCheck(dir, productName)
          }

          log.info("directory check finished", {
            url,
            directoryId: dir.id,
            domain: dir.domain,
            status: result.status,
            durationMs: Date.now() - startedAt,
          })

          return { dir, result }
        } catch (err) {
          log.error("directory check threw unexpectedly", {
            url,
            directoryId: dir.id,
            domain: dir.domain,
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
