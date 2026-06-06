import {
  SCRAPERLINK_GOOGLE_SERP,
  type GoogleSerpInput,
  type GoogleSerpItem,
} from "../actors/google-serp-scraper.js"
import { runApifyActor } from "../actors/run-apify-actor.js"
import { createLogger } from "../logger.js"

const log = createLogger("facebook-search")

export interface FacebookPost {
  id: string
  title: string | null
  text: string
  url: string
}

function urlToId(url: string): string {
  try {
    const parsed = new URL(url)
    const path = (parsed.hostname + parsed.pathname)
      .replace(/^www\./, "")
      .replace(/\/+$/, "")
    return path
  } catch {
    return url.slice(0, 200)
  }
}

export async function searchFacebook(
  keyword: string,
  limit = 20
): Promise<FacebookPost[]> {
  const query = `"${keyword}" site:facebook.com`

  let items: GoogleSerpItem[]
  try {
    items = await runApifyActor<GoogleSerpItem[]>(
      SCRAPERLINK_GOOGLE_SERP,
      {
        keyword: query,
        limit: String(limit),
        country: "US",
        include_merged: false,
      } satisfies GoogleSerpInput,
      90
    )
  } catch (err) {
    log.warn("facebook serp search failed", { keyword, error: String(err) })
    return []
  }

  const results = items.flatMap((item) => item.results ?? [])

  return results
    .filter((r) => Boolean(r.url))
    .map((r) => ({
      id: urlToId(r.url!),
      title: r.title ?? null,
      text: r.description ?? "",
      url: r.url!,
    }))
}
