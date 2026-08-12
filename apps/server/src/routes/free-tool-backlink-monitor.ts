import { timingSafeEqual } from "node:crypto"
import { Router, type IRouter } from "express"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { checkRateLimit } from "../helpers/rate-limit.js"
import { checkLink } from "../helpers/link-tracker/check-link-client.js"
import { normalizeDomainInput } from "../helpers/link-tracker/domains.js"
import { classifyCheckResult, type BacklinkCheckRow } from "../methods/link-tracker/classify-check-result.js"

const log = createLogger("free-tool-backlink-monitor")

export const freeToolBacklinkMonitorRouter: IRouter = Router()

const MAX_URLS = 15

function verifyApiKey(provided: string | undefined, expected: string): boolean {
  if (!provided) return false
  try {
    const a = Buffer.from(provided)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

function normalizeSourceUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    return new URL(withScheme).toString()
  } catch {
    return null
  }
}

freeToolBacklinkMonitorRouter.post("/free-tool/backlink-monitor", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const clientIp = req.header("x-forwarded-client-ip") ?? "unknown"
  const { allowed } = checkRateLimit("free-tool-backlink-monitor", clientIp)
  if (!allowed) {
    res.status(429).json({ error: "Daily limit reached. Come back tomorrow." })
    return
  }

  const { domain, urls } = req.body as { domain?: string; urls?: string[] }

  if (!domain || typeof domain !== "string") {
    res.status(400).json({ error: "domain required" })
    return
  }

  if (!Array.isArray(urls) || urls.length === 0) {
    res.status(400).json({ error: "at least one url required" })
    return
  }

  const targetDomain = normalizeDomainInput(domain)
  if (!targetDomain) {
    res.status(400).json({ error: "invalid domain" })
    return
  }

  const normalizedUrls = [...new Set(urls.map(normalizeSourceUrl).filter((u): u is string => u !== null))].slice(
    0,
    MAX_URLS
  )

  if (normalizedUrls.length === 0) {
    res.status(400).json({ error: "no valid urls provided" })
    return
  }

  await withRouteLog(`free-tool-backlink-monitor-${targetDomain}`, async () => {
    log.info("starting", { targetDomain, urlCount: normalizedUrls.length })

    const rows: BacklinkCheckRow[] = await Promise.all(
      normalizedUrls.map(async (url) => {
        const result = await checkLink({ url, targetDomain, competitorDomains: [] })
        return classifyCheckResult(url, result)
      })
    )

    const summary = {
      checked: rows.length,
      live: rows.filter((r) => r.status === "live").length,
      nofollow: rows.filter((r) => r.status === "nofollow").length,
      removed: rows.filter((r) => r.status === "removed").length,
      pageDead: rows.filter((r) => r.status === "page_dead").length,
      checkFailed: rows.filter((r) => r.status === "check_failed").length,
    }

    log.info("done", { targetDomain, ...summary })

    res.json({ domain: targetDomain, rows, summary })
  })
})
