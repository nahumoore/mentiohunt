import type { MetadataRoute } from "next"
import { getResourceSlugs } from "@/lib/mdx"

export default function sitemap(): MetadataRoute.Sitemap {
  const altSlugs = getResourceSlugs("alternatives")

  return [
    { url: "https://mentiohunt.com", lastModified: new Date("2026-05-08"), priority: 1 },
    { url: "https://mentiohunt.com/pricing", lastModified: new Date("2026-05-08"), priority: 0.8 },
    { url: "https://mentiohunt.com/about", lastModified: new Date("2026-05-08"), priority: 0.7 },
    { url: "https://mentiohunt.com/alternatives", lastModified: new Date("2026-05-08"), priority: 0.8 },
    ...altSlugs.map((slug) => ({
      url: `https://mentiohunt.com/alternatives/${slug}`,
      priority: 0.7 as const,
    })),
    { url: "https://mentiohunt.com/privacy", priority: 0.3 as const },
    { url: "https://mentiohunt.com/tos", priority: 0.3 as const },
  ]
}
