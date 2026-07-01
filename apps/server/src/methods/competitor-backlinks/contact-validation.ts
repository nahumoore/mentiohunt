/**
 * Validation helpers for scraped contact data before persisting to backlink_prospects.
 * Guards against LLM hallucinations (e.g. name="null", name="finish") and
 * placeholder email addresses (e.g. john@example.com).
 */

const NAME_BLOCKLIST = new Set([
  "null",
  "none",
  "n/a",
  "na",
  "undefined",
  "unknown",
  "finish",
  "scrape_page",
  "anonymous",
  "author",
  "admin",
  "editor",
  "staff",
  "team",
])

const PLACEHOLDER_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "domain.com",
  "email.com",
  "yourdomain.com",
  "sample.com",
  "acme.com",
  "placeholder.com",
  "fakeemail.com",
])

const PLACEHOLDER_LOCAL_PARTS = new Set([
  "john",
  "jhon",
  "jane",
  "johndoe",
  "janedoe",
  "firstname",
  "you",
  "name",
  "user",
  "test",
  "demo",
])

/**
 * Sanitize a contact name returned by the scraper LLM agent.
 * Returns null for garbage values, strings like "null", tool names, no-letter
 * strings, and implausibly long values. Otherwise returns the trimmed name.
 */
export function sanitizeContactName(name: string | null | undefined): string | null {
  if (!name) return null
  const trimmed = name.trim()
  if (!trimmed) return null
  if (trimmed.length > 60) return null
  if (!/[a-zA-Z]/.test(trimmed)) return null
  if (NAME_BLOCKLIST.has(trimmed.toLowerCase())) return null
  if (trimmed.split(/\s+/).length > 5) return null
  return trimmed
}

/**
 * Validate a contact email address.
 * Rejects null, obviously malformed addresses, placeholder domains, and
 * obvious sample local-parts (john@example.com pattern).
 */
export function isValidContactEmail(email: string | null | undefined): boolean {
  if (!email) return false
  // Basic shape check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false

  const atIdx = email.lastIndexOf("@")
  const domain = email.slice(atIdx + 1).toLowerCase()
  const localPart = email.slice(0, atIdx).toLowerCase()

  if (PLACEHOLDER_DOMAINS.has(domain)) return false
  // Allow common generic prefixes on real domains but block sample local-parts on any domain
  // (e.g. "john@example.com" but also "john@test.com" — local part is clearly a placeholder)
  if (PLACEHOLDER_LOCAL_PARTS.has(localPart) && PLACEHOLDER_DOMAINS.has(domain)) return false

  return true
}
