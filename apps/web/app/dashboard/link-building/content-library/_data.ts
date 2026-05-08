import type { ElementType } from "react"
import {
  IconPencil,
  IconSitemap,
  IconEye,
  IconEyeOff,
  IconCircleCheck,
  IconPlayerPause,
  IconAlertCircle,
} from "@tabler/icons-react"

export type ArticleSource = "manual" | "sitemap"
export type ArticleStatus = "active" | "disabled"
export type SitemapStatus = "active" | "paused" | "error"

export interface Sitemap {
  id: string
  url: string
  articlesDiscovered: number
  lastCrawledAt: string
  status: SitemapStatus
}

export interface Article {
  id: string
  title: string
  url: string
  excerpt: string
  publishedAt: string
  source: ArticleSource
  sitemapId: string | null
  wordCount: number
  targetKeywords: string[]
  topics: string[]
  opportunityCount: number
  status: ArticleStatus
  addedAt: string
}

export const MOCK_SITEMAPS: Sitemap[] = [
  {
    id: "s1",
    url: "https://mentiohunt.com/sitemap.xml",
    articlesDiscovered: 18,
    lastCrawledAt: "2026-05-07",
    status: "active",
  },
  {
    id: "s2",
    url: "https://blog.mentiohunt.com/sitemap-posts.xml",
    articlesDiscovered: 6,
    lastCrawledAt: "2026-05-06",
    status: "paused",
  },
  {
    id: "s3",
    url: "https://mentiohunt.com/sitemap-pages.xml",
    articlesDiscovered: 0,
    lastCrawledAt: "2026-05-05",
    status: "error",
  },
]

export const MOCK_ARTICLES: Article[] = [
  {
    id: "a1",
    title: "How to Build a Backlink Prospect Queue Without an Enterprise Budget",
    url: "https://mentiohunt.com/blog/backlink-prospect-queue",
    excerpt:
      "Step-by-step guide for founders who want a repeatable link building workflow without paying $500/month for Ahrefs.",
    publishedAt: "2026-04-20",
    source: "sitemap",
    sitemapId: "s1",
    wordCount: 2_800,
    targetKeywords: ["backlink prospecting", "link building for founders", "affordable link building"],
    topics: ["Link Building", "SEO", "Founder Tools"],
    opportunityCount: 7,
    status: "active",
    addedAt: "2026-05-01",
  },
  {
    id: "a2",
    title: "Unlinked Mentions: The Fastest Backlinks You're Not Claiming",
    url: "https://mentiohunt.com/blog/unlinked-mentions",
    excerpt:
      "Brands mention you without linking. Here's how to find them, qualify them, and convert them into backlinks in under 30 minutes.",
    publishedAt: "2026-04-10",
    source: "sitemap",
    sitemapId: "s1",
    wordCount: 1_950,
    targetKeywords: ["unlinked mentions", "brand mentions seo", "claim unlinked mentions"],
    topics: ["Link Building", "Brand Monitoring"],
    opportunityCount: 4,
    status: "active",
    addedAt: "2026-05-01",
  },
  {
    id: "a3",
    title: "Broken Link Building: A Practical Guide for Small Sites",
    url: "https://mentiohunt.com/blog/broken-link-building",
    excerpt:
      "Find dead links on authoritative pages, propose your content as a replacement, and earn high-DR backlinks with minimal cold outreach friction.",
    publishedAt: "2026-03-28",
    source: "sitemap",
    sitemapId: "s1",
    wordCount: 3_200,
    targetKeywords: ["broken link building", "dead link outreach", "replace broken links"],
    topics: ["Link Building", "Outreach"],
    opportunityCount: 12,
    status: "active",
    addedAt: "2026-05-01",
  },
  {
    id: "a4",
    title: "Why Competitor Backlink Analysis Is Your Fastest Research Shortcut",
    url: "https://mentiohunt.com/blog/competitor-backlink-analysis",
    excerpt:
      "If they linked to your competitor, they're already interested in your niche. Learn how to turn competitor link profiles into your own prospect list.",
    publishedAt: "2026-03-15",
    source: "sitemap",
    sitemapId: "s1",
    wordCount: 2_100,
    targetKeywords: ["competitor backlink analysis", "steal competitor backlinks", "link gap analysis"],
    topics: ["Competitor Analysis", "Link Building"],
    opportunityCount: 9,
    status: "active",
    addedAt: "2026-05-01",
  },
  {
    id: "a5",
    title: "Guest Post Pitching: What Editors Actually Want to See",
    url: "https://blog.mentiohunt.com/guest-post-pitching",
    excerpt:
      "Most guest post pitches are ignored. This guide breaks down what separates accepted pitches from the ones that get deleted in 3 seconds.",
    publishedAt: "2026-02-18",
    source: "sitemap",
    sitemapId: "s2",
    wordCount: 1_750,
    targetKeywords: ["guest post pitch", "how to pitch guest posts", "write for us outreach"],
    topics: ["Guest Posting", "Outreach"],
    opportunityCount: 3,
    status: "disabled",
    addedAt: "2026-05-02",
  },
  {
    id: "a6",
    title: "Mentiohunt vs Ahrefs: Which Is Right for a Solo Founder?",
    url: "https://mentiohunt.com/vs/ahrefs",
    excerpt:
      "Honest comparison of Mentiohunt and Ahrefs for founders who don't need an enterprise suite but still want qualified backlink opportunities.",
    publishedAt: "2026-04-30",
    source: "manual",
    sitemapId: null,
    wordCount: 1_400,
    targetKeywords: ["mentiohunt vs ahrefs", "ahrefs alternative for founders", "cheap ahrefs alternative"],
    topics: ["Product Comparison", "SEO Tools"],
    opportunityCount: 5,
    status: "active",
    addedAt: "2026-05-03",
  },
  {
    id: "a7",
    title: "Outreach Templates That Don't Sound Like Templates",
    url: "https://mentiohunt.com/blog/outreach-templates",
    excerpt:
      "Copy-paste outreach rarely works. Here are the angles that convert — with real examples from campaigns that landed placements on DR 70+ sites.",
    publishedAt: "2026-04-05",
    source: "manual",
    sitemapId: null,
    wordCount: 2_600,
    targetKeywords: ["link building outreach templates", "backlink outreach email", "seo outreach"],
    topics: ["Outreach", "Templates"],
    opportunityCount: 0,
    status: "active",
    addedAt: "2026-05-04",
  },
]

export interface SourceConfig {
  label: string
  icon: ElementType
  color: string
}

export interface StatusConfig {
  label: string
  icon: ElementType
  color: string
}

export const SOURCE_CONFIG: Record<ArticleSource, SourceConfig> = {
  manual: {
    label: "Manual",
    icon: IconPencil,
    color: "text-purple-600 bg-purple-500/10",
  },
  sitemap: {
    label: "Sitemap",
    icon: IconSitemap,
    color: "text-blue-600 bg-blue-500/10",
  },
}

export const ARTICLE_STATUS_CONFIG: Record<ArticleStatus, StatusConfig> = {
  active: {
    label: "Active",
    icon: IconEye,
    color: "text-emerald-600",
  },
  disabled: {
    label: "Disabled",
    icon: IconEyeOff,
    color: "text-muted-foreground",
  },
}

export const SITEMAP_STATUS_CONFIG: Record<SitemapStatus, { label: string; icon: ElementType; color: string }> = {
  active: {
    label: "Active",
    icon: IconCircleCheck,
    color: "text-emerald-600 bg-emerald-500/10",
  },
  paused: {
    label: "Paused",
    icon: IconPlayerPause,
    color: "text-amber-600 bg-amber-500/10",
  },
  error: {
    label: "Error",
    icon: IconAlertCircle,
    color: "text-red-600 bg-red-500/10",
  },
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatWordCount(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k words`
  return `${n} words`
}
