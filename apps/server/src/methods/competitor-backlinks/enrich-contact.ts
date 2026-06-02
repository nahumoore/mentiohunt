import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import {
  EMAIL_VERIFIER,
  type EmailVerificationResult,
} from "../../helpers/actors/email-verifier.js"
import { runApifyActor } from "../../helpers/actors/run-apify-actor.js"
import { createLogger } from "../../helpers/logger.js"
import type { PageType } from "./score-backlink-relevance.js"

const log = createLogger("enrich-contact")

type ScrapeResponse = {
  name: string | null
  email: string | null
  contact_form_url: string | null
  confidence: string
  source: string | null
  social_links: Record<string, string>
  raw_snippets: {
    header: string
    footer: string
    article_header: string
  } | null
}

type CleanedContact = {
  name: string | null
  social_links: Record<string, string>
}

export type ContactResult = {
  name: string | null
  email: string | null
  social_links: Record<string, string>
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

async function verifyPatterns(
  patterns: string[],
  domain: string
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

async function cleanScraperResult(
  scraped: ScrapeResponse,
  domain: string
): Promise<CleanedContact> {
  const input = JSON.stringify({
    scraped_name: scraped.name,
    article_header: scraped.raw_snippets?.article_header ?? "",
    header: scraped.raw_snippets?.header?.slice(0, 500) ?? "",
    social_links: scraped.social_links,
  })

  try {
    const { text } = await generateTextWithUsage({
      model: OPENROUTER_MODELS.GOOGLE_GEMINI_2_5_FLASH_LITE,
      input,
      systemInstructions: `Extract the article author's personal contact info from scraped web page data.

Return JSON with:
- "name": the real person who authored the article. Check article_header for "Written by", "By", or author byline patterns. Use scraped_name if it looks like a real person (two capitalised words). Reject nav items (e.g. "Articles"), brand names, or company names. Return null if uncertain.
- "social_links": only personal social links (e.g. linkedin.com/in/<username> for an individual). Remove company accounts (linkedin.com/company/, brand Twitter handles, official brand pages). Return {} if none found.`,
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "cleaned_contact",
          strict: true,
          schema: {
            type: "object",
            properties: {
              name: { type: ["string", "null"] },
              social_links: {
                type: "object",
                additionalProperties: { type: "string" },
              },
            },
            required: ["name", "social_links"],
            additionalProperties: false,
          },
        },
      },
    })

    const parsed = JSON.parse(text) as CleanedContact
    log.info("llm clean result", {
      domain,
      name: parsed.name,
      socialCount: Object.keys(parsed.social_links).length,
    })
    return parsed
  } catch (err) {
    log.warn("llm clean failed, using raw scraper result", {
      domain,
      error: String(err),
    })
    return { name: scraped.name, social_links: scraped.social_links }
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
      hasEmail: !!scraped?.email,
      confidence: scraped?.confidence ?? null,
      source: scraped?.source ?? null,
    })

    if (scraped) {
      const cleaned = await cleanScraperResult(scraped, domain)

      if (cleaned.name) {
        const patterns = generatePersonalizedPatterns(cleaned.name, domain)
        const verified = await verifyPatterns(patterns, domain)
        log.info("contact enriched via name", {
          domain,
          name: cleaned.name,
          email: verified,
        })
        return {
          name: cleaned.name,
          email: verified,
          social_links: cleaned.social_links,
          confidence: "personalized",
        }
      }

      if (scraped.email) {
        log.info("contact enriched via direct email", {
          domain,
          email: scraped.email,
        })
        return {
          name: null,
          email: scraped.email,
          social_links: cleaned.social_links,
          confidence: "email-only",
        }
      }
    }
  }

  // Fallback: generic patterns
  log.info("falling back to generic patterns", { domain })
  const genericPatterns = GENERIC_PATTERNS.map(
    (prefix) => `${prefix}@${domain}`
  )
  const verified = await verifyPatterns(genericPatterns, domain)

  if (verified) {
    log.info("contact enriched via generic pattern", {
      domain,
      email: verified,
    })
    return {
      name: null,
      email: verified,
      social_links: {},
      confidence: "generic",
    }
  }

  log.info("no contact found", { domain })
  return { name: null, email: null, social_links: {}, confidence: "none" }
}
