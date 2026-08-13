import { lookup } from "node:dns/promises"
import { isIP } from "node:net"
import { parse } from "node-html-parser"

export const REQUEST_TIMEOUT_MS = 12_000
export const MAX_HTML_BYTES = 200_000
export const MAX_REDIRECTS = 5
export const HTML_CONTENT_TYPES = ["text/html", "application/xhtml+xml"]
const BLOCKED_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"])

type ExtractedMeta = {
  name: string
  content: string
}

export type FetchedSiteDetails = {
  finalUrl: string
  contentType: string | null
  status: number
  wasTruncated: boolean
  title: string | null
  metaDescription: string | null
  metaTags: ExtractedMeta[]
  h1: string[]
  h2: string[]
  paragraphs: string[]
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function dedupeTexts(values: string[], limit: number, minLength = 1) {
  return Array.from(
    new Set(values.map(normalizeText).filter((value) => value.length >= minLength))
  ).slice(0, limit)
}

function isPrivateIpv4(ip: string) {
  const parts = ip.split(".").map(Number)

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false
  }

  const [first, second] = parts as [number, number, number, number]

  return (
    first === 10 ||
    first === 127 ||
    first === 0 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  )
}

function isPrivateIpv6(ip: string) {
  const normalized = ip.toLowerCase()

  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.")
  )
}

function isBlockedIpAddress(ip: string) {
  const version = isIP(ip)

  if (version === 4) {
    return isPrivateIpv4(ip)
  }

  if (version === 6) {
    return isPrivateIpv6(ip)
  }

  return false
}

export async function assertSafeUrl(rawUrl: string) {
  const url = new URL(rawUrl)

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS websites are supported")
  }

  const hostname = url.hostname.toLowerCase()

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error("Local and private network addresses are not allowed")
  }

  if (isBlockedIpAddress(hostname)) {
    throw new Error("Local and private network addresses are not allowed")
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true })

  if (addresses.some((address) => isBlockedIpAddress(address.address))) {
    throw new Error("Local and private network addresses are not allowed")
  }
}

export const BOT_FETCH_HEADERS = {
  accept: "text/html,application/xhtml+xml",
  "user-agent": "Mozilla/5.0 (compatible; MentiohuntBot/0.1; +https://mentiohunt.com)",
}

// Some sites' bot-fight-mode-tier protection (e.g. Cloudflare) blocks the identifying
// bot UA above but passes a request that merely looks like an ordinary browser.
export const BROWSER_FETCH_HEADERS = {
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
}

// Status codes typical of a bot/WAF challenge rather than a genuine site error,
// worth retrying once with browser-like headers before giving up.
const BOT_BLOCK_STATUSES = new Set([403, 406, 429, 503])

export async function fetchWithValidatedRedirects(
  initialUrl: string,
  signal: AbortSignal,
  headers: Record<string, string> = BOT_FETCH_HEADERS
) {
  let currentUrl = initialUrl

  // Validate every hop to avoid following redirects into internal networks.
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    await assertSafeUrl(currentUrl)

    const response = await fetch(currentUrl, {
      redirect: "manual",
      signal,
      headers,
      cache: "no-store",
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location")

      if (!location) {
        throw new Error("Homepage redirect did not include a location")
      }

      currentUrl = new URL(location, currentUrl).toString()
      continue
    }

    return response
  }

  throw new Error("Homepage redirected too many times")
}

export async function readHtmlBody(response: Response) {
  if (!response.body) {
    return { html: "", wasTruncated: false }
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const chunks: string[] = []
  let totalBytes = 0
  let wasTruncated = false

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    totalBytes += value.byteLength

    if (totalBytes > MAX_HTML_BYTES) {
      const remainingBytes = Math.max(
        MAX_HTML_BYTES - (totalBytes - value.byteLength),
        0
      )

      if (remainingBytes > 0) {
        chunks.push(decoder.decode(value.subarray(0, remainingBytes), { stream: true }))
      }

      wasTruncated = true
      await reader.cancel()
      break
    }

    chunks.push(decoder.decode(value, { stream: true }))
  }

  chunks.push(decoder.decode())

  return {
    html: chunks.join(""),
    wasTruncated,
  }
}

function removeBoilerplate(root: ReturnType<typeof parse>) {
  for (const selector of [
    "script",
    "style",
    "noscript",
    "template",
    "svg",
    "form",
    "nav",
    "footer",
    "aside",
    '[role="dialog"]',
    '[aria-modal="true"]',
    '[data-nosnippet="true"]',
  ]) {
    for (const element of root.querySelectorAll(selector)) {
      element.remove()
    }
  }
}

function extractMetaTags(root: ReturnType<typeof parse>) {
  return dedupeTexts(
    root.querySelectorAll("meta").flatMap((meta) => {
      const name = meta.getAttribute("name") ?? meta.getAttribute("property")
      const content = meta.getAttribute("content")

      if (!name || !content) {
        return []
      }

      return [JSON.stringify({ name: name.toLowerCase(), content })]
    }),
    24
  ).map((entry) => JSON.parse(entry) as ExtractedMeta)
}

function extractTextContent(root: ReturnType<typeof parse>, selector: string, options?: {
  limit: number
  minLength?: number
}) {
  return dedupeTexts(
    root.querySelectorAll(selector).map((node) => node.textContent),
    options?.limit ?? 10,
    options?.minLength ?? 1
  )
}

function extractTitle(root: ReturnType<typeof parse>) {
  return normalizeText(root.querySelector("title")?.textContent ?? "") || null
}

function extractMainParagraphs(root: ReturnType<typeof parse>) {
  const contentRoot =
    root.querySelector("main") ?? root.querySelector("article") ?? root.querySelector("body") ?? root

  return dedupeTexts(
    contentRoot.querySelectorAll("p").map((paragraph) => paragraph.textContent),
    8,
    40
  )
}

export function isHtmlContentType(contentType: string) {
  const normalized = contentType.toLowerCase()
  return HTML_CONTENT_TYPES.some((allowedType) => normalized.includes(allowedType))
}

async function fetchHomepage(url: string, headers: Record<string, string>) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetchWithValidatedRedirects(url, controller.signal, headers)
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchSiteDetails(url: string): Promise<FetchedSiteDetails> {
  try {
    let response = await fetchHomepage(url, BOT_FETCH_HEADERS)

    // A shallow bot/WAF challenge (not a hard IP block) can reject our identifying
    // UA but pass a request that looks like an ordinary browser — retry once.
    if (!response.ok && BOT_BLOCK_STATUSES.has(response.status)) {
      response = await fetchHomepage(url, BROWSER_FETCH_HEADERS)
    }

    if (!response.ok) {
      if (BOT_BLOCK_STATUSES.has(response.status)) {
        throw new Error(
          "Your site's bot protection blocked our request. Please try again — this is often temporary."
        )
      }

      throw new Error(`Homepage request failed with status ${response.status}`)
    }

    const contentType = response.headers.get("content-type") ?? ""

    if (!isHtmlContentType(contentType)) {
      throw new Error("Homepage did not return HTML")
    }

    const { html, wasTruncated } = await readHtmlBody(response)
    const root = parse(html)
    removeBoilerplate(root)

    const metaTags = extractMetaTags(root)

    const metaDescription =
      metaTags.find((tag) => tag.name === "description")?.content ??
      metaTags.find((tag) => tag.name === "og:description")?.content ??
      metaTags.find((tag) => tag.name === "twitter:description")?.content ??
      null

    return {
      finalUrl: response.url,
      contentType: contentType || null,
      status: response.status,
      wasTruncated,
      title: extractTitle(root),
      metaDescription,
      metaTags,
      h1: extractTextContent(root, "h1", { limit: 6, minLength: 4 }),
      h2: extractTextContent(root, "h2", { limit: 12, minLength: 4 }),
      paragraphs: extractMainParagraphs(root),
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Homepage request timed out")
    }

    throw error
  }
}
