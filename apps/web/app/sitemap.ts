import type { MetadataRoute } from "next"

import { getOutreachTemplateSlugs } from "@/components/outreach-templates"
import { features } from "@/consts/features"
import { ALL_FREE_TOOL_SLUGS } from "@/consts/free-tools"
import { getAllResources } from "@/lib/mdx"

export default function sitemap(): MetadataRoute.Sitemap {
  const alternatives = getAllResources("alternatives")
  const articles = getAllResources("articles")
  const backlinksFrom = getAllResources("backlinks-from")
  const compare = getAllResources("compare")
  const outreachTemplateSlugs = getOutreachTemplateSlugs()

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
    ...articles.map((post) => ({
      url: `https://mentiohunt.com/blog/${post.slug}`,
      lastModified: new Date(post.dateModified ?? post.date),
      priority: 0.75 as const,
    })),
    {
      url: "https://mentiohunt.com/backlinks-from",
      lastModified: new Date("2026-05-16"),
      priority: 0.8,
    },
    ...backlinksFrom.map((post) => ({
      url: `https://mentiohunt.com/backlinks-from/${post.slug}`,
      lastModified: new Date(post.dateModified ?? post.date),
      priority: 0.75 as const,
    })),
    {
      url: "https://mentiohunt.com/alternatives",
      lastModified: new Date("2026-05-08"),
      priority: 0.8,
    },
    ...alternatives.map((post) => ({
      url: `https://mentiohunt.com/alternatives/${post.slug}`,
      lastModified: new Date(post.dateModified ?? post.date),
      priority: 0.7 as const,
    })),
    {
      url: "https://mentiohunt.com/compare",
      lastModified: new Date("2026-05-26"),
      priority: 0.8,
    },
    ...compare.map((post) => ({
      url: `https://mentiohunt.com/compare/${post.slug}`,
      lastModified: new Date(post.dateModified ?? post.date),
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
    {
      url: "https://mentiohunt.com/outreach-templates",
      lastModified: new Date("2026-07-25"),
      priority: 0.8,
    },
    ...outreachTemplateSlugs.map((slug) => ({
      url: `https://mentiohunt.com/outreach-templates/${slug}`,
      lastModified: new Date("2026-07-25"),
      priority: 0.75 as const,
    })),
    {
      url: "https://mentiohunt.com/link-building-outreach-statistics-2026",
      lastModified: new Date("2026-08-19"),
      priority: 0.75,
    },
    { url: "https://mentiohunt.com/privacy", priority: 0.3 as const },
    { url: "https://mentiohunt.com/tos", priority: 0.3 as const },
  ]
}
