import {
  EMAIL_VERIFIER,
  type EmailVerificationResult,
} from "../../helpers/actors/email-verifier.js"
import {
  SCRAPERLINK_GOOGLE_SERP,
  type GoogleSerpItem,
  type GoogleSerpResult,
} from "../../helpers/actors/google-serp-scraper.js"
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
  author_hints?: string[]
  author_url?: string | null
  known_pairs?: { name: string; email: string }[]
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
  confidence: "personalized" | "email-only" | "generic" | "inferred" | "none"
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

type BylineScrapeResponse = {
  name: string | null
  author_hints: string[]
  author_url: string | null
}

/** Single-page, no-LLM byline fetch — the cheap path for media sites (A6a). */
async function callBylineScrape(url: string): Promise<BylineScrapeResponse | null> {
  const scraperUrl = process.env.SCRAPER_URL
  if (!scraperUrl) {
    log.warn("SCRAPER_URL not set, skipping byline scrape")
    return null
  }

  try {
    const scraperApiKey = process.env.SCRAPER_API_KEY
    const res = await fetch(`${scraperUrl}/byline-scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(scraperApiKey ? { "x-api-key": scraperApiKey } : {}),
      },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      log.warn("byline scraper returned error", { url, status: res.status, body: body.slice(0, 500) })
      return null
    }
    return res.json() as Promise<BylineScrapeResponse>
  } catch (err) {
    log.warn("byline scraper call failed", { url, error: String(err) })
    return null
  }
}

// Template ids in empirical default order — "first.last@" is the dominant
// convention on company domains, not "first@" (the old unconditional default).
type EmailTemplate = "first.last" | "first" | "firstlast" | "flast" | "f.last" | "last"
const DEFAULT_TEMPLATE_ORDER: EmailTemplate[] = [
  "first.last",
  "first",
  "firstlast",
  "flast",
  "f.last",
  "last",
]

function applyTemplate(template: EmailTemplate, name: string, domain: string): string | null {
  const parts = name.trim().toLowerCase().split(/\s+/)
  const first = parts[0] ?? ""
  const last = parts[parts.length - 1] ?? ""
  if (!first) return null
  switch (template) {
    case "first":
      return `${first}@${domain}`
    case "first.last":
      return last && last !== first ? `${first}.${last}@${domain}` : null
    case "firstlast":
      return last && last !== first ? `${first}${last}@${domain}` : null
    case "flast":
      return last && last !== first ? `${first[0]}${last}@${domain}` : null
    case "f.last":
      return last && last !== first ? `${first[0]}.${last}@${domain}` : null
    case "last":
      return last && last !== first ? `${last}@${domain}` : null
  }
}

/** DIY replacement for a paid provider's "pattern" field (A4/B2): back out which
 * template produced an observed name<->email pair on the domain. */
function inferTemplateFromPair(name: string, email: string): EmailTemplate | null {
  const [localPart] = email.toLowerCase().split("@")
  if (!localPart) return null
  const parts = name.trim().toLowerCase().split(/\s+/)
  const first = parts[0] ?? ""
  const last = parts[parts.length - 1] ?? ""
  if (!first) return null
  if (last && last !== first) {
    if (localPart === `${first}.${last}`) return "first.last"
    if (localPart === `${first}${last}`) return "firstlast"
    if (localPart === `${first[0]}${last}`) return "flast"
    if (localPart === `${first[0]}.${last}`) return "f.last"
    if (localPart === last) return "last"
  }
  if (localPart === first) return "first"
  return null
}

/** Find the first known name<->email pair on this domain and infer its template. */
function findInferredTemplate(
  pairs: { name: string; email: string }[] | undefined,
  domain: string
): EmailTemplate | null {
  if (!pairs) return null
  for (const pair of pairs) {
    const emailDomain = pair.email.split("@")[1]?.toLowerCase()
    if (emailDomain !== domain.toLowerCase()) continue
    const template = inferTemplateFromPair(pair.name, pair.email)
    if (template) return template
  }
  return null
}

function generatePersonalizedPatterns(
  name: string,
  domain: string,
  preferredTemplate?: EmailTemplate | null
): string[] {
  const order = preferredTemplate
    ? [preferredTemplate, ...DEFAULT_TEMPLATE_ORDER.filter((t) => t !== preferredTemplate)]
    : DEFAULT_TEMPLATE_ORDER
  const patterns = order.map((t) => applyTemplate(t, name, domain)).filter((p): p is string => p !== null)
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
    // Walk results in the caller's priority order (`patterns`), not the actor's
    // output order — otherwise whichever candidate the actor happens to list
    // first wins, silently undoing the caller's priority.
    const byEmail = new Map(results.map((r) => [r.email, r]))
    const good = patterns.map((p) => byEmail.get(p)).find((r) => r?.status === "good")
    const riskyScraped =
      scrapedEmail && byEmail.get(scrapedEmail)?.status === "risky" ? byEmail.get(scrapedEmail) : null
    const riskyAny = allowRiskyFallback
      ? patterns.map((p) => byEmail.get(p)).find((r) => r?.status === "risky")
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

/**
 * Verify generated personal-name patterns, with a catch-all fallback (A3): small
 * B2B domains are often catch-all, so the verifier can never return "good" for a
 * guessed address — without this, we'd silently drop to a generic email on
 * exactly the domains where guessing is safest. On catch-all, accept the
 * top-priority (highest-confidence) pattern as best-effort, honestly labeled.
 */
async function verifyGeneratedPersonalPatterns(
  patterns: string[],
  domain: string
): Promise<{ email: string; confidence: "personalized" | "inferred" } | null> {
  if (patterns.length === 0) return null

  log.info("verifying generated personal patterns", { domain, count: patterns.length, patterns })

  try {
    const results = await runApifyActor<EmailVerificationResult[]>(
      EMAIL_VERIFIER,
      { emails: patterns },
      120
    )
    const byEmail = new Map(results.map((r) => [r.email, r]))
    const good = patterns.map((p) => byEmail.get(p)).find((r) => r?.status === "good")
    if (good) return { email: good.email, confidence: "personalized" }

    const topPattern = patterns[0]
    const top = topPattern ? byEmail.get(topPattern) : undefined
    if (topPattern && top?.catch_all) {
      log.info("catch-all domain — accepting top pattern as best-effort", {
        domain,
        email: topPattern,
      })
      return { email: topPattern, confidence: "inferred" }
    }
    return null
  } catch (err) {
    log.warn("email verification failed", { domain, error: String(err) })
    return null
  }
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

/** Rough display-name guess from a bare domain (no company-name data available at this point). */
function guessCompanyNameFromDomain(domain: string): string {
  const base = domain.replace(/^www\./, "").split(".")[0] ?? domain
  return base.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

type SerpFindings = { name: string | null; emails: string[] }

/**
 * Cold-start name/email discovery (B1): when the page itself is silent, pivot
 * off-domain via the Google SERP actor we already own instead of buying an
 * identity provider. Two queries only, to keep Apify spend bounded: a
 * LinkedIn-title query for a founder/editor name, and a raw "@domain" query
 * for addresses already indexed elsewhere (directories, press, bios).
 */
async function searchContactViaSerp(domain: string): Promise<SerpFindings> {
  const companyGuess = guessCompanyNameFromDomain(domain)
  const queries = [
    `site:linkedin.com/in "${companyGuess}" (founder OR editor OR "head of content" OR "managing editor")`,
    `"@${domain}"`,
  ]

  const allResults: GoogleSerpResult[] = []
  for (const keyword of queries) {
    try {
      const items = await runApifyActor<GoogleSerpItem[]>(
        SCRAPERLINK_GOOGLE_SERP,
        { keyword, limit: "10", country: "US", include_merged: false },
        60
      )
      for (const item of items) {
        if (item.results) allResults.push(...item.results)
      }
    } catch (err) {
      log.warn("SERP cold-start query failed", { domain, keyword, error: String(err) })
    }
  }

  const emailSet = new Set<string>()
  for (const r of allResults) {
    const text = `${r.title ?? ""} ${r.description ?? ""}`
    const matches = text.match(EMAIL_REGEX) ?? []
    for (const m of matches) {
      if (m.toLowerCase().endsWith(`@${domain.toLowerCase()}`)) emailSet.add(m)
    }
  }

  let name: string | null = null
  for (const r of allResults) {
    if (!r.url?.includes("linkedin.com/in/") || !r.title) continue
    const candidate = r.title.split(" | ")[0]?.split(" - ")[0]?.trim()
    if (candidate) {
      name = candidate
      break
    }
  }

  if (emailSet.size > 0 || name) {
    log.info("SERP cold-start search found signal", { domain, name, emailCount: emailSet.size })
  }

  return { name, emails: [...emailSet] }
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
    // Media sites have clear bylines and guessable conventions — skip the deep
    // multi-page agent crawl (cost) but still pull the byline name and try
    // name -> pattern -> verify before falling back to a generic inbox (A6a).
    log.info("media site heuristic — byline-only path", { domain, pageType })
    const byline = await callBylineScrape(urlFrom)
    const bylineName = sanitizeContactName(byline?.name ?? null)

    if (bylineName) {
      const generated = generatePersonalizedPatterns(bylineName, domain)
      const result = await verifyGeneratedPersonalPatterns(generated, domain)
      if (result) {
        log.info("media site contact enriched via byline patterns", {
          domain,
          name: bylineName,
          email: result.email,
          confidence: result.confidence,
        })
        return {
          name: bylineName,
          email: result.email,
          social_links: {},
          confidence: result.confidence,
          rawMetadata: null,
        }
      }
    }
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

  const scrapedPersonal = validEmails.filter((e) => e.type === "personal").map((e) => e.value)
  const scrapedGeneric = validEmails.filter((e) => e.type !== "personal").map((e) => e.value)

  // Tier 1: scraped personal emails — the best signal we have, verify first so
  // a generic scraped/generated email never wins ahead of it.
  if (scrapedPersonal.length > 0) {
    const verified = await verifyPatterns(scrapedPersonal, domain, scrapedPersonal[0])
    if (verified) {
      log.info("contact enriched via scraped personal email", { domain, name: cleanName, email: verified })
      return {
        name: cleanName,
        email: verified,
        social_links: scraped.social_links,
        confidence: cleanName ? "personalized" : "email-only",
        rawMetadata,
      }
    }
  }

  // Tier 1.5: cold start (B1) — page gave us neither a name nor a personal
  // email, so pivot off-domain via SERP before generating patterns. A name
  // found here still gets a shot at Tier 2; a raw email found here is
  // verified with the same priority as a scraped one.
  let effectiveName = cleanName
  if (!cleanName && scrapedPersonal.length === 0) {
    const serp = await searchContactViaSerp(domain)
    const serpName = sanitizeContactName(serp.name)
    const serpEmails = serp.emails.filter(isValidContactEmail)

    if (serpEmails.length > 0) {
      const verified = await verifyPatterns(serpEmails, domain, serpEmails[0])
      if (verified) {
        log.info("contact enriched via SERP-found email", { domain, name: serpName, email: verified })
        return {
          name: serpName,
          email: verified,
          social_links: scraped.social_links,
          confidence: serpName ? "personalized" : "email-only",
          rawMetadata,
        }
      }
    }

    effectiveName = serpName
  }

  // Tier 2: generated personal patterns from the author/founder name — prefer the
  // domain's inferred email format (A4) when we've seen another name<->email pair
  // on this domain, then fall back to the empirical default order.
  if (effectiveName) {
    const inferredTemplate = findInferredTemplate(scraped.known_pairs, domain)
    const generated = generatePersonalizedPatterns(effectiveName, domain, inferredTemplate)
    const result = await verifyGeneratedPersonalPatterns(generated, domain)
    if (result) {
      log.info("contact enriched via name patterns", {
        domain,
        name: effectiveName,
        email: result.email,
        confidence: result.confidence,
        inferredTemplate,
      })
      return {
        name: effectiveName,
        email: result.email,
        social_links: scraped.social_links,
        confidence: result.confidence,
        rawMetadata,
      }
    }
  }

  // Tier 3: scraped generic emails
  if (scrapedGeneric.length > 0) {
    const verified = await verifyPatterns(scrapedGeneric, domain)
    if (verified) {
      log.info("contact enriched via scraped generic email", { domain, email: verified })
      return {
        name: effectiveName,
        email: verified,
        social_links: scraped.social_links,
        confidence: "email-only",
        rawMetadata,
      }
    }
  }

  // Tier 4: generated generic patterns — last resort, preserve rawMetadata
  log.info("no personal email verified, falling back to generic patterns", { domain })
  const genericPatterns = GENERIC_PATTERNS.map((prefix) => `${prefix}@${domain}`)
  const verified = await verifyPatterns(genericPatterns, domain, undefined, true)

  if (verified) {
    log.info("contact enriched via generic pattern", { domain, email: verified })
    return {
      name: effectiveName,
      email: verified,
      social_links: scraped.social_links,
      confidence: "generic",
      rawMetadata,
    }
  }

  log.info("no contact found", { domain })
  return {
    name: effectiveName,
    email: null,
    social_links: scraped.social_links,
    confidence: "none",
    rawMetadata,
  }
}
