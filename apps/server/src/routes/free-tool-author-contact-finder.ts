import { timingSafeEqual } from "node:crypto"
import { Router, type IRouter } from "express"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { checkRateLimit } from "../helpers/rate-limit.js"
import { enrichContact } from "../methods/competitor-backlinks/enrich-contact.js"

const log = createLogger("free-tool-author-contact-finder")

export const freeToolAuthorContactFinderRouter: IRouter = Router()

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

freeToolAuthorContactFinderRouter.post("/free-tool/author-contact-finder", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const clientIp = req.header("x-forwarded-client-ip") ?? "unknown"
  const { allowed } = checkRateLimit("free-tool-author-contact-finder", clientIp)
  if (!allowed) {
    res.status(429).json({ error: "Daily limit reached. Come back tomorrow." })
    return
  }

  const { url } = req.body as { url?: string }

  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "url required" })
    return
  }

  let domain: string
  try {
    domain = new URL(url).hostname.replace(/^www\./i, "").toLowerCase()
  } catch {
    res.status(400).json({ error: "invalid url" })
    return
  }

  await withRouteLog(`free-tool-author-contact-finder-${domain}`, async () => {
    log.info("starting", { domain, url })

    try {
      const contact = await enrichContact(url, "other", domain)

      log.info("done", {
        domain,
        hasName: !!contact.name,
        hasEmail: !!contact.email,
        confidence: contact.confidence,
      })

      res.json({
        domain,
        url,
        name: contact.name,
        email: contact.email,
        confidence: contact.confidence,
        socialLinks: contact.social_links,
        bio: contact.rawMetadata?.bio ?? null,
        contactFormUrl: contact.rawMetadata?.contact_form_url ?? null,
        otherEmails: contact.rawMetadata?.emails ?? [],
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error("failed", { domain, error: msg })
      res.status(502).json({ error: "Lookup failed. Please try again." })
    }
  })
})
