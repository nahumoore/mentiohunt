export type CompetitorTargetPage = {
  id: string
  url: string
  title: string | null
  priority: number
  keywords: string[]
  matchedKeywords: string[]
}

type BacklinkContext = {
  urlTo: string
  anchor: string
  title: string
  textPre: string
  textPost: string
}

function tokens(value: string): Set<string> {
  const noise = new Set(["com", "www", "http", "https", "html", "htm", "the", "and", "for", "with"])
  return new Set(
    value
      .toLowerCase()
      .replace(/https?:\/\//g, " ")
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 3 && !noise.has(token))
  )
}

export function matchCompetitorTargetPage(
  item: BacklinkContext,
  pages: CompetitorTargetPage[]
): CompetitorTargetPage | null {
  if (pages.length === 0) return null
  const context = tokens([item.urlTo, item.anchor, item.title, item.textPre, item.textPost].join(" "))

  return [...pages]
    .map((page) => {
      const pageTokens = tokens(
        [page.url, page.title ?? "", ...page.keywords, ...page.matchedKeywords].join(" ")
      )
      const overlap = [...pageTokens].filter((token) => context.has(token)).length
      return { page, overlap }
    })
    .sort((a, b) => b.overlap - a.overlap || a.page.priority - b.page.priority)[0]?.page ?? null
}
