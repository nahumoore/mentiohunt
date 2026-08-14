import { Router, type IRouter } from "express"
import pLimit from "p-limit"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger, withRouteLog } from "../helpers/logger.js"

export const verifyDirectoryUrlsRouter: IRouter = Router()

const CONCURRENCY = 10
const TIMEOUT_MS = 10_000

const log = createLogger("verify-directory-urls")

async function checkSubmitUrl(url: string): Promise<{ ok: boolean | null; status: number | null }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "MentiohuntBot/1.0 (+https://mentiohunt.com/bot)" },
    })
    clearTimeout(timer)
    // 403/429 are usually bot-protection (Cloudflare/WAF) blocking the scripted
    // request, not a broken page for real visitors — only 404/410 are a reliable
    // "this page is actually gone" signal.
    if ([404, 410].includes(res.status)) {
      return { ok: false, status: res.status }
    }
    if (res.status === 403 || res.status === 429) {
      return { ok: null, status: res.status }
    }
    return { ok: true, status: res.status }
  } catch (err) {
    clearTimeout(timer)
    log.warn("fetch failed, leaving submit_url_ok unchanged", { url, err: String(err) })
    return { ok: null, status: null }
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

            // ok === null is inconclusive (bot-block or network error) — leave the
            // existing submit_url_ok value alone rather than overwrite it either way.
            let updateError: string | null = null
            if (ok !== null) {
              const { error } = await supabaseAdmin
                .from("directories")
                .update({ submit_url_ok: ok, submit_url_verified_at: now })
                .eq("id", dir.id)

              if (error) {
                log.error("failed to update directory", { id: dir.id, err: error.message })
                updateError = error.message
              }
            }

            return {
              id: dir.id,
              submit_url: dir.submit_url,
              status,
              ok,
              updateError,
            }
          })
        )
      )

      const flagged = results.filter((r) => r.ok === false)
      const inconclusive = results.filter((r) => r.ok === null)
      log.success(`done`, {
        checked: results.length,
        flagged: flagged.length,
        inconclusive: inconclusive.length,
      })

      return { checked: results.length, flagged: flagged.length, inconclusive: inconclusive.length, results }
    })

    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error("route failed", { err: message })
    res.status(500).json({ error: message })
  }
})
