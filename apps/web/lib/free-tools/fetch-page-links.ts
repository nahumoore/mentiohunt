import { parse } from "node-html-parser"

import {
  fetchWithValidatedRedirects,
  isHtmlContentType,
  readHtmlBody,
  REQUEST_TIMEOUT_MS,
} from "@/lib/onboarding/fetch-site"

const MAX_LINKS = 300
const SKIPPED_PROTOCOLS = new Set([
  "mailto:",
  "tel:",
  "javascript:",
  "data:",
  "vbscript:",
])
const REL_TOKENS = new Set(["nofollow", "ugc", "sponsored"])

export type LinkRelType = "nofollow" | "ugc" | "sponsored"

export type PageLink = {
  href: string
  anchorText: string
  isDofollow: boolean
  relTypes: LinkRelType[]
  isInternal: boolean
}

export type PageLinksResult = {
  finalUrl: string
  totalLinks: number
  dofollowCount: number
  nofollowCount: number
  internalCount: number
  externalCount: number
  wasTruncated: boolean
  links: PageLink[]
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function resolveHref(rawHref: string, baseUrl: string): URL | null {
  try {
    const resolved = new URL(rawHref.trim(), baseUrl)

    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
      return null
    }

    return resolved
  } catch {
    return null
  }
}

export async function fetchPageLinks(url: string): Promise<PageLinksResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetchWithValidatedRedirects(url, controller.signal)

    if (!response.ok) {
      throw new Error(`Page request failed with status ${response.status}`)
    }

    const contentType = response.headers.get("content-type") ?? ""

    if (!isHtmlContentType(contentType)) {
      throw new Error("The URL did not return an HTML page")
    }

    const { html, wasTruncated: htmlTruncated } = await readHtmlBody(response)
    const root = parse(html)
    const finalUrl = response.url
    const pageHostname = new URL(finalUrl).hostname.replace(/^www\./, "")

    const seen = new Set<string>()
    const links: PageLink[] = []
    let linkListTruncated = false

    for (const anchor of root.querySelectorAll("a")) {
      const rawHref = anchor.getAttribute("href")

      if (!rawHref) {
        continue
      }

      const trimmedHref = rawHref.trim()

      if (
        !trimmedHref ||
        trimmedHref.startsWith("#") ||
        [...SKIPPED_PROTOCOLS].some((protocol) =>
          trimmedHref.toLowerCase().startsWith(protocol)
        )
      ) {
        continue
      }

      const resolved = resolveHref(trimmedHref, finalUrl)

      if (!resolved) {
        continue
      }

      resolved.hash = ""
      const normalizedHref = resolved.toString()

      if (seen.has(normalizedHref)) {
        continue
      }
      seen.add(normalizedHref)

      if (links.length >= MAX_LINKS) {
        linkListTruncated = true
        break
      }

      const relAttribute = (anchor.getAttribute("rel") ?? "").toLowerCase()
      const relTypes = relAttribute
        .split(/\s+/)
        .filter((token): token is LinkRelType =>
          REL_TOKENS.has(token as LinkRelType)
        )

      const anchorText =
        normalizeText(anchor.textContent) || normalizedHref

      const isInternal =
        resolved.hostname.replace(/^www\./, "") === pageHostname

      links.push({
        href: normalizedHref,
        anchorText,
        isDofollow: relTypes.length === 0,
        relTypes,
        isInternal,
      })
    }

    const dofollowCount = links.filter((link) => link.isDofollow).length
    const internalCount = links.filter((link) => link.isInternal).length

    return {
      finalUrl,
      totalLinks: links.length,
      dofollowCount,
      nofollowCount: links.length - dofollowCount,
      internalCount,
      externalCount: links.length - internalCount,
      wasTruncated: htmlTruncated || linkListTruncated,
      links,
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The page took too long to respond")
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}
