import { Router, type IRouter } from "express"
import pLimit from "p-limit"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger, withRouteLog } from "../helpers/logger.js"

export const verifyDirectoryUrlsRouter: IRouter = Router()

const CONCURRENCY = 10
const TIMEOUT_MS = 10_000

const log = createLogger("verify-directory-urls")

async function checkSubmitUrl(url: string): Promise<{ ok: boolean; status: number | null }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "MentiohuntBot/1.0 (+https://mentiohunt.com/bot)" },
    })
    clearTimeout(timer)
    return { ok: res.status !== 404, status: res.status }
  } catch (err) {
    clearTimeout(timer)
    log.warn("fetch failed, treating as ok", { url, err: String(err) })
    return { ok: true, status: null }
  }
}

verifyDirectoryUrlsRouter.post("/verify-directory-urls", async (_req, res) => {
  try {
    const result = await withRouteLog("verify-directory-urls", async () => {
      const { data: directories, error } = await supabaseAdmin
        .from("directories")
        .select("id, submit_url")

      if (error) throw new Error(`Failed to load directories: ${error.message}`)

      if (!directories || directories.length === 0) {
        log.warn("no directories found")
        return { checked: 0, flagged: 0, results: [] }
      }

      log.info(`checking ${directories.length} directories`)

      const limit = pLimit(CONCURRENCY)
      const now = new Date().toISOString()

      const results = await Promise.all(
        directories.map((dir) =>
          limit(async () => {
            const startedAt = Date.now()
            const { ok, status } = await checkSubmitUrl(dir.submit_url)

            log.info("checked", {
              submit_url: dir.submit_url,
              status,
              ok,
              durationMs: Date.now() - startedAt,
            })

            const { error: updateError } = await supabaseAdmin
              .from("directories")
              .update({ submit_url_ok: ok, submit_url_verified_at: now })
              .eq("id", dir.id)

            if (updateError) {
              log.error("failed to update directory", { id: dir.id, err: updateError.message })
            }

            return {
              id: dir.id,
              submit_url: dir.submit_url,
              status,
              ok,
              updateError: updateError?.message ?? null,
            }
          })
        )
      )

      const flagged = results.filter((r) => !r.ok)
      log.success(`done`, { checked: results.length, flagged: flagged.length })

      return { checked: results.length, flagged: flagged.length, results }
    })

    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error("route failed", { err: message })
    res.status(500).json({ error: message })
  }
})
