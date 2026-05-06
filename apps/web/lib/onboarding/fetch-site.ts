const REQUEST_TIMEOUT_MS = 12_000
const MAX_HTML_LENGTH = 200_000

type ExtractedMeta = {
  name: string
  content: string
}

export type FetchedSiteDetails = {
  finalUrl: string
  title: string | null
  metaDescription: string | null
  metaTags: ExtractedMeta[]
  h1: string[]
  h2: string[]
  paragraphs: string[]
}

function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, " ")
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
}

function normalizeText(value: string) {
  return decodeHtmlEntities(stripTags(value)).replace(/\s+/g, " ").trim()
}

function extractTagContents(html: string, tagName: string) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi")
  const matches = Array.from(html.matchAll(pattern))

  return matches
    .map((match) => normalizeText(match[1] ?? ""))
    .filter(Boolean)
}

function extractTitle(html: string) {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)
  return match ? normalizeText(match[1] ?? "") || null : null
}

function extractMetaTags(html: string) {
  const metaMatches = Array.from(html.matchAll(/<meta\b[^>]*>/gi))

  return metaMatches
    .map((match) => {
      const tag = match[0]
      const nameMatch = tag.match(/(?:name|property)=(["'])(.*?)\1/i)
      const contentMatch = tag.match(/content=(["'])([\s\S]*?)\1/i)

      const name = nameMatch?.[2]?.trim().toLowerCase()
      const content = contentMatch ? normalizeText(contentMatch[2] ?? "") : ""

      if (!name || !content) {
        return null
      }

      return { name, content }
    })
    .filter((meta): meta is ExtractedMeta => meta !== null)
}

export async function fetchSiteDetails(url: string): Promise<FetchedSiteDetails> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent":
          "Mozilla/5.0 (compatible; MentiohuntBot/0.1; +https://mentiohunt.com)",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Homepage request failed with status ${response.status}`)
    }

    const contentType = response.headers.get("content-type") ?? ""

    if (!contentType.toLowerCase().includes("text/html")) {
      throw new Error("Homepage did not return HTML")
    }

    const html = (await response.text()).slice(0, MAX_HTML_LENGTH)
    const metaTags = extractMetaTags(html)

    const metaDescription =
      metaTags.find((tag) => tag.name === "description")?.content ??
      metaTags.find((tag) => tag.name === "og:description")?.content ??
      metaTags.find((tag) => tag.name === "twitter:description")?.content ??
      null

    return {
      finalUrl: response.url,
      title: extractTitle(html),
      metaDescription,
      metaTags: metaTags.slice(0, 24),
      h1: extractTagContents(html, "h1").slice(0, 6),
      h2: extractTagContents(html, "h2").slice(0, 12),
      paragraphs: extractTagContents(html, "p").slice(0, 8),
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Homepage request timed out")
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}
