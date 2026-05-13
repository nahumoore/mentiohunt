export type ArticleHeading = {
  id: string
  depth: 2 | 3
  text: string
}

export function createHeadingId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-")
}

function getHeadingText(value: string): string {
  return value
    .replace(/\s+\{#[\w-]+\}\s*$/, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[~*_]/g, "")
    .trim()
}

export function getArticleHeadings(source: string): ArticleHeading[] {
  return source
    .split("\n")
    .map((line) => {
      const match = /^(#{2,3})\s+(.+)$/.exec(line.trim())

      if (!match) return null

      const text = getHeadingText(match[2] ?? "")

      if (!text) return null

      return {
        id: createHeadingId(text),
        depth: match[1]?.length as 2 | 3,
        text,
      }
    })
    .filter((heading): heading is ArticleHeading => heading !== null)
}
