import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://mentiohunt.com", lastModified: new Date(), priority: 1 },
    { url: "https://mentiohunt.com/pricing", lastModified: new Date(), priority: 0.8 },
    { url: "https://mentiohunt.com/privacy", priority: 0.3 },
    { url: "https://mentiohunt.com/tos", priority: 0.3 },
  ]
}
