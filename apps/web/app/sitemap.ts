import type { MetadataRoute } from "next"

import { features } from "@/consts/features"
import { ALL_FREE_TOOL_SLUGS } from "@/consts/free-tools"
import { getResourceSlugs } from "@/lib/mdx"
import { ALL_MONITORING_CONFIGS } from "@/consts/community-monitoring"

export default function sitemap(): MetadataRoute.Sitemap {
  const altSlugs = getResourceSlugs("alternatives")
  const articleSlugs = getResourceSlugs("articles")
  const backlinksFromSlugs = getResourceSlugs("backlinks-from")
  const compareSlugs = getResourceSlugs("compare")

  return [
    {
      url: "https://mentiohunt.com",
      lastModified: new Date("2026-05-08"),
      priority: 1,
    },
    {
      url: "https://mentiohunt.com/pricing",
      lastModified: new Date("2026-05-08"),
      priority: 0.8,
    },
    {
      url: "https://mentiohunt.com/about",
      lastModified: new Date("2026-05-08"),
      priority: 0.7,
    },
    {
      url: "https://mentiohunt.com/features",
      lastModified: new Date("2026-05-12"),
      priority: 0.8,
    },
    ...features.map((feature) => ({
      url: `https://mentiohunt.com/features/${feature.slug}`,
      lastModified: new Date(feature.updatedAt),
      priority: 0.75 as const,
    })),
    {
      url: "https://mentiohunt.com/blog",
      lastModified: new Date("2026-05-13"),
      priority: 0.8,
    },
    ...articleSlugs.map((slug) => ({
      url: `https://mentiohunt.com/blog/${slug}`,
      priority: 0.75 as const,
    })),
    {
      url: "https://mentiohunt.com/backlinks-from",
      lastModified: new Date("2026-05-16"),
      priority: 0.8,
    },
    ...backlinksFromSlugs.map((slug) => ({
      url: `https://mentiohunt.com/backlinks-from/${slug}`,
      priority: 0.75 as const,
    })),
    {
      url: "https://mentiohunt.com/alternatives",
      lastModified: new Date("2026-05-08"),
      priority: 0.8,
    },
    ...altSlugs.map((slug) => ({
      url: `https://mentiohunt.com/alternatives/${slug}`,
      priority: 0.7 as const,
    })),
    {
      url: "https://mentiohunt.com/compare",
      lastModified: new Date("2026-05-26"),
      priority: 0.8,
    },
    ...compareSlugs.map((slug) => ({
      url: `https://mentiohunt.com/compare/${slug}`,
      priority: 0.75 as const,
    })),
    {
      url: "https://mentiohunt.com/free-tools",
      lastModified: new Date("2026-05-15"),
      priority: 0.8,
    },
    ...ALL_FREE_TOOL_SLUGS.map((slug) => ({
      url: `https://mentiohunt.com/free-tools/${slug}`,
      lastModified: new Date("2026-06-08"),
      priority: 0.75 as const,
    })),
    {
      url: "https://mentiohunt.com/directory-submission",
      lastModified: new Date("2026-05-15"),
      priority: 0.7,
    },
    ...ALL_MONITORING_CONFIGS.map((config) => ({
      url: `https://mentiohunt.com/${config.slug}`,
      lastModified: new Date("2026-06-08"),
      priority: 0.8 as const,
    })),
    { url: "https://mentiohunt.com/privacy", priority: 0.3 as const },
    { url: "https://mentiohunt.com/tos", priority: 0.3 as const },
  ]
}
