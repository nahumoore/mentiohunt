/**
 * Validation helpers for scraped contact data before persisting to backlink_prospects.
 * Guards against LLM hallucinations (e.g. name="null", name="finish") and
 * placeholder email addresses (e.g. john@example.com).
 */

// Substrings that indicate the LLM returned a scraper failure description or a
// refusal to name a real person, instead of a real name.
const NAME_FAILURE_SUBSTRINGS = [
  "unable",
  "cannot",
  "could not",
  "access denied",
  "site could",
  "error",
  "no real person",
  "not identified",
  "no individual",
  "not able to identify",
  "no author",
  "no name",
  "not found",
  "not available",
  "no person",
]

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
  const lower = trimmed.toLowerCase()
  if (NAME_BLOCKLIST.has(lower)) return null
  if (NAME_FAILURE_SUBSTRINGS.some((s) => lower.includes(s))) return null
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
