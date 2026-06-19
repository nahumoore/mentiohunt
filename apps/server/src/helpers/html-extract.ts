import * as cheerio from "cheerio"

const TEXT_CHAR_LIMIT = 4_000

/** Tags that never contain useful visible text. */
const STRIP_TAGS = [
  "script",
  "style",
  "noscript",
  "svg",
  "nav",
  "header",
  "footer",
  "aside",
  "form",
  "button",
  "iframe",
  "figure",
  "picture",
].join(", ")

export type PageContent = {
  title: string
  description: string
  text: string
}

/**
 * Extract structured content from raw HTML.
 * Returns title, meta description, and trimmed main body text.
 */
export function extractPageContent(html: string): PageContent {
  const $ = cheerio.load(html)

  const title = $("title").first().text().trim()

  const description =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    ""

  // Remove noise tags before extracting text
  $(STRIP_TAGS).remove()

  // Prefer <main> / <article>, fall back to <body>
  const contentEl = $("main, article").first()
  const textSource = contentEl.length ? contentEl : $("body")

  const rawText = textSource
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, TEXT_CHAR_LIMIT)

  return { title, description, text: rawText }
}
