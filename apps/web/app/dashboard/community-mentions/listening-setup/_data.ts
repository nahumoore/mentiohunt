import type { ElementType } from "react"
import {
  IconAlertCircle,
  IconCircleCheck,
  IconHash,
  IconMessageCircle,
  IconPlayerPause,
  IconSearch,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react"

export type ListeningPlatform = "reddit" | "x" | "linkedin" | "hacker_news" | "forum"
export type ListeningSourceType = "keyword_search" | "subreddit" | "hashtag" | "community" | "manual_url"
export type ListeningSourceStatus = "active" | "paused" | "error"

export interface ListeningSource {
  id: string
  platform: ListeningPlatform
  sourceType: ListeningSourceType
  label: string
  query: string
  url: string | null
  postsFound: number
  qualifiedMentions: number
  lastScannedAt: string
  status: ListeningSourceStatus
}

export interface ListeningTopics {
  productKeywords: string[]
  competitorNames: string[]
  painPoints: string[]
  excludedTerms: string[]
}

export interface ReplyGuidelines {
  tone: string
  ctaStyle: string
  preferredDisclosure: string
  maxReplyLength: number
  blockedClaims: string[]
}

export interface ConfigItem {
  label: string
  icon: ElementType
  color: string
}

export const PLATFORM_CONFIG: Record<ListeningPlatform, ConfigItem> = {
  reddit: {
    label: "Reddit",
    icon: IconMessageCircle,
    color: "text-orange-600 bg-orange-500/10",
  },
  x: {
    label: "X",
    icon: IconHash,
    color: "text-slate-700 bg-slate-500/10",
  },
  linkedin: {
    label: "LinkedIn",
    icon: IconUsers,
    color: "text-blue-600 bg-blue-500/10",
  },
  hacker_news: {
    label: "Hacker News",
    icon: IconSearch,
    color: "text-amber-600 bg-amber-500/10",
  },
  forum: {
    label: "Forum",
    icon: IconWorld,
    color: "text-teal-600 bg-teal-500/10",
  },
}

export const SOURCE_TYPE_CONFIG: Record<ListeningSourceType, ConfigItem> = {
  keyword_search: {
    label: "Keyword search",
    icon: IconSearch,
    color: "text-blue-600 bg-blue-500/10",
  },
  subreddit: {
    label: "Subreddit",
    icon: IconMessageCircle,
    color: "text-orange-600 bg-orange-500/10",
  },
  hashtag: {
    label: "Hashtag",
    icon: IconHash,
    color: "text-slate-700 bg-slate-500/10",
  },
  community: {
    label: "Community",
    icon: IconUsers,
    color: "text-purple-600 bg-purple-500/10",
  },
  manual_url: {
    label: "Manual URL",
    icon: IconWorld,
    color: "text-teal-600 bg-teal-500/10",
  },
}

export const SOURCE_STATUS_CONFIG: Record<ListeningSourceStatus, ConfigItem> = {
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

export const MOCK_LISTENING_SOURCES: ListeningSource[] = [
  {
    id: "ls-1",
    platform: "reddit",
    sourceType: "subreddit",
    label: "r/SEO",
    query: "backlink tools OR link building workflow OR Ahrefs alternative",
    url: "https://reddit.com/r/SEO",
    postsFound: 84,
    qualifiedMentions: 19,
    lastScannedAt: "2026-05-07T09:05:00Z",
    status: "active",
  },
  {
    id: "ls-2",
    platform: "x",
    sourceType: "keyword_search",
    label: "Founder backlink pain",
    query: "\"Ahrefs alternative\" OR \"backlink prospects\" OR \"link building SaaS\"",
    url: null,
    postsFound: 52,
    qualifiedMentions: 11,
    lastScannedAt: "2026-05-07T08:40:00Z",
    status: "active",
  },
  {
    id: "ls-3",
    platform: "linkedin",
    sourceType: "community",
    label: "SaaS Growth Operators",
    query: "backlinks, mentions, SEO tools, outreach workflow",
    url: "https://linkedin.com/groups/saas-growth-operators",
    postsFound: 31,
    qualifiedMentions: 6,
    lastScannedAt: "2026-05-06T18:15:00Z",
    status: "active",
  },
  {
    id: "ls-4",
    platform: "hacker_news",
    sourceType: "keyword_search",
    label: "Ask HN mention discovery",
    query: "mentions OR backlinks OR launch distribution OR credible sites",
    url: "https://news.ycombinator.com/ask",
    postsFound: 18,
    qualifiedMentions: 4,
    lastScannedAt: "2026-05-06T13:20:00Z",
    status: "active",
  },
  {
    id: "ls-5",
    platform: "forum",
    sourceType: "community",
    label: "Indie Hackers",
    query: "link building, outreach, first mentions, SEO distribution",
    url: "https://indiehackers.com",
    postsFound: 27,
    qualifiedMentions: 5,
    lastScannedAt: "2026-05-05T22:30:00Z",
    status: "paused",
  },
  {
    id: "ls-6",
    platform: "reddit",
    sourceType: "subreddit",
    label: "r/MarketingAutomation",
    query: "prospecting automation OR outreach queue",
    url: "https://reddit.com/r/MarketingAutomation",
    postsFound: 0,
    qualifiedMentions: 0,
    lastScannedAt: "2026-05-05T11:10:00Z",
    status: "error",
  },
]

export const MOCK_LISTENING_TOPICS: ListeningTopics = {
  productKeywords: [
    "backlink prospecting",
    "link building workflow",
    "unlinked mentions",
    "outreach queue",
    "competitor mentions",
  ],
  competitorNames: ["Ahrefs", "Semrush", "BuzzStream", "Pitchbox", "Respona"],
  painPoints: [
    "manual prospecting takes too long",
    "too many low-fit domains",
    "no clear next outreach action",
    "enterprise SEO suites are overkill",
  ],
  excludedTerms: [
    "job postings",
    "affiliate coupons",
    "black hat links",
    "PBN",
  ],
}

export const MOCK_REPLY_GUIDELINES: ReplyGuidelines = {
  tone: "Helpful, founder-led, specific, and non-salesy.",
  ctaStyle: "Use a soft offer only when the post asks for tools or workflows.",
  preferredDisclosure: "I'm building Mentiohunt around this problem.",
  maxReplyLength: 650,
  blockedClaims: [
    "Guaranteed backlinks",
    "Fully automated acquisition",
    "Verified contact intelligence",
    "Instant SEO results",
  ],
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
