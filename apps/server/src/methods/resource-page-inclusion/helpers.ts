import type { TargetPageForInclusion } from "./score-resource-page-inclusion.js"

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.hash = ""
    const value = parsed.toString()
    return value.endsWith("/") ? value.slice(0, -1) : value
  } catch {
    return url.replace(/#.*$/, "").replace(/\/$/, "")
  }
}

export function limitNumber(value: number | undefined, fallback: number, min = 1): number {
  return Number.isFinite(value) && value !== undefined && value >= min ? Math.floor(value) : fallback
}

export function cleanKeyword(value: string): string {
  return value.replace(/["“”]/g, "").replace(/\s+/g, " ").trim().slice(0, 80)
}

export function fallbackKeywords(page: TargetPageForInclusion): string[] {
  const title = page.title?.trim()
  if (!title) return []
  return [title.replace(/[|:–-].*$/, "").trim()].filter(Boolean)
}

export function queryKey(pageId: string, query: string): string {
  return `${pageId}::${query}`
}

export function rememberLatest(map: Map<string, string>, key: string, timestamp: string): void {
  const current = map.get(key)
  if (!current || timestamp > current) map.set(key, timestamp)
}

export function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

export function readObjectArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object")
    : []
}
