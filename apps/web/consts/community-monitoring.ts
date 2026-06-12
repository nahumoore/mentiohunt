export type PlatformIconKey = "reddit" | "quora" | "twitter"

export interface MonitoringPlatformDisplay {
  label: string
  iconKey: PlatformIconKey
  color: string
  accentColor: string
}

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
  platformDisplay: MonitoringPlatformDisplay
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

// ─── Reddit ─────────────────────────────────────────────────────────────────

export const REDDIT_MONITORING: MonitoringConfig = {
  slug: "reddit-monitoring",
  platformDisplay: {
    label: "Reddit",
    iconKey: "reddit" as const,
    color: "text-orange-600 bg-orange-500/10",
    accentColor: "#ff4500",
  },
  name: "Reddit",

  seo: {
    title: "Reddit Monitoring for Founders — Mentiohunt",
    description:
      "Monitor Reddit for posts where your product fits. Daily scored matches with a suggested reply draft so you engage while the thread is active.",
    keywords: [
      "reddit monitoring",
      "monitor reddit mentions",
      "reddit brand monitoring",
      "subreddit monitoring",
      "reddit keyword monitoring",
      "reddit community monitoring",
      "monitor reddit for brand mentions",
    ],
  },

  hero: {
    eyebrow: "Reddit Monitoring",
    heading: "Monitor Reddit for posts where your product is the answer",
    sub: "Mentiohunt scans subreddits and public Reddit threads daily, scores each match for product fit, and prepares a ready-to-post reply. Engage while the thread is still active.",
    primaryCta: "Start monitoring Reddit",
  },

  steps: [
    {
      title: "Set your keyword queue",
      desc: "Add your product name, the problem you solve, and relevant subreddit keywords. Mentiohunt builds a search strategy that spans community-specific and global Reddit.",
    },
    {
      title: "We scan Reddit daily",
      desc: "Daily sweeps across subreddits and public threads matching your keyword set. Each result is scored for product fit before it enters your queue.",
    },
    {
      title: "Reply while the thread is active",
      desc: "Your queue shows the matched post, the subreddit context, a fit rationale, and a suggested reply draft. Post from Reddit yourself before the thread loses momentum.",
    },
  ],

  why: [
    {
      title: "Reddit threads index in Google",
      desc: "High-ranking Reddit threads stay visible for months. One helpful reply can drive discovery long after the thread is active.",
    },
    {
      title: "Subreddit specificity = high fit",
      desc: "Subreddit communities are self-selected by topic. A keyword match inside r/SaaS or r/startups carries far more signal than a generic web mention.",
    },
    {
      title: "50% YoY growth in Reddit search volume",
      desc: "Searches for Reddit content grew roughly 50% year-over-year per Semrush's 2023 search trend data. More founders and buyers now go directly to Reddit for peer recommendations than most other channels.",
    },
    {
      title: "Reply draft included",
      desc: "Each opportunity surfaces with a suggested reply already written. Review it, adjust the tone, and post from the original thread yourself.",
    },
  ],

  useCases: [
    {
      title: "Founders building in public",
      desc: "Stay plugged into subreddit conversations where your product is the credible answer. A helpful reply at the right moment compounds over time.",
    },
    {
      title: "Communities-first products",
      desc: "If your ICP lives on Reddit, this is where they ask for recommendations. Get into those threads before your competitors do.",
    },
    {
      title: "Product launches",
      desc: "During launch week, surface every relevant Reddit thread asking for your use case. Catch peak intent while it is happening.",
    },
  ],

  faqs: [
    {
      q: "Does this monitor specific subreddits?",
      a: "Yes. Mentiohunt supports community-scoped searches so you can target specific subreddits alongside global Reddit sweeps. Add the subreddits most relevant to your product.",
    },
    {
      q: "How often are Reddit posts scanned?",
      a: "Daily sweeps surface new matches each day. Posts enter your queue with a fit score and plain-language rationale so you can prioritize quickly.",
    },
    {
      q: "Will Mentiohunt post replies automatically?",
      a: "No. Mentiohunt generates a suggested reply and shows the original thread URL. You review the draft and post it from Reddit yourself. The decision to publish stays with you.",
    },
    {
      q: "What keywords should I track?",
      a: "Start with your product name, the core problem you solve, and names of close alternatives. Community-specific language (the terms your ICP uses in their subreddit) tends to produce the highest fit scores.",
    },
    {
      q: "What about subreddit rules on promotion?",
      a: "Review each subreddit's rules before posting — Mentiohunt doesn't do this automatically. Reply drafts are written to be genuinely helpful first and promotional second, which reduces rule-violation risk, but the final judgment is yours.",
    },
    {
      q: "Does Mentiohunt only monitor Reddit?",
      a: "No. Mentiohunt also monitors Quora and other communities. Reddit monitoring is one engine inside a broader community monitoring product.",
    },
  ],

  sample: [
    {
      authorName: "u/indie_sarah_builds",
      handle: "r/SaaS · 847 karma",
      postedAt: "22m ago",
      text: "Looking for a good way to monitor Reddit for mentions of my SaaS. Manual searches don't scale and I keep missing relevant threads. What are you all using?",
      fitScore: 94,
      intent: "Asking for tool",
      replyDraft:
        "Worth checking out Mentiohunt — it monitors Reddit for keyword and problem matches, scores each post for product fit, and surfaces a suggested reply draft. Daily queue so you never miss a relevant thread.",
      reactions: 62,
      comments: 31,
    },
    {
      authorName: "u/marcbuilder",
      handle: "r/startups · 2.1k karma",
      postedAt: "3h ago",
      text: "How do you find Reddit threads where you can mention your startup without it feeling spammy? Want to be genuinely helpful but need a repeatable system.",
      fitScore: 87,
      intent: "Strategy question",
      replyDraft:
        "Mentiohunt finds threads where your product is the natural answer, not just where your brand is mentioned. You get a fit score and a reply draft that is written to be helpful first.",
      reactions: 44,
      comments: 19,
    },
    {
      authorName: "u/priya_founder",
      handle: "r/Entrepreneur · 1.4k karma",
      postedAt: "6h ago",
      text: "Responded to 4 Reddit threads this week and got 2 signups. The problem is finding those threads in the first place — I need a system for this.",
      fitScore: 91,
      intent: "Pain point",
      replyDraft:
        "That is exactly the problem Mentiohunt solves. It queues relevant Reddit threads daily with a suggested reply so you catch these moments without spending hours scanning subreddits.",
      reactions: 103,
      comments: 47,
    },
  ],
}

// ─── Quora ───────────────────────────────────────────────────────────────────

export const QUORA_MONITORING: MonitoringConfig = {
  slug: "quora-monitoring",
  platformDisplay: {
    label: "Quora",
    iconKey: "quora" as const,
    color: "text-red-700 bg-red-500/10",
    accentColor: "#b92b27",
  },
  name: "Quora",

  seo: {
    title: "Quora Monitoring for Founders — Mentiohunt",
    description:
      "Monitor Quora for questions where your product is the answer. Daily scored matches with a reply draft so you engage while the question still ranks in Google.",
    keywords: [
      "quora monitoring",
      "monitor quora mentions",
      "quora brand monitoring",
      "quora question monitoring",
      "quora keyword monitoring",
      "monitor quora answers",
      "quora mention tracking",
    ],
  },

  hero: {
    eyebrow: "Quora Monitoring",
    heading: "Monitor Quora for questions where your product is the answer",
    sub: "Mentiohunt scans Quora daily for questions matching your keyword set, scores each for product fit, and prepares a ready-to-review answer draft. Engage while the question is active and ranking in Google.",
    primaryCta: "Start monitoring Quora",
  },

  steps: [
    {
      title: "Set your keyword queue",
      desc: "Add your product name, the problem you solve, and use-case phrases. Mentiohunt builds a search strategy targeting Quora questions where your product is a credible answer.",
    },
    {
      title: "We scan Quora daily",
      desc: "Daily sweeps surface new questions and active threads matching your keyword set. Each result is scored for product fit before it enters your queue.",
    },
    {
      title: "Answer while the question ranks",
      desc: "Your queue shows the matched question, a plain-language fit rationale, and a suggested answer draft. Post from Quora yourself while the thread is still generating views.",
    },
  ],

  why: [
    {
      title: "Quora answers rank in Google for months",
      desc: "High-quality Quora answers stay visible in Google search results long after the question is posted. One well-placed answer can drive discovery continuously.",
    },
    {
      title: "Questions signal exact buyer intent",
      desc: "Quora questions are explicit statements of need. A keyword match on Quora is one of the clearest signals that a potential buyer is actively looking for a solution.",
    },
    {
      title: "Fit-scored, not a firehose",
      desc: "Every match is scored for product relevance before it reaches your queue. Only questions where your product is a credible answer make the cut.",
    },
    {
      title: "Answer draft included",
      desc: "Each opportunity surfaces with a suggested answer already written. Review it, adjust the depth, and post from the original Quora question yourself.",
    },
  ],

  useCases: [
    {
      title: "Founders building in public",
      desc: "Quora questions about your problem space are asked every day. Surface the ones that match and answer them while the question is fresh and accumulating views.",
    },
    {
      title: "Long-tail content strategy",
      desc: "Quora answers that rank in Google compound over time. Each quality answer is a durable distribution asset, not just a one-time reply.",
    },
    {
      title: "Product launches",
      desc: "During launch, surface every Quora question asking about your use case. Answer while intent is high and your product is new.",
    },
  ],

  faqs: [
    {
      q: "Why is Quora valuable for founders?",
      a: "Quora questions rank in Google for months and attract readers who are actively researching a topic. One helpful answer in the right thread can drive steady discovery long after you posted it.",
    },
    {
      q: "How often are Quora questions scanned?",
      a: "Daily sweeps surface new questions and active threads. Matches enter your queue with a fit score and plain-language rationale so you can prioritize quickly.",
    },
    {
      q: "Will Mentiohunt post answers automatically?",
      a: "No. Mentiohunt generates a suggested answer and shows the original question URL. You review the draft and post it from Quora yourself. The decision to publish stays with you.",
    },
    {
      q: "What keywords should I track?",
      a: "Start with your product name, the core problem you solve, and names of close alternatives. Question-style phrases — 'best tool for X' or 'how do I Y' — surface the highest-fit Quora threads.",
    },
    {
      q: "Are older Quora questions worth answering?",
      a: "Yes. Quora threads that rank in Google continue receiving traffic regardless of age. Mentiohunt surfaces both new and established questions so you can prioritize by fit score and traffic potential.",
    },
    {
      q: "Does Mentiohunt only monitor Quora?",
      a: "No. Mentiohunt also monitors Reddit and other communities. Quora monitoring is one engine inside a broader community monitoring product.",
    },
  ],

  sample: [
    {
      authorName: "alex_builds_saas",
      handle: "Quora · 847 followers",
      postedAt: "1h ago",
      text: "What is the best tool to monitor Quora for questions where my SaaS product would be a helpful answer? I keep finding relevant threads days after they were posted.",
      fitScore: 94,
      intent: "Asking for tool",
      replyDraft:
        "Worth trying Mentiohunt — it monitors Quora for questions matching your product keywords, scores each for fit, and surfaces a suggested answer draft. Daily queue so you stop missing relevant questions.",
      reactions: 38,
      comments: 19,
    },
    {
      authorName: "priya_founder_q",
      handle: "Quora · Top Writer",
      postedAt: "3h ago",
      text: "How do founders systematically find Quora questions where their product is the answer? Manual searches don't scale and I miss most of the relevant threads.",
      fitScore: 91,
      intent: "Strategy question",
      replyDraft:
        "Mentiohunt does this — scans Quora daily for keyword and problem matches, scores them for product fit, and queues them with a suggested answer draft. No manual searching needed.",
      reactions: 52,
      comments: 27,
    },
    {
      authorName: "marcus_ih",
      handle: "Quora · 2.1k followers",
      postedAt: "6h ago",
      text: "I answered one Quora question about my product category six months ago. It now ranks in Google and drives about 15 signups a month. I need a system to find more of these opportunities.",
      fitScore: 97,
      intent: "Pain point",
      replyDraft:
        "That is exactly the use case Mentiohunt is built for. It surfaces Quora questions matching your keywords daily with a suggested answer so you replicate those wins at scale without manual searching.",
      reactions: 94,
      comments: 48,
    },
  ],
}

// ─── Twitter / X ─────────────────────────────────────────────────────────────

export const TWITTER_MONITORING: MonitoringConfig = {
  slug: "twitter-monitoring",
  platformDisplay: {
    label: "X (Twitter)",
    iconKey: "twitter" as const,
    color: "text-foreground bg-foreground/10",
    accentColor: "#000000",
  },
  name: "X (Twitter)",

  seo: {
    title: "Twitter / X Monitoring for Founders — Mentiohunt",
    description:
      "Monitor X (Twitter) for posts where your product fits. Get daily scored matches with a suggested reply draft so you engage while the conversation is live.",
    keywords: [
      "twitter monitoring",
      "x monitoring",
      "monitor twitter mentions",
      "twitter brand monitoring",
      "twitter keyword monitoring",
      "monitor x for mentions",
      "x mention tracking",
    ],
  },

  hero: {
    eyebrow: "X (Twitter) Monitoring",
    heading: "Monitor X for conversations where your product is the answer",
    sub: "Mentiohunt scans X (Twitter) daily for posts and threads matching your keyword set, scores each for product fit, and prepares a ready-to-review reply draft. Engage while the conversation is still live.",
    primaryCta: "Start monitoring X",
  },

  steps: [
    {
      title: "Set your keyword queue",
      desc: "Add your product name, the problem you solve, and relevant hashtags or phrases. Mentiohunt builds a search strategy covering both direct mentions and problem-aware conversations on X.",
    },
    {
      title: "We scan X daily",
      desc: "Daily sweeps surface new posts and threads matching your keyword set. Each result is scored for product fit before it enters your queue so you only see high-signal opportunities.",
    },
    {
      title: "Reply while the thread is live",
      desc: "Your queue shows the matched post, a plain-language fit rationale, and a suggested reply draft. Post from X yourself while engagement is still happening.",
    },
  ],

  why: [
    {
      title: "Conversations move fast on X",
      desc: "X threads peak within hours. Catching a relevant post early — while replies are still flowing — means far more visibility than responding a day later.",
    },
    {
      title: "Founders and builders are highly active",
      desc: "X is where your ICP openly asks for tool recommendations, shares frustrations, and discusses alternatives. High-fit threads surface buying intent in real time.",
    },
    {
      title: "Replies compound into credibility",
      desc: "Consistent, helpful replies in the right conversations build brand presence over time. Each reply is also indexed and discoverable by anyone searching the same topic.",
    },
    {
      title: "Reply draft included",
      desc: "Each opportunity surfaces with a suggested reply already written. Review it, adjust the tone, and post from the original thread yourself.",
    },
  ],

  useCases: [
    {
      title: "Founders building in public",
      desc: "X is where builders and buyers talk openly about problems. Surface the conversations where your product is the credible answer and engage while momentum is high.",
    },
    {
      title: "Product launches",
      desc: "During launch, catch every X thread asking about your use case. A well-timed reply in an active thread can drive trial signups the same day.",
    },
    {
      title: "Competitive displacement",
      desc: "Track conversations where users complain about alternatives. These are the highest-intent switching moments — Mentiohunt surfaces them before they go cold.",
    },
  ],

  faqs: [
    {
      q: "What kinds of posts does Mentiohunt find on X?",
      a: "Posts and threads where someone is asking for a tool recommendation, describing a problem your product solves, or discussing a topic closely related to your use case. Each match is scored for product fit before entering your queue.",
    },
    {
      q: "How often are X posts scanned?",
      a: "Daily sweeps surface new matches each day. Posts enter your queue with a fit score and plain-language rationale so you can prioritize quickly.",
    },
    {
      q: "Will Mentiohunt post replies automatically?",
      a: "No. Mentiohunt generates a suggested reply and shows the original post URL. You review the draft and post it from X yourself. The decision to publish stays with you.",
    },
    {
      q: "What keywords should I track?",
      a: "Start with your product name, the core problem you solve, and names of close alternatives. Phrases like 'looking for a tool to X' or 'anyone using Y' tend to surface the highest-intent threads.",
    },
    {
      q: "Does Mentiohunt only monitor X?",
      a: "No. Mentiohunt also monitors Reddit, Quora, and other communities. X monitoring is one engine inside a broader community monitoring product.",
    },
    {
      q: "What about posts that are already too old to reply to?",
      a: "Mentiohunt prioritizes recency in your queue. Older posts are still surfaced because some threads stay active for days, but fit score and post age together help you decide where to spend time.",
    },
  ],

  sample: [
    {
      authorName: "@sara_building",
      handle: "X · 3.2k followers",
      postedAt: "18m ago",
      text: "Does anyone have a good way to track when people mention problems your SaaS solves on Twitter? I keep missing threads and replying too late. Looking for a real system.",
      fitScore: 96,
      intent: "Asking for tool",
      replyDraft:
        "Mentiohunt does exactly this — scans X daily for posts matching your product keywords, scores each for fit, and queues them with a suggested reply draft. You stop missing the window.",
      reactions: 47,
      comments: 22,
    },
    {
      authorName: "@marc_buildlog",
      handle: "X · 8.7k followers",
      postedAt: "2h ago",
      text: "Replied to 3 tweets this week where my product was the obvious answer. Two converted to trials. The hard part is finding those tweets before they go cold. Need to systematize this.",
      fitScore: 91,
      intent: "Pain point",
      replyDraft:
        "That is exactly what Mentiohunt is built for. Daily queue of X posts where your product fits, with a reply draft already written. You review and post yourself while the thread is still live.",
      reactions: 83,
      comments: 36,
    },
    {
      authorName: "@priya_saas",
      handle: "X · 1.9k followers",
      postedAt: "5h ago",
      text: "Hot take: the best distribution channel for early-stage B2B SaaS is just answering questions on Twitter, Reddit, and Quora where your product is the answer. Manual but it converts.",
      fitScore: 88,
      intent: "Strategy discussion",
      replyDraft:
        "Agreed — and Mentiohunt automates the discovery part. It surfaces the posts across X, Reddit, and Quora where your product is a credible answer, so you spend time replying instead of searching.",
      reactions: 124,
      comments: 61,
    },
  ],
}

export const ALL_MONITORING_CONFIGS: MonitoringConfig[] = [
  REDDIT_MONITORING,
  QUORA_MONITORING,
  TWITTER_MONITORING,
]
