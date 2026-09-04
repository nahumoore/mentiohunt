import type { SiteContext } from "../methods/guest-post-sites/types.js"

/** Parses the site-context payload the free-tool web routes forward from `fetchSiteDetails`. */
export function parseSiteContext(raw: unknown): SiteContext | undefined {
  if (!raw || typeof raw !== "object") return undefined
  const obj = raw as Record<string, unknown>

  return {
    title: typeof obj.title === "string" ? obj.title : null,
    metaDescription: typeof obj.metaDescription === "string" ? obj.metaDescription : null,
    h1: Array.isArray(obj.h1) ? obj.h1.filter((value): value is string => typeof value === "string") : [],
    paragraphs: Array.isArray(obj.paragraphs)
      ? obj.paragraphs.filter((value): value is string => typeof value === "string")
      : [],
  }
}
