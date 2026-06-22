import {
  EMAIL_VERIFIER,
  type EmailVerificationResult,
} from "../../helpers/actors/email-verifier.js"
import { runApifyActor } from "../../helpers/actors/run-apify-actor.js"
import { createLogger } from "../../helpers/logger.js"
import type { PageType } from "./score-backlink-relevance.js"
import { isValidContactEmail, sanitizeContactName } from "./contact-validation.js"

const log = createLogger("enrich-contact")

export type AgentScrapeResponse = {
  name: string | null
  emails: { value: string; type: string }[]
  social_links: Record<string, string>
  bio: string | null
  contact_form_url: string | null
  confidence: string
  visited_urls: string[]
}

export type RawContactMetadata = {
  bio: string | null
  emails: { value: string; type: string }[]
  contact_form_url: string | null
  visited_urls: string[]
  confidence: string
}

export type ContactResult = {
  name: string | null
  email: string | null
  social_links: Record<string, string>
  confidence: "personalized" | "email-only" | "generic" | "none"
  rawMetadata: RawContactMetadata | null
}

async function callScraper(url: string): Promise<AgentScrapeResponse | null> {
  const scraperUrl = process.env.SCRAPER_URL
  if (!scraperUrl) {
    log.warn("SCRAPER_URL not set, skipping scrape")
    return null
  }

  try {
    const scraperApiKey = process.env.SCRAPER_API_KEY
    const res = await fetch(`${scraperUrl}/agent-scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(scraperApiKey ? { "x-api-key": scraperApiKey } : {}),
      },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(120_000),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      log.warn("scraper returned error", { url, status: res.status, body: body.slice(0, 500) })
      return null
    }
    return res.json() as Promise<AgentScrapeResponse>
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

async function verifyPatterns(
  patterns: string[],
  domain: string,
  scrapedEmail?: string | null,
  allowRiskyFallback?: boolean
): Promise<string | null> {
  if (patterns.length === 0) return null

  log.info("verifying email patterns", {
    domain,
    count: patterns.length,
    patterns,
  })

  try {
    const results = await runApifyActor<EmailVerificationResult[]>(
      EMAIL_VERIFIER,
      { emails: patterns },
      120
    )
    const good = results.find((r) => r.status === "good")
    const riskyScraped = scrapedEmail
      ? results.find((r) => r.email === scrapedEmail && r.status === "risky")
      : null
    const riskyAny = allowRiskyFallback
      ? results.find((r) => r.status === "risky")
      : null

    log.info("verification result", {
      domain,
      good: good?.email ?? null,
      riskyScrapedFallback: riskyScraped?.email ?? null,
      riskyGenericFallback: riskyAny?.email ?? null,
      statuses: results.map((r) => ({ email: r.email, status: r.status })),
    })

    return good?.email ?? riskyScraped?.email ?? riskyAny?.email ?? null
  } catch (err) {
    log.warn("email verification failed", { domain, error: String(err) })
    return null
  }
}

export async function enrichContact(
  urlFrom: string,
  pageType: PageType,
  domain: string
): Promise<ContactResult> {
  // Media/news heuristic — skip scraper, go straight to generic patterns
  const isMediaSite =
    pageType === "other" &&
    /\b(news|magazine|press|media|journal|times|post|daily|weekly)\b/i.test(
      domain
    )

  if (isMediaSite) {
    log.info("media site heuristic — skipping scraper", { domain, pageType })
  } else {
    log.info("scraping for contact", { domain, pageType, target: urlFrom })

    const scraped = await callScraper(urlFrom)

    log.info("scraper result", {
      domain,
      target: urlFrom,
      hasName: !!scraped?.name,
      name: scraped?.name ?? null,
      emailCount: scraped?.emails.length ?? 0,
      confidence: scraped?.confidence ?? null,
    })

    if (scraped) {
      return resolveContactEmail(scraped, domain)
    }
  }

  // Fallback: generic patterns (no agent result or media site)
  log.info("falling back to generic patterns", { domain })
  const genericPatterns = GENERIC_PATTERNS.map((prefix) => `${prefix}@${domain}`)
  const verified = await verifyPatterns(genericPatterns, domain, undefined, true)

  if (verified) {
    log.info("contact enriched via generic pattern", { domain, email: verified })
    return {
      name: null,
      email: verified,
      social_links: {},
      confidence: "generic",
      rawMetadata: null,
    }
  }

  log.info("no contact found", { domain })
  return { name: null, email: null, social_links: {}, confidence: "none", rawMetadata: null }
}

/**
 * Resolve a verified contact email from an already-scraped agent result.
 * Shared by the competitor flow (after callScraper) and the unlinked-mention
 * flow (which receives the scrape inline from the scraper /check-mention call),
 * so the same page is never scraped twice.
 */
export async function resolveContactEmail(
  scraped: AgentScrapeResponse,
  domain: string
): Promise<ContactResult> {
  // Sanitize LLM-produced name (rejects "null", "finish", tool names, etc.)
  const cleanName = sanitizeContactName(scraped.name)
  if (cleanName !== scraped.name) {
    log.info("contact name sanitized", { domain, original: scraped.name, cleaned: cleanName })
  }

  // Filter out placeholder/sample emails before any verification attempt
  const validEmails = scraped.emails.filter((e) => isValidContactEmail(e.value))
  if (validEmails.length < scraped.emails.length) {
    const dropped = scraped.emails.filter((e) => !isValidContactEmail(e.value)).map((e) => e.value)
    log.info("placeholder emails filtered", { domain, dropped })
  }

  const rawMetadata: RawContactMetadata = {
    bio: scraped.bio,
    emails: validEmails,
    contact_form_url: scraped.contact_form_url,
    visited_urls: scraped.visited_urls,
    confidence: scraped.confidence,
  }

  if (validEmails.length > 0) {
    // Personal emails first, then general
    const ordered = [...validEmails].sort((a, b) =>
      a.type === "personal" ? -1 : b.type === "personal" ? 1 : 0
    )
    const personalEmail = ordered.find((e) => e.type === "personal")?.value ?? null
    const candidates = ordered.map((e) => e.value)

    const verified = await verifyPatterns(candidates, domain, personalEmail)

    if (verified) {
      log.info("contact enriched via agent emails", { domain, name: cleanName, email: verified })
      return {
        name: cleanName,
        email: verified,
        social_links: scraped.social_links,
        confidence: cleanName ? "personalized" : "email-only",
        rawMetadata,
      }
    }
  }

  // Agent found a name but no verifiable email — try pattern generation
  if (cleanName) {
    const generated = generatePersonalizedPatterns(cleanName, domain)
    const verified = await verifyPatterns(generated, domain)
    if (verified) {
      log.info("contact enriched via name patterns", { domain, name: cleanName, email: verified })
      return {
        name: cleanName,
        email: verified,
        social_links: scraped.social_links,
        confidence: "personalized",
        rawMetadata,
      }
    }
  }

  // Agent ran but no verifiable email — try generic patterns, preserve rawMetadata
  log.info("agent found no verifiable email, falling back to generic patterns", { domain })
  const genericPatterns = GENERIC_PATTERNS.map((prefix) => `${prefix}@${domain}`)
  const verified = await verifyPatterns(genericPatterns, domain, undefined, true)

  if (verified) {
    log.info("contact enriched via generic pattern", { domain, email: verified })
    return {
      name: cleanName,
      email: verified,
      social_links: scraped.social_links,
      confidence: "generic",
      rawMetadata,
    }
  }

  log.info("no contact found", { domain })
  return {
    name: cleanName,
    email: null,
    social_links: scraped.social_links,
    confidence: "none",
    rawMetadata,
  }
}
