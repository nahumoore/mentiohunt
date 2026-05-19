import type { ElementType } from "react"
import {
  IconAlertCircle,
  IconBookmark,
  IconBulb,
  IconCircleX,
  IconHelpCircle,
  IconMessageCircle,
  IconMessages,
  IconSend,
  IconSparkles,
  IconSwords,
} from "@tabler/icons-react"

import type { MentionPlatform } from "@/consts/platform-config"

export type MentionIntent =
  | "asking_for_tool"
  | "competitor_alternative"
  | "pain_point"
  | "how_to"
  | "complaint"
  | "discussion"

export type MentionStatus = "new" | "saved" | "replied" | "dismissed"

export interface CommunityMention {
  id: string
  platform: MentionPlatform
  sourceName: string
  postUrl: string
  postTitle: string
  postExcerpt: string
  authorName: string
  authorProfileUrl: string | null
  postedAt: string
  discoveredAt: string
  intent: MentionIntent
  relevanceScore: number
  fitReason: string
  matchedSignals: string[]
  productAngle: string
  replyDraft: string
  safetyNotes: string[]
  engagement: {
    comments: number
    reactions: number
    views: number | null
  }
  status: MentionStatus
  nextAction: string
}

export interface BadgeConfig {
  label: string
  icon: ElementType
  color: string
}

export const SORT_OPTIONS: { value: MentionSortKey; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "date", label: "Date Posted" },
  { value: "reactions", label: "Most Reactions" },
  { value: "comments", label: "Most Comments" },
]

export type MentionSortKey = "relevance" | "date" | "reactions" | "comments"

export const INTENT_CONFIG: Record<MentionIntent, BadgeConfig> = {
  asking_for_tool: {
    label: "Asking for tool",
    icon: IconHelpCircle,
    color: "text-blue-600 bg-blue-500/10",
  },
  competitor_alternative: {
    label: "Competitor alternative",
    icon: IconSwords,
    color: "text-orange-600 bg-orange-500/10",
  },
  pain_point: {
    label: "Pain point",
    icon: IconAlertCircle,
    color: "text-red-600 bg-red-500/10",
  },
  how_to: {
    label: "How-to",
    icon: IconBulb,
    color: "text-amber-600 bg-amber-500/10",
  },
  complaint: {
    label: "Complaint",
    icon: IconMessageCircle,
    color: "text-purple-600 bg-purple-500/10",
  },
  discussion: {
    label: "Discussion",
    icon: IconMessages,
    color: "text-cyan-600 bg-cyan-500/10",
  },
}

export const STATUS_CONFIG: Record<MentionStatus, BadgeConfig> = {
  new: {
    label: "New",
    icon: IconSparkles,
    color: "text-blue-600 bg-blue-500/10",
  },
  saved: {
    label: "Saved",
    icon: IconBookmark,
    color: "text-purple-600 bg-purple-500/10",
  },
  replied: {
    label: "Replied",
    icon: IconSend,
    color: "text-emerald-600 bg-emerald-500/10",
  },
  dismissed: {
    label: "Dismissed",
    icon: IconCircleX,
    color: "text-muted-foreground bg-muted",
  },
}

export const MOCK_COMMUNITY_MENTIONS: CommunityMention[] = [
  {
    id: "cm-1",
    platform: "reddit",
    sourceName: "r/SEO",
    postUrl: "https://reddit.com/r/SEO/comments/mentiohunt_backlink_prospecting_queue",
    postTitle: "How are small teams finding link opportunities without living in Ahrefs?",
    postExcerpt:
      "We're a tiny SaaS team and I need a repeatable way to find backlink prospects. Ahrefs is useful, but I still end up with a spreadsheet and no clear next action.",
    authorName: "growth_scrappy",
    authorProfileUrl: "https://reddit.com/user/growth_scrappy",
    postedAt: "2026-05-07T08:15:00Z",
    discoveredAt: "2026-05-07T09:05:00Z",
    intent: "asking_for_tool",
    relevanceScore: 96,
    fitReason:
      "The post asks for a lightweight backlink prospecting workflow and specifically mentions the gap Mentiohunt solves: turning research into a prioritized action queue.",
    matchedSignals: ["backlink prospects", "small SaaS team", "Ahrefs", "next action"],
    productAngle:
      "Position Mentiohunt as a daily queue for qualified opportunities, not another analytics suite.",
    replyDraft: `If your main pain is turning research into an actual queue, you may want a workflow that separates discovery from action.

One lightweight setup is: define your competitors and target keywords once, scan for resource pages/listicles/competitor mentions, then score each result by fit and write the outreach angle before it hits your queue.

I'm building Mentiohunt around that exact flow for founders and small agencies. It is less about backlink analytics and more about surfacing the next opportunity worth acting on. Happy to share the setup checklist if useful.`,
    safetyNotes: [
      "Disclose affiliation before naming Mentiohunt.",
      "Avoid implying the tool guarantees backlinks.",
    ],
    engagement: {
      comments: 18,
      reactions: 42,
      views: null,
    },
    status: "new",
    nextAction: "Review reply and post today",
  },
  {
    id: "cm-2",
    platform: "bluesky",
    sourceName: "bsky.app",
    postUrl: "https://bsky.app/profile/founderops.bsky.social/post/1",
    postTitle: "Ahrefs is overkill for what I need",
    postExcerpt:
      "I don't need another giant SEO suite. I need something that tells me which relevant sites to contact this week and why.",
    authorName: "founderops.bsky.social",
    authorProfileUrl: "https://bsky.app/profile/founderops.bsky.social",
    postedAt: "2026-05-06T17:40:00Z",
    discoveredAt: "2026-05-06T18:10:00Z",
    intent: "competitor_alternative",
    relevanceScore: 91,
    fitReason:
      "The author is actively contrasting a broad SEO suite with a smaller workflow for weekly outreach decisions, which maps directly to Mentiohunt's positioning.",
    matchedSignals: ["Ahrefs", "SEO suite", "contact this week", "why"],
    productAngle:
      "Emphasize focused opportunity discovery and plain-language rationale.",
    replyDraft: `This is exactly the split I keep seeing: analytics tools are great for investigation, but they don't always answer "what should I do next?"

I'm building Mentiohunt for the narrower job: scan for relevant backlink/mention opportunities, score the fit, and queue each one with the outreach angle already explained.

Not a replacement for every Ahrefs workflow, but useful if your weekly goal is "who should I contact and why?"`,
    safetyNotes: [
      "Keep the tone conversational and avoid dunking on Ahrefs.",
      "Bluesky threads move fast — reply within the hour for best visibility.",
    ],
    engagement: {
      comments: 9,
      reactions: 61,
      views: 8200,
    },
    status: "saved",
    nextAction: "Trim reply for thread length",
  },
  {
    id: "cm-3",
    platform: "reddit",
    sourceName: "r/SaaS",
    postUrl: "https://reddit.com/r/SaaS/comments/bootstrapped_backlinks",
    postTitle: "What backlink workflows are actually working for bootstrapped SaaS?",
    postExcerpt:
      "Cold outreach still works when the target is right, but the research step is brutal. Curious what people are using to find relevant pages and not just random domains.",
    authorName: "buildinpublic_99",
    authorProfileUrl: "https://reddit.com/user/buildinpublic_99",
    postedAt: "2026-05-06T12:00:00Z",
    discoveredAt: "2026-05-06T12:35:00Z",
    intent: "discussion",
    relevanceScore: 86,
    fitReason:
      "The thread asks for workflow recommendations and frames quality/relevance as the main bottleneck, making it a good fit for a helpful process-first reply.",
    matchedSignals: ["bootstrapped SaaS", "research step", "relevant pages", "cold outreach"],
    productAngle:
      "Lead with a practical scoring workflow, then mention Mentiohunt as one way to run it.",
    replyDraft: `The teams I see getting traction usually narrow the research step before they ever write outreach.

They start with: competitor mentions, resource pages in the category, listicles that already compare tools, and articles where their own content fills a clear gap. Then they score each page on relevance, freshness, and the exact reason an editor would care.

I'm working on Mentiohunt to turn that into a daily queue, but the important part is the scoring discipline: don't contact a domain unless you can explain the fit in one sentence.`,
    safetyNotes: [
      "This is a professional group; keep the reply educational first.",
      "Avoid pushing a demo unless someone asks.",
    ],
    engagement: {
      comments: 27,
      reactions: 118,
      views: 15200,
    },
    status: "new",
    nextAction: "Post as educational comment",
  },
  {
    id: "cm-4",
    platform: "bluesky",
    sourceName: "bsky.app",
    postUrl: "https://bsky.app/profile/indie.hacker/post/2",
    postTitle: "How do you get the first credible mentions for a new B2B tool?",
    postExcerpt:
      "Paid acquisition is noisy in our niche. I'm trying to find credible places where our tool can be mentioned naturally without spamming communities.",
    authorName: "indie.hacker",
    authorProfileUrl: "https://bsky.app/profile/indie.hacker",
    postedAt: "2026-05-05T20:25:00Z",
    discoveredAt: "2026-05-05T21:00:00Z",
    intent: "how_to",
    relevanceScore: 79,
    fitReason:
      "The post is about finding legitimate mention opportunities and explicitly worries about spam, which is a good opening for a careful, workflow-based answer.",
    matchedSignals: ["credible mentions", "B2B tool", "naturally", "without spamming"],
    productAngle:
      "Recommend high-fit opportunity categories and keep the product mention secondary.",
    replyDraft: `The least spammy path is usually to look for existing intent rather than trying to create it.

For a B2B tool, I would start with pages already discussing your category: competitor alternatives, resource lists, "best tools for X" posts, and forum threads where people are asking for workflows. The key is to write down why your product improves that specific page or thread before reaching out.

I'm building a tool called Mentiohunt around this kind of discovery queue, but you can do the first pass manually with saved searches and a simple scoring sheet.`,
    safetyNotes: [
      "Keep the product mention transparent and brief.",
      "Lead with the manual advice first to build credibility.",
    ],
    engagement: {
      comments: 14,
      reactions: 88,
      views: null,
    },
    status: "new",
    nextAction: "Reply with manual workflow first",
  },
  {
    id: "cm-5",
    platform: "reddit",
    sourceName: "r/Entrepreneur",
    postUrl: "https://reddit.com/r/Entrepreneur/comments/link_building_small_products",
    postTitle: "Link building feels impossible when you don't have a content team",
    postExcerpt:
      "I can write decent outreach once I find the right opportunity. The hard part is finding sites where my product would actually make sense.",
    authorName: "solo_maker",
    authorProfileUrl: "https://reddit.com/user/solo_maker",
    postedAt: "2026-05-04T15:20:00Z",
    discoveredAt: "2026-05-04T16:05:00Z",
    intent: "pain_point",
    relevanceScore: 74,
    fitReason:
      "The author already understands outreach and needs help finding relevant targets, which is the clearest Mentiohunt use case.",
    matchedSignals: ["right opportunity", "product would make sense", "no content team"],
    productAngle:
      "Frame Mentiohunt as research leverage for solo founders, not an outreach automation promise.",
    replyDraft: `The bottleneck you described is the one worth solving first. If the opportunity is weak, even a great email feels awkward.

What has worked for me is building a queue around fit reasons instead of domains: "they listed competitors but not us," "they maintain a resource page in our category," "they discussed the exact pain our product solves."

I'm building Mentiohunt to automate that discovery/scoring step for founders, but even manually, forcing every prospect to have a one-sentence fit reason improves the quality fast.`,
    safetyNotes: [
      "Avoid sounding like the reply was generated.",
      "Do not claim outreach conversion rates.",
    ],
    engagement: {
      comments: 11,
      reactions: 35,
      views: 2100,
    },
    status: "replied",
    nextAction: "Monitor thread for response",
  },
  {
    id: "cm-6",
    platform: "bluesky",
    sourceName: "bsky.app",
    postUrl: "https://bsky.app/profile/tiredfounder.bsky.social/post/3",
    postTitle: "Tried backlink outreach for 2 weeks and got nothing",
    postExcerpt:
      "I sent 80 emails from scraped lists and didn't get a single reply. Is link building just dead for small SaaS now?",
    authorName: "tiredfounder.bsky.social",
    authorProfileUrl: "https://bsky.app/profile/tiredfounder.bsky.social",
    postedAt: "2026-05-03T10:45:00Z",
    discoveredAt: "2026-05-03T11:20:00Z",
    intent: "complaint",
    relevanceScore: 52,
    fitReason:
      "The topic is related, but the author is frustrated and may react poorly to a tool recommendation. A helpful critique of scraped-list outreach is safer than a product pitch.",
    matchedSignals: ["backlink outreach", "scraped lists", "small SaaS"],
    productAngle:
      "Offer a better qualification framework without naming Mentiohunt unless asked.",
    replyDraft: `80 emails from scraped lists is usually a signal quality problem more than a proof that link building is dead.

The outreach that has a chance tends to start with a specific reason the page should care: a broken reference, a competitor already mentioned, a resource list missing a useful category, or a recent article where your product adds context.

I'd cut the volume way down and only send when you can write the fit reason in one sentence.`,
    safetyNotes: [
      "Do not mention Mentiohunt in the first reply.",
      "High frustration thread; prioritize empathy.",
    ],
    engagement: {
      comments: 36,
      reactions: 29,
      views: null,
    },
    status: "dismissed",
    nextAction: "—",
  },
]

export function scoreColor(score: number): string {
  if (score >= 85) return "text-emerald-600 bg-emerald-500/10"
  if (score >= 70) return "text-amber-600 bg-amber-500/10"
  if (score >= 50) return "text-orange-600 bg-orange-500/10"
  return "text-red-600 bg-red-500/10"
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatShortDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}
