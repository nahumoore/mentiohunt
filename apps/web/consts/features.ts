export type FeaturePage = {
  slug: string
  eyebrow: string
  title: string
  shortTitle: string
  description: string
  keyword: string
  h2: string
  category: "Backlink building"
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
      "Mentiohunt turns your articles and sitemap into a daily backlink opportunity queue — relevant prospects scored by topical fit, with outreach prep included.",
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
      href: "/blog/how-to-find-backlink-opportunities",
    },
  },
]

export function getFeatureBySlug(slug: string) {
  return features.find((feature) => feature.slug === slug)
}
