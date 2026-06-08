export type PlatformIconKey = "x" | "reddit" | "facebook" | "youtube" | "linkedin"

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

// ─── Twitter / X ────────────────────────────────────────────────────────────

export const TWITTER_MONITORING: MonitoringConfig = {
  slug: "twitter-monitoring",
  platformDisplay: {
    label: "X (Twitter)",
    iconKey: "x" as const,
    color: "text-zinc-900 bg-zinc-500/10",
    accentColor: "#27272a",
  },
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
      "Monitor Reddit and subreddits for posts where your product fits. Get daily scored matches across relevant communities with a suggested reply draft so you engage while the thread is active.",
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
      desc: "More founders and buyers are searching Reddit for peer recommendations. The channel is growing faster than most alternatives.",
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
      a: "Mentiohunt provides a suggested reply, not a guarantee of acceptance. You should review community rules before posting. The drafts are written to be helpful first, not promotional.",
    },
    {
      q: "Does Mentiohunt only monitor Reddit?",
      a: "No. Mentiohunt also monitors X (Twitter), Facebook, and Bluesky. Reddit monitoring is one engine inside a broader community monitoring product.",
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

// ─── Facebook ────────────────────────────────────────────────────────────────

export const FACEBOOK_MONITORING: MonitoringConfig = {
  slug: "facebook-monitoring",
  platformDisplay: {
    label: "Facebook",
    iconKey: "facebook" as const,
    color: "text-blue-700 bg-blue-500/10",
    accentColor: "#3c5a9a",
  },
  name: "Facebook",

  seo: {
    title: "Facebook & Group Monitoring for Founders — Mentiohunt",
    description:
      "Monitor Facebook and Facebook Groups for posts where your product fits. Surface public conversations and group discussions matching your keywords with a suggested reply draft.",
    keywords: [
      "facebook monitoring",
      "facebook group monitoring",
      "monitor facebook mentions",
      "facebook brand monitoring",
      "monitor facebook groups",
      "facebook keyword monitoring",
      "facebook community monitoring",
    ],
  },

  hero: {
    eyebrow: "Facebook & Group Monitoring",
    heading: "Monitor Facebook and Facebook Groups for product-fit conversations",
    sub: "Mentiohunt surfaces public Facebook posts and Group discussions matching your keyword set. Get scored matches with a suggested reply draft before the conversation moves on.",
    primaryCta: "Start monitoring Facebook",
  },

  steps: [
    {
      title: "Set your keyword queue",
      desc: "Add your product name, the problem you solve, and core use-case phrases. Mentiohunt scans public Facebook posts and Groups for matching conversations.",
    },
    {
      title: "We surface matching posts",
      desc: "Public Facebook content matching your keyword set is discovered daily. Each result is scored for product fit before it enters your queue.",
    },
    {
      title: "Reply while the conversation is active",
      desc: "Your queue shows the matched post, Group context, a fit rationale, and a suggested reply draft. Post from Facebook yourself before the discussion closes.",
    },
  ],

  why: [
    {
      title: "Facebook Groups are high-intent communities",
      desc: "Niche Facebook Groups attract buyers actively seeking solutions. A keyword match inside a relevant Group carries strong purchase-intent signal.",
    },
    {
      title: "Covers Groups and public posts in one queue",
      desc: "'Facebook Group monitoring' and general Facebook monitoring point to the same opportunity. Mentiohunt surfaces both in a single feed — no separate setup.",
    },
    {
      title: "Fit-scored, not a firehose",
      desc: "Every match is scored for product relevance before it reaches your queue. No noise to cut through — only conversations where your product is a credible answer.",
    },
    {
      title: "Reply draft included",
      desc: "Each opportunity surfaces with a suggested reply already written. Review it, adjust the tone, and post from the original Group or post yourself.",
    },
  ],

  useCases: [
    {
      title: "B2C and community-led products",
      desc: "If your buyers congregate in Facebook Groups — niche communities, local networks, interest groups — this is where they ask for recommendations.",
    },
    {
      title: "Small marketing teams",
      desc: "Monitor multiple Facebook Groups and public posts from a single queue. No manual scrolling — relevant conversations surface automatically.",
    },
    {
      title: "Product launches",
      desc: "During launch, catch every relevant Facebook conversation asking about your use case while your product is fresh and momentum is high.",
    },
  ],

  faqs: [
    {
      q: "Does this cover Facebook Groups specifically?",
      a: "Yes. Mentiohunt surfaces public Facebook Group discussions alongside general public posts. Both appear in your queue with fit scores and reply drafts.",
    },
    {
      q: "How does Facebook monitoring work technically?",
      a: "Mentiohunt surfaces public Facebook content via keyword discovery. Results cover publicly visible posts and Group discussions. Private or members-only content is not accessible.",
    },
    {
      q: "Are engagement signals available for Facebook posts?",
      a: "Facebook public post discovery has limited engagement and date signals compared to Reddit or X. Results are best used for broad keyword discovery and conversation monitoring.",
    },
    {
      q: "Will Mentiohunt post replies automatically?",
      a: "No. Mentiohunt generates a suggested reply and shows the original post URL. You review the draft and post it from Facebook yourself. The decision to publish stays with you.",
    },
    {
      q: "What keywords should I track?",
      a: "Start with your product name, the core problem you solve, and names of close alternatives. Group-specific terminology your ICP uses tends to surface the highest-fit results.",
    },
    {
      q: "Does Mentiohunt only monitor Facebook?",
      a: "No. Mentiohunt also monitors Reddit, X (Twitter), and Bluesky. Facebook monitoring is one engine inside a broader community monitoring product.",
    },
  ],

  sample: [
    {
      authorName: "Sarah K.",
      handle: "Indie Hackers FB Group · 3.2k members",
      postedAt: "35m ago",
      text: "Best tools for monitoring Facebook groups for mentions of your product category? I keep finding out about relevant conversations too late. Tired of manually checking every group.",
      fitScore: 90,
      intent: "Asking for tool",
      replyDraft:
        "Worth trying Mentiohunt — it monitors Facebook public posts and Groups for keyword matches, scores each one for fit, and gives you a suggested reply draft. Daily queue so you stop missing relevant conversations.",
      reactions: 38,
      comments: 24,
    },
    {
      authorName: "Diego M.",
      handle: "SaaS Founders Group · 8.7k members",
      postedAt: "2h ago",
      text: "Anyone have a way to track when people in Facebook groups are asking for something your product does? I know the conversations are happening but I only see them days later.",
      fitScore: 85,
      intent: "Pain point",
      replyDraft:
        "Mentiohunt does this — surfaces Facebook Group posts matching your product keywords daily, with a fit score and a ready-to-review reply draft. You engage while the thread is still active.",
      reactions: 29,
      comments: 17,
    },
    {
      authorName: "Priya T.",
      handle: "Startup Marketing Community",
      postedAt: "4h ago",
      text: "We get mentioned in Facebook groups but only find out about it days later when someone screenshots it. Looking for something that alerts us when it happens in real time.",
      fitScore: 92,
      intent: "Pain point",
      replyDraft:
        "Mentiohunt sends daily alerts for keyword matches across Facebook public posts and Groups. You see the conversation with a suggested reply while it is still worth engaging.",
      reactions: 54,
      comments: 33,
    },
  ],
}

// ─── YouTube ─────────────────────────────────────────────────────────────────

export const YOUTUBE_MONITORING: MonitoringConfig = {
  slug: "youtube-monitoring",
  platformDisplay: {
    label: "YouTube",
    iconKey: "youtube" as const,
    color: "text-red-600 bg-red-500/10",
    accentColor: "#ff0000",
  },
  name: "YouTube",

  seo: {
    title: "YouTube Monitoring for Founders — Mentiohunt",
    description:
      "Monitor YouTube for videos and comments where your product fits. Surface relevant creator content and comment threads matching your keywords with a suggested outreach or reply draft.",
    keywords: [
      "youtube monitoring",
      "monitor youtube mentions",
      "youtube brand monitoring",
      "youtube comment monitoring",
      "youtube keyword monitoring",
      "monitor youtube comments",
      "youtube mention tracking",
    ],
  },

  hero: {
    eyebrow: "YouTube Monitoring",
    heading: "Monitor YouTube for videos and comments where your product fits",
    sub: "Mentiohunt scans YouTube for relevant videos and comment threads matching your keyword set. Surface opportunities to engage with creators and viewers before the moment passes.",
    primaryCta: "Start monitoring YouTube",
  },

  steps: [
    {
      title: "Set your keyword queue",
      desc: "Add your product name, the problem you solve, and use-case phrases. Mentiohunt builds a YouTube search strategy targeting both video titles and comment threads.",
    },
    {
      title: "We scan YouTube daily",
      desc: "Daily sweeps surface videos and comments matching your keyword set. Each result is scored for product fit before it enters your queue.",
    },
    {
      title: "Engage while the content is active",
      desc: "Your queue shows the matched video or comment, a fit rationale, and a suggested reply or outreach draft. Engage while the content is generating views.",
    },
  ],

  why: [
    {
      title: "YouTube is the second largest search engine",
      desc: "Buyers search YouTube for product reviews, tutorials, and comparisons. Being present in relevant videos and comments puts your product in front of high-intent viewers.",
    },
    {
      title: "Comments have a long shelf life",
      desc: "YouTube videos and their comment threads stay discoverable for months. One well-placed reply can drive discovery long after you posted it.",
    },
    {
      title: "Fit-scored, not a firehose",
      desc: "Every match is scored for product relevance before it reaches your queue. Only videos and comments where your product is a credible answer make the cut.",
    },
    {
      title: "Reply and outreach drafts included",
      desc: "Each opportunity surfaces with a suggested reply or creator outreach draft already written. Review it and engage from YouTube yourself.",
    },
  ],

  useCases: [
    {
      title: "Founders building in public",
      desc: "Catch viewers asking for recommendations under competitor or category videos. A single comment in the right place can surface your product to thousands.",
    },
    {
      title: "Creator outreach",
      desc: "Surface YouTube creators covering your product category. Each match comes with context for why their audience is relevant and a draft outreach message.",
    },
    {
      title: "Product launches",
      desc: "During launch, monitor YouTube for every review, comparison, and how-to video in your space. Engage while the content is fresh and generating views.",
    },
  ],

  faqs: [
    {
      q: "Does this monitor YouTube comments specifically?",
      a: "Yes. Mentiohunt surfaces both video-level matches (titles, descriptions) and comment-level matches where your keywords appear in active discussions.",
    },
    {
      q: "How often is YouTube scanned?",
      a: "Daily sweeps surface new matches. Videos and comments enter your queue with a fit score and rationale so you can prioritize quickly.",
    },
    {
      q: "Will Mentiohunt post comments automatically?",
      a: "No. Mentiohunt generates a suggested reply or outreach draft and shows the original video or comment URL. You review it and post from YouTube yourself.",
    },
    {
      q: "What keywords should I track?",
      a: "Start with your product name, the core problem you solve, and names of close alternatives. Category terms like 'best [tool type]' and 'how to [use case]' also surface high-intent video content.",
    },
    {
      q: "Can I find YouTube creators to collaborate with?",
      a: "Yes. Video-level matches surface creators covering your product space, which makes them natural candidates for outreach. Each match includes a suggested first message.",
    },
    {
      q: "Does Mentiohunt only monitor YouTube?",
      a: "No. Mentiohunt also monitors Reddit, X (Twitter), Facebook, and Bluesky. YouTube monitoring is one engine inside a broader community monitoring product.",
    },
  ],

  sample: [
    {
      authorName: "@techfounder_tv",
      handle: "YouTube creator · 4.8k subscribers",
      postedAt: "1h ago",
      text: "Looking for a tool that monitors YouTube comments for product mentions. There are conversations happening under competitor videos that I am completely missing.",
      fitScore: 88,
      intent: "Asking for tool",
      replyDraft:
        "Mentiohunt monitors YouTube for keyword matches in videos and comment threads, scores each for product fit, and surfaces a suggested reply or outreach draft. Daily queue so you stop missing relevant content.",
      reactions: 52,
      comments: 27,
    },
    {
      authorName: "@marketingbuilder",
      handle: "YouTube · 12k subscribers",
      postedAt: "3h ago",
      text: "How do you track when YouTubers or commenters are asking for a tool like yours? I know these conversations are happening but I have no system for finding them.",
      fitScore: 83,
      intent: "Strategy question",
      replyDraft:
        "Mentiohunt does this — scans YouTube for keyword matches in videos and comment threads, scores them for fit, and queues them with a suggested response. Worth checking out.",
      reactions: 34,
      comments: 15,
    },
    {
      authorName: "@solobuilder_dev",
      handle: "YouTube · 2.1k subscribers",
      postedAt: "7h ago",
      text: "Found a comment on a YouTube video asking for exactly what I built. Replied and got a customer. Now I need a system to find more of these moments before they disappear.",
      fitScore: 95,
      intent: "Pain point",
      replyDraft:
        "That is exactly the use case Mentiohunt is built for. It surfaces YouTube comment matches daily with a suggested reply so you catch every relevant moment while the video is still active.",
      reactions: 78,
      comments: 39,
    },
  ],
}

// ─── LinkedIn ────────────────────────────────────────────────────────────────

export const LINKEDIN_MONITORING: MonitoringConfig = {
  slug: "linkedin-monitoring",
  platformDisplay: {
    label: "LinkedIn",
    iconKey: "linkedin" as const,
    color: "text-blue-700 bg-blue-600/10",
    accentColor: "#0a66c2",
  },
  name: "LinkedIn",

  seo: {
    title: "LinkedIn Monitoring for Founders — Mentiohunt",
    description:
      "Monitor LinkedIn for posts where your product fits. Surface high-intent professional conversations matching your keywords with a suggested reply draft so you engage while the post is active.",
    keywords: [
      "linkedin monitoring",
      "monitor linkedin mentions",
      "linkedin brand monitoring",
      "linkedin post monitoring",
      "linkedin keyword monitoring",
      "monitor linkedin posts",
      "linkedin mention tracking",
    ],
  },

  hero: {
    eyebrow: "LinkedIn Monitoring",
    heading: "Monitor LinkedIn for posts where your product fits",
    sub: "Mentiohunt scans LinkedIn daily for professional conversations matching your keyword set. Surface high-intent posts with a suggested reply draft so you engage while the thread is active.",
    primaryCta: "Start monitoring LinkedIn",
  },

  steps: [
    {
      title: "Set your keyword queue",
      desc: "Add your product name, the business problem you solve, and professional use-case phrases. Mentiohunt targets LinkedIn posts where buyers are actively looking.",
    },
    {
      title: "We scan LinkedIn daily",
      desc: "Daily sweeps across public LinkedIn posts matching your keyword set. Every match is scored for product fit before it enters your queue.",
    },
    {
      title: "Reply while the post is active",
      desc: "Your queue shows the matched post, the fit rationale, and a professional reply draft. Engage from LinkedIn yourself while the post is still generating comments.",
    },
  ],

  why: [
    {
      title: "High commercial intent — $79 avg CPC",
      desc: "LinkedIn's average CPC for buyer keywords signals that the audience has real purchase intent. Organic engagement in these conversations is genuinely valuable.",
    },
    {
      title: "B2B buyers ask for recommendations openly",
      desc: "LinkedIn users regularly post asking for tool recommendations, vendor comparisons, and workflow advice. These posts are high-fit opportunities for most B2B products.",
    },
    {
      title: "Fit-scored, not a firehose",
      desc: "Every match is scored for product relevance before it reaches your queue. Only posts where your product is a credible, professional answer make the cut.",
    },
    {
      title: "Professional reply draft included",
      desc: "Each opportunity surfaces with a suggested reply already written in a tone appropriate for LinkedIn. Review it, adjust, and post from the original thread yourself.",
    },
  ],

  useCases: [
    {
      title: "B2B SaaS founders",
      desc: "Your ICP is on LinkedIn posting about their problems every day. Surface those posts before your competitors and reply with a helpful, credible answer.",
    },
    {
      title: "Consulting and service businesses",
      desc: "LinkedIn is where buyers announce they are looking for expertise. Catch those posts while they are still gathering replies.",
    },
    {
      title: "Product launches",
      desc: "During launch, monitor LinkedIn for every relevant professional conversation asking about your use case. Participate while intent is highest.",
    },
  ],

  faqs: [
    {
      q: "Does this monitor LinkedIn company pages too?",
      a: "The current engine monitors keyword matches across public LinkedIn posts from individuals. Company page monitoring is on the roadmap.",
    },
    {
      q: "How often is LinkedIn scanned?",
      a: "Daily sweeps surface new matches each day. Posts enter your queue with a fit score and plain-language rationale so you can prioritize quickly.",
    },
    {
      q: "Will Mentiohunt post replies automatically?",
      a: "No. Mentiohunt generates a suggested reply and shows the original post URL. You review the draft and reply from LinkedIn yourself. The decision to publish stays with you.",
    },
    {
      q: "What keywords should I track?",
      a: "Start with your product name, the business problem you solve, and job-title-specific language your ICP uses. LinkedIn language tends to be more formal — your keywords should reflect that.",
    },
    {
      q: "Is LinkedIn useful for early-stage startups?",
      a: "Yes, especially for B2B products. LinkedIn posts asking for tool recommendations or vendor comparisons are high-intent signals worth engaging early. The $79 average CPC for LinkedIn keywords reflects strong buyer intent.",
    },
    {
      q: "Does Mentiohunt only monitor LinkedIn?",
      a: "No. Mentiohunt also monitors Reddit, X (Twitter), Facebook, and Bluesky. LinkedIn monitoring is one engine inside a broader community monitoring product.",
    },
  ],

  sample: [
    {
      authorName: "Alex Chen",
      handle: "SaaS Founder · 2nd degree",
      postedAt: "48m ago",
      text: "Anyone using a tool to monitor LinkedIn posts for conversations relevant to your product? I know my ICP posts about their problems here but I am missing most of it.",
      fitScore: 91,
      intent: "Asking for tool",
      replyDraft:
        "Mentiohunt does this — monitors LinkedIn for keyword matches in public posts, scores each for product fit, and surfaces a suggested reply draft. Worth checking out if your buyers are active on LinkedIn.",
      reactions: 67,
      comments: 29,
    },
    {
      authorName: "Priya Nair",
      handle: "Head of Marketing · B2B SaaS",
      postedAt: "2h ago",
      text: "Our ICP posts about their problems on LinkedIn all the time. We just don't see it until days later when the opportunity to reply is gone. Looking for a monitoring solution.",
      fitScore: 89,
      intent: "Pain point",
      replyDraft:
        "Mentiohunt surfaces matching LinkedIn posts daily so you catch them while they are still active. Each match comes with a fit score and a suggested reply — no manual scanning needed.",
      reactions: 84,
      comments: 38,
    },
    {
      authorName: "Marcus Webb",
      handle: "Founder · Bootstrapped",
      postedAt: "5h ago",
      text: "Converted 3 LinkedIn conversations into demos last month by being early to relevant threads. I need to scale this. Any tools that monitor LinkedIn for specific keywords?",
      fitScore: 93,
      intent: "Pain point + intent",
      replyDraft:
        "That is exactly what Mentiohunt is built for. It queues relevant LinkedIn posts daily with a suggested reply so you replicate those wins systematically without spending hours on the feed.",
      reactions: 112,
      comments: 53,
    },
  ],
}
