import { fetchWithRetry, HttpStatusError } from "./http.js"

const PLATFORM_HOSTS = new Set([
  "x.com",
  "twitter.com",
  "bsky.app",
  "bsky.social",
  "t.co",
  "bit.ly",
  "ow.ly",
  "buff.ly",
  "dlvr.it",
  "ift.tt",
])

const EMAIL_STOPLIST = new Set([
  "i", "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "up", "out", "if", "is", "it", "as", "be",
  "was", "are", "this", "that", "these", "those", "my", "your", "our",
  "their", "we", "you", "he", "she", "they", "it", "dm", "rt", "pr",
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
])

const PLAIN_EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

function deobfuscateText(text: string): string {
  return text
    .replace(/\s*\(\s*at\s*\)\s*/gi, "@")
    .replace(/\s*\[\s*at\s*\]\s*/gi, "@")
    .replace(/\s+at\s+(?=[a-zA-Z0-9])/gi, "@")
    .replace(/\s*\(\s*dot\s*\)\s*/gi, ".")
    .replace(/\s*\[\s*dot\s*\]\s*/gi, ".")
    .replace(/\s+dot\s+(?=[a-zA-Z0-9])/gi, ".")
}

export function extractEmail(text: string): string | null {
  const direct = text.match(PLAIN_EMAIL_RE)
  if (direct) return direct[0]!.toLowerCase()

  const deobfuscated = deobfuscateText(text)
  if (deobfuscated === text) return null
  const found = deobfuscated.match(PLAIN_EMAIL_RE)
  return found ? found[0]!.toLowerCase() : null
}

const URL_RE = /https?:\/\/([a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)*/g
const BARE_DOMAIN_RE = /\b([a-zA-Z0-9\-]+\.(?:com|io|co|app|net|org|dev|ai|so|xyz|tech|media))\b/g

export function extractDomain(text: string): string | null {
  for (const match of text.matchAll(URL_RE)) {
    try {
      const host = new URL(match[0]!).hostname.replace(/^www\./, "")
      if (!PLATFORM_HOSTS.has(host)) return host
    } catch {
      // skip malformed
    }
  }

  for (const match of text.matchAll(BARE_DOMAIN_RE)) {
    const domain = match[1]!.toLowerCase()
    if (!PLATFORM_HOSTS.has(domain)) return domain
  }

  return null
}

export function extractBrandCandidates(text: string): string[] {
  const tokens = text.split(/\s+/)
  const candidates: string[] = []

  for (let i = 0; i < tokens.length; i++) {
    const raw = tokens[i]!.replace(/[^a-zA-Z0-9]/g, "")
    if (!raw || raw.length < 3) continue
    if (raw[0] !== raw[0]!.toUpperCase()) continue
    if (EMAIL_STOPLIST.has(raw.toLowerCase())) continue
    if (i === 0) continue // sentence-starter
    candidates.push(raw)
  }

  // deduplicate, preserve order
  return [...new Set(candidates)]
}

const PROBE_TLDS = [".com", ".io", ".co", ".app"]

export async function guessBrandDomain(brand: string): Promise<string | null> {
  const slug = brand.toLowerCase()

  for (const tld of PROBE_TLDS) {
    const url = `https://${slug}${tld}`
    try {
      const result = await fetchWithRetry(url, {
        rangeBytes: 2048,
        maxAttempts: 1,
        timeoutMs: 4000,
      })
      return new URL(result.url).hostname.replace(/^www\./, "")
    } catch (err) {
      if (
        err instanceof HttpStatusError &&
        (err.status === 404 || err.status === 410 || err.status === 451)
      ) {
        continue
      }
      // network error / timeout — try next TLD
    }
  }

  return null
}
