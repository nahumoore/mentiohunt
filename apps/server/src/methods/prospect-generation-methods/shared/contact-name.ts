/**
 * Sanitizer for contact names before they reach an email greeting or the
 * `backlink_prospects.contact_name` column. Guards against LLM hallucinations
 * (e.g. name="null", name="finish"), scraper leakage (nav menus, other
 * outreach tools' widgets), and non-person entities (domains, companies).
 *
 * Lives under `shared/` rather than `competitor-backlink/` because it's used
 * across every discovery method plus the onboarding sequence builder.
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
  "business",
  "your name",
])

// Bare TLD words that show up when a domain's dot got scraped as a space
// (e.g. "Vebnoxgmail Com" from "vebnoxgmail.com").
const TLD_WORDS = new Set(["com", "io", "net", "org", "co", "ai", "dev", "me", "app", "xyz"])

// Whole-word tokens that indicate a company/entity name rather than a person
// (e.g. "AIlternative Team", "Amopictures Limited", "3A Trend Tech Ltd").
const ENTITY_WORD_BLOCKLIST = new Set([
  "llc",
  "ltd",
  "limited",
  "inc",
  "gmbh",
  "bv",
  "corp",
  "corporation",
  "group",
  "agency",
  "media",
  "studio",
  "studios",
  "solutions",
  "technologies",
  "labs",
  "editorial",
  "team",
  "directory",
  "directories",
  "guide",
  "guides",
  "resource",
  "resources",
  "hub",
  "network",
  "marketplace",
  "listing",
  "listings",
  "wiki",
  "portal",
])

// Whole-word tokens that indicate scraped nav/UI chrome rather than a name
// (e.g. "Category | Select", "Us | Pitchbox | Bot | Visit").
const NAV_WORD_BLOCKLIST = new Set([
  "visit",
  "bot",
  "category",
  "select",
  "home",
  "login",
  "menu",
  "search",
  "contact",
  "about",
  "blog",
  "reviews",
  "rankings",
  "sponsor",
  "articles",
  "why",
  "need",
  "hire",
])

const DOMAIN_SUFFIX_RE = /\.(com|io|net|org|co|ai|dev|me|app|xyz)$/i

/**
 * Sanitize a contact name returned by the scraper LLM agent.
 * Returns null for garbage values: strings like "null", tool names, no-letter
 * strings, implausibly long values, newline/control-char leakage (nav menus,
 * other tools' widgets), domain-as-name, and company/entity names.
 * Otherwise returns the trimmed name.
 */
export function sanitizeContactName(name: string | null | undefined): string | null {
  if (!name) return null
  const trimmed = name.trim()
  if (!trimmed) return null
  if (trimmed.length > 60) return null
  if (!/[a-zA-Z]/.test(trimmed)) return null

  // Control chars, newlines, or separator/markup chars mean this came from
  // scraped nav chrome or another tool's widget, not a clean name field.
  // eslint-disable-next-line no-control-regex -- intentional: reject newline/control-char leakage
  if (/[\x00-\x1f\x7f@|<>]/.test(trimmed)) return null
  if (trimmed.includes("://")) return null

  const lower = trimmed.toLowerCase()
  if (NAME_BLOCKLIST.has(lower)) return null
  if (NAME_FAILURE_SUBSTRINGS.some((s) => lower.includes(s))) return null
  if (DOMAIN_SUFFIX_RE.test(trimmed)) return null

  const words = trimmed.split(/\s+/)
  if (words.length > 4) return null

  // A single run-together word this long is a slug/username, not a name
  // (e.g. "Sweetlovetextmessages").
  if (words.length === 1 && trimmed.length > 18) return null

  // A digit leading the first token means a company/product name, not a person.
  if (/^\d/.test(words[0] ?? "")) return null

  const lowerWords = words.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ""))
  if (lowerWords.some((w) => ENTITY_WORD_BLOCKLIST.has(w))) return null
  if (lowerWords.some((w) => NAV_WORD_BLOCKLIST.has(w))) return null
  if (lowerWords.some((w) => TLD_WORDS.has(w))) return null

  return trimmed
}
