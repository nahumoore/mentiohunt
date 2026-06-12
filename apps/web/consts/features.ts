export type FeaturePage = {
  slug: string
  eyebrow: string
  title: string
  shortTitle: string
  description: string
  keyword: string
  h2: string
  category: "Backlink building" | "Community monitoring"
  metric: string
  metricLabel: string
  primaryCta: string
  secondaryCta: string
  heroCardTitle: string
  heroCardDescription: string
  sampleLabel: string
  sampleTitle: string
  sampleBody: string
  inputs: string[]
  outcomes: string[]
  workflow: {
    title: string
    description: string
  }[]
  reasons: string[]
  faq: {
    question: string
    answer: string
  }[]
  updatedAt: string
  relatedArticle?: {
    title: string
    href: string
  }
}

export const features: FeaturePage[] = [
  {
    slug: "backlink-opportunity-queue",
    eyebrow: "Backlink opportunity queue",
    title: "Find backlink opportunities from the content you already publish",
    shortTitle: "Backlink opportunity queue",
    description:
      "Mentiohunt turns your articles, sitemap, keywords, and competitors into a daily backlink opportunity queue — relevant prospects scored by topical fit, with outreach prep included.",
    keyword: "backlink opportunity queue",
    h2: "Stop guessing which sites are worth emailing.",
    category: "Backlink building",
    metric: "Daily",
    metricLabel: "qualified prospects",
    primaryCta: "Start your backlink queue",
    secondaryCta: "See community alerts",
    heroCardTitle: "Prospect: Founder tools directory",
    heroCardDescription:
      "Strong topical fit for your guide on startup distribution. Directory accepts founder-built SaaS tools and includes editorial descriptions.",
    sampleLabel: "Suggested next step",
    sampleTitle: "Ask for inclusion with your guide as proof of fit",
    sampleBody:
      "Mention the specific article, explain why their audience cares about founder-led distribution, and keep the ask to one relevant listing or resource mention.",
    inputs: [
      "Sitemap or article URLs",
      "Competitors and adjacent products",
      "Keywords that describe your market",
      "Founder context and positioning",
    ],
    outcomes: [
      "Backlink prospects sorted by fit",
      "Plain-English rationale for each match",
      "Outreach angle for the recipient",
      "Draft email copy you can edit before sending",
    ],
    workflow: [
      {
        title: "Import your content",
        description:
          "Add a sitemap or a few high-intent articles so Mentiohunt can understand what each page should be referenced for.",
      },
      {
        title: "Score external sites",
        description:
          "The queue prioritizes pages where your article naturally adds context instead of chasing generic domain lists.",
      },
      {
        title: "Prepare the outreach",
        description:
          "Each opportunity includes the reason it fits and a ready-to-edit outreach draft tied to the page angle.",
      },
    ],
    reasons: [
      "Founders can act without learning a full SEO prospecting suite.",
      "The queue stays centered on topical fit, not guaranteed link promises.",
      "Each recommendation explains why the prospect is worth reviewing.",
    ],
    faq: [
      {
        question: "Does this guarantee backlinks?",
        answer:
          "No. Mentiohunt helps you find and prepare relevant outreach opportunities. The recipient still decides whether to mention or link to your content.",
      },
      {
        question: "What should I add first?",
        answer:
          "Start with your sitemap, two or three strongest articles, a few competitors, and the keywords customers use to describe your category.",
      },
      {
        question: "Does this work for new sites with little content?",
        answer:
          "Yes. Start with two or three articles and a sitemap. The queue improves as you add more content, competitors, and keywords, but even a small content set surfaces relevant prospects.",
      },
      {
        question: "How does Mentiohunt score fit?",
        answer:
          "The system checks topical alignment between your article and a prospect's existing content, audience, and editorial patterns. Each score comes with a plain-English reason so you can agree or skip without guessing.",
      },
      {
        question: "What types of sites appear in the queue?",
        answer:
          "Directories, resource pages, roundup articles, and editorial sites that already reference content like yours. The queue focuses on relevant placement rather than raw domain authority lists.",
      },
    ],
    updatedAt: "2026-05-12",
    relatedArticle: {
      title: "How to Find Backlink Opportunities (Practical Guide)",
      href: "/articles/how-to-find-backlink-opportunities",
    },
  },
  {
    slug: "community-reply-alerts",
    eyebrow: "Community reply alerts",
    title: "Get alerted when a community thread is ready for a useful reply",
    shortTitle: "Community reply alerts",
    description:
      "Mentiohunt community reply alerts watch relevant communities for posts where your product fits, then send a suggested reply so you can join while the thread is still active.",
    keyword: "community reply alerts",
    h2: "Reply before the thread goes cold.",
    category: "Community monitoring",
    metric: "Realtime",
    metricLabel: "reply opportunities",
    primaryCta: "Start monitoring threads",
    secondaryCta: "See backlink queue",
    heroCardTitle: "Thread: How are founders finding early customers?",
    heroCardDescription:
      "High fit because the poster is asking for low-budget distribution channels and mentions trying Reddit, directories, and content outreach.",
    sampleLabel: "Suggested reply angle",
    sampleTitle: "Lead with the workflow, then mention the product softly",
    sampleBody:
      "Share a practical queue-based approach first. Mention Mentiohunt only after the useful advice, and make it clear they can replicate the process manually.",
    inputs: [
      "Product positioning",
      "Customer pains and use cases",
      "Competitors and alternatives",
      "Communities and keywords to monitor",
    ],
    outcomes: [
      "Relevant posts surfaced quickly",
      "Fit reason for each thread",
      "Suggested reply with product context",
      "Email alert while the discussion is active",
    ],
    workflow: [
      {
        title: "Describe your product",
        description:
          "Add what you do, who it helps, and the problems that should trigger a reply opportunity.",
      },
      {
        title: "Monitor active discussions",
        description:
          "Mentiohunt looks for posts where the context matches your product instead of notifying you on every keyword mention.",
      },
      {
        title: "Reply with restraint",
        description:
          "The suggested reply starts with useful advice and keeps the product mention relevant, specific, and easy to ignore.",
      },
    ],
    reasons: [
      "Founders can respond before a useful thread goes cold.",
      "Fit rationale reduces spammy replies and irrelevant alerts.",
      "The suggested copy helps teams move quickly without sounding automated.",
    ],
    faq: [
      {
        question: "Will replies be posted automatically?",
        answer:
          "No. Mentiohunt prepares a suggested reply and sends an alert. You review the thread and decide whether to respond.",
      },
      {
        question: "Which communities should I monitor first?",
        answer:
          "Start with the few places where your customers already ask for help, compare tools, or describe the pain your product solves.",
      },
      {
        question: "Which platforms does Mentiohunt monitor?",
        answer:
          "Reddit, forums, and other communities where your target audience discusses tools and problems in your category. You can specify which communities to watch when setting up your product profile.",
      },
      {
        question: "How does fit scoring work for threads?",
        answer:
          "The system checks whether the post's context, the poster's problem, and the community's norms align with your product. Keyword matches alone don't trigger an alert — the thread has to read like a genuine opening.",
      },
      {
        question: "Can I adjust what triggers an alert?",
        answer:
          "Yes. Adding more detail to your product positioning, customer pains, and competitor names narrows the signal and reduces noise from threads that match a keyword but not your use case.",
      },
    ],
    updatedAt: "2026-05-12",
  },
]

export function getFeatureBySlug(slug: string) {
  return features.find((feature) => feature.slug === slug)
}
