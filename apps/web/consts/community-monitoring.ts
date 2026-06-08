import type { MentionPlatform } from "@/consts/platform-config"

export interface SampleMention {
  authorName: string
  handle: string
  postedAt: string
  text: string
  fitScore: number
  intent: string
  replyDraft: string
  reactions: number
  comments: number
}

export interface MonitoringConfig {
  slug: string
  platform: MentionPlatform
  name: string
  seo: {
    title: string
    description: string
    keywords: string[]
  }
  hero: {
    eyebrow: string
    heading: string
    sub: string
    primaryCta: string
  }
  steps: { title: string; desc: string }[]
  why: { title: string; desc: string }[]
  useCases: { title: string; desc: string }[]
  faqs: { q: string; a: string }[]
  sample: SampleMention[]
}

export const TWITTER_MONITORING: MonitoringConfig = {
  slug: "twitter-monitoring",
  platform: "twitter",
  name: "X (Twitter)",

  seo: {
    title: "Twitter Monitoring for Founders — Mentiohunt",
    description:
      "Monitor Twitter and X for posts where your product is the answer. Get daily scored matches with a suggested reply draft so you engage while the thread is still active.",
    keywords: [
      "twitter monitoring",
      "x monitoring",
      "twitter brand monitoring",
      "monitor twitter mentions",
      "x post monitoring",
      "social media monitoring founders",
      "twitter keyword monitoring",
    ],
  },

  hero: {
    eyebrow: "Twitter / X Monitoring",
    heading: "Monitor Twitter and X for posts where your product fits",
    sub: "Mentiohunt scans public X and Twitter posts daily, scores each match for product fit, and prepares a ready-to-review reply draft. Engage while the thread is still active.",
    primaryCta: "Start monitoring X",
  },

  steps: [
    {
      title: "Set your keyword queue",
      desc: "Add your product name, the problem you solve, and core use-case phrases. Mentiohunt builds a search strategy from your inputs.",
    },
    {
      title: "We scan X daily",
      desc: "Daily sweeps across public X and Twitter posts. Every match is scored for product fit and relevance before it enters your queue.",
    },
    {
      title: "Reply while the thread is live",
      desc: "Open your queue to see matched posts, a plain-language fit rationale, and a suggested reply draft. Post from X yourself while the conversation is still active.",
    },
  ],

  why: [
    {
      title: "X conversations move fast",
      desc: "A relevant thread can lose momentum within hours. Daily scans surface matches early so you engage before the conversation goes cold.",
    },
    {
      title: "Works for both 'Twitter' and 'X' queries",
      desc: "Twitter was rebranded to X, but both terms stay in active use. One Mentiohunt setup captures relevant posts regardless of which name appears in the search.",
    },
    {
      title: "Fit-scored, not a firehose",
      desc: "Every match is scored for product relevance before it reaches your queue. No noise to cut through — only posts where your product is a credible answer.",
    },
    {
      title: "Reply draft included",
      desc: "Each opportunity surfaces with a suggested reply already written. Review it, adjust the tone, and post from the original thread yourself.",
    },
  ],

  useCases: [
    {
      title: "Founders building in public",
      desc: "Stay plugged into X conversations where your product is the answer. Turn one helpful reply into signups without spending hours scrolling.",
    },
    {
      title: "Small marketing teams",
      desc: "Cover relevant X conversations as a one-person effort. No manual monitoring needed — the daily queue surfaces what matters.",
    },
    {
      title: "Product launches",
      desc: "During launch week, catch every comparison question and tool request on X so you can participate while momentum is high.",
    },
  ],

  faqs: [
    {
      q: "Does this cover both Twitter and X?",
      a: "Yes. Twitter was rebranded to X in 2023, but both names remain in active use. Mentiohunt monitors the same platform regardless of which term you search. One setup covers both.",
    },
    {
      q: "How often are X posts scanned?",
      a: "Daily sweeps surface new matches each day. Matched posts enter your queue with a fit score and a plain-language rationale so you can prioritize quickly.",
    },
    {
      q: "Will Mentiohunt post replies automatically?",
      a: "No. Mentiohunt generates a suggested reply and shows the original post URL. You review the draft and post it from X yourself. The decision to publish stays with you.",
    },
    {
      q: "What keywords should I track?",
      a: "Start with your product name, the core problem you solve, and names of close alternatives. Specific, problem-focused keywords produce the highest fit scores in your queue.",
    },
    {
      q: "Can I monitor specific X accounts?",
      a: "The current engine monitors keyword matches across public posts. Account-level monitoring is on the roadmap.",
    },
    {
      q: "Does Mentiohunt only monitor X?",
      a: "No. Mentiohunt also monitors Reddit, Facebook, and Bluesky. X monitoring is one engine inside a broader community monitoring product.",
    },
  ],

  sample: [
    {
      authorName: "@buildingwithmike",
      handle: "SaaS founder · 1.2k followers",
      postedAt: "14m ago",
      text: "Does anyone have a good way to track mentions of their product on Twitter/X without spending hours scrolling? Looking for something automated that actually filters noise.",
      fitScore: 92,
      intent: "Asking for tool",
      replyDraft:
        "Worth trying Mentiohunt — it monitors X for posts matching your product and scores each one for fit before surfacing it. You get a suggested reply draft so you can engage fast without the firehose.",
      reactions: 47,
      comments: 23,
    },
    {
      authorName: "@larabuilds",
      handle: "Indie hacker",
      postedAt: "2h ago",
      text: "Best X monitoring tools for founders? I want to know when people are asking for something my product solves, not just when they tag my brand name.",
      fitScore: 88,
      intent: "Comparison shopping",
      replyDraft:
        "Mentiohunt does exactly this — monitors X for keyword and problem matches, not just brand mentions. Each match comes with a fit score and a ready-to-review reply draft.",
      reactions: 31,
      comments: 18,
    },
    {
      authorName: "@nikhilventure",
      handle: "Building in public",
      postedAt: "5h ago",
      text: "Missing so many conversations on X where my product would have been a perfect fit. Replied to one thread last week and got 3 new signups. Need a system for this.",
      fitScore: 95,
      intent: "Pain point",
      replyDraft:
        "That's the problem Mentiohunt is built around. It queues matched X posts daily with a suggested reply so you catch every relevant thread while it is still active.",
      reactions: 89,
      comments: 41,
    },
  ],
}
