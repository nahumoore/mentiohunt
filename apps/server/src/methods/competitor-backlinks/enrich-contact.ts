import { EMAIL_VERIFIER, type EmailVerificationResult } from "../../actors/email-verifier.js"
import { runApifyActor } from "../../actors/run-apify-actor.js"
import { createLogger } from "../../helpers/logger.js"
import type { PageType } from "./score-backlink-relevance.js"

const log = createLogger("enrich-contact")

type ScrapeResponse = {
  name: string | null
  email: string | null
  contact_form_url: string | null
  confidence: string
  source: string | null
}

export type ContactResult = {
  name: string | null
  email: string | null
  confidence: "personalized" | "email-only" | "generic" | "none"
}

async function callScraper(url: string): Promise<ScrapeResponse | null> {
  const scraperUrl = process.env.SCRAPER_URL
  if (!scraperUrl) {
    log.warn("SCRAPER_URL not set, skipping scrape")
    return null
  }

  try {
    const res = await fetch(`${scraperUrl}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(60_000),
    })
    if (!res.ok) {
      log.warn("scraper returned error", { url, status: res.status })
      return null
    }
    return res.json() as Promise<ScrapeResponse>
  } catch (err) {
    log.warn("scraper call failed", { url, error: String(err) })
    return null
  }
}

function generatePersonalizedPatterns(name: string, domain: string): string[] {
  const parts = name.trim().toLowerCase().split(/\s+/)
  const first = parts[0] ?? ""
  const last = parts[parts.length - 1] ?? ""
  if (!first) return []
  const patterns: string[] = []
  patterns.push(`${first}@${domain}`)
  if (last && last !== first) {
    patterns.push(`${first}.${last}@${domain}`)
    patterns.push(`${first}${last}@${domain}`)
    patterns.push(`${first[0]}${last}@${domain}`)
    patterns.push(`${first[0]}.${last}@${domain}`)
    patterns.push(`${last}@${domain}`)
  }
  return [...new Set(patterns)]
}

const GENERIC_PATTERNS = ["contact", "hello", "info", "hi"]

async function verifyPatterns(patterns: string[], domain: string): Promise<string | null> {
  if (patterns.length === 0) return null

  log.info("verifying email patterns", { domain, count: patterns.length, patterns })

  try {
    const results = await runApifyActor<EmailVerificationResult[]>(EMAIL_VERIFIER, { emails: patterns }, 120)
    const good = results.find((r) => r.status === "good")

    log.info("verification result", {
      domain,
      good: good?.email ?? null,
      statuses: results.map((r) => ({ email: r.email, status: r.status })),
    })

    return good?.email ?? null
  } catch (err) {
    log.warn("email verification failed", { domain, error: String(err) })
    return null
  }
}

export async function enrichContact(urlFrom: string, pageType: PageType, domain: string): Promise<ContactResult> {
  // Media/news heuristic — skip scraper, go straight to generic patterns
  const isMediaSite =
    pageType === "other" &&
    /\b(news|magazine|press|media|journal|times|post|daily|weekly)\b/i.test(domain)

  if (isMediaSite) {
    log.info("media site heuristic — skipping scraper", { domain, pageType })
  } else {
    const scraperBranch = pageType === "roundup" || pageType === "comparison" ? "about-page" : "article-url"
    const scraperTarget =
      pageType === "roundup" || pageType === "comparison"
        ? `https://${domain}/about`
        : urlFrom

    log.info("scraping for contact", { domain, pageType, branch: scraperBranch, target: scraperTarget })

    const scraped = await callScraper(scraperTarget)

    log.info("scraper result", {
      domain,
      target: scraperTarget,
      hasName: !!scraped?.name,
      name: scraped?.name ?? null,
      hasEmail: !!scraped?.email,
      confidence: scraped?.confidence ?? null,
      source: scraped?.source ?? null,
    })

    if (scraped?.name) {
      const patterns = generatePersonalizedPatterns(scraped.name, domain)
      const verified = await verifyPatterns(patterns, domain)
      log.info("contact enriched via name", { domain, name: scraped.name, email: verified })
      return {
        name: scraped.name,
        email: verified,
        confidence: "personalized",
      }
    }

    if (scraped?.email) {
      log.info("contact enriched via direct email", { domain, email: scraped.email })
      return { name: null, email: scraped.email, confidence: "email-only" }
    }
  }

  // Fallback: generic patterns
  log.info("falling back to generic patterns", { domain })
  const genericPatterns = GENERIC_PATTERNS.map((prefix) => `${prefix}@${domain}`)
  const verified = await verifyPatterns(genericPatterns, domain)

  if (verified) {
    log.info("contact enriched via generic pattern", { domain, email: verified })
    return { name: null, email: verified, confidence: "generic" }
  }

  log.info("no contact found", { domain })
  return { name: null, email: null, confidence: "none" }
}
