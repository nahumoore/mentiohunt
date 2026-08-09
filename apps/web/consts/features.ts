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
  // Landing page mirror fields
  heroBadge: string
  titleHighlight: string
  heroStats: {
    value: number
    suffix: string
    label: string
  }[]
  benefits: {
    eyebrow: string
    title: string
    description: string
    preview: {
      label: string
      items: string[]
    }
  }[]
  comparison: {
    caption: string
    rows: {
      label: string
      others: string
      mentiohunt: string
    }[]
  }
  cta: {
    title: string
    description: string
    button: string
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
    secondaryCta: "See how it works",
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
    heroBadge: "Backlink prospecting — automated",
    titleHighlight: "already publish",
    heroStats: [
      {
        value: 1200,
        suffix: "+",
        label: "opportunities surfaced\nevery month",
      },
      {
        value: 91,
        suffix: "",
        label: "average fit score\nper prospect",
      },
      {
        value: 25,
        suffix: "+",
        label: "backlinks acquired\nevery month",
      },
    ],
    benefits: [
      {
        eyebrow: "Content-first matching",
        title: "Your articles become your prospecting engine.",
        description:
          "Most tools start from domain lists. Mentiohunt starts from what you published — and surfaces sites where each article is a natural fit, not a cold pitch.",
        preview: {
          label: "Matched to your guide on startup distribution",
          items: [
            "Founder tools directory — strong topical fit",
            "Resource page for early-stage SaaS — editorial match",
            "Roundup article on distribution — placement angle ready",
            "Newsletter link list — audience overlap confirmed",
          ],
        },
      },
      {
        eyebrow: "Outreach prep included",
        title: "No blank emails. No guessing what to say.",
        description:
          "Each opportunity includes a plain-English fit rationale and a ready-to-edit outreach draft tied to your article angle — so you can act on the highest-fit prospect without writing from scratch.",
        preview: {
          label: "Draft ready for Founder tools directory",
          items: [
            "Subject line generated from article topic",
            "Fit rationale written in plain English",
            "Outreach body tied to the placement angle",
            "Edit-before-send — nothing fires automatically",
          ],
        },
      },
      {
        eyebrow: "Daily queue",
        title: "Fresh prospects, every morning.",
        description:
          "The queue refreshes daily as Mentiohunt re-scans your sitemap, tracks new content you publish, and checks updated editorial patterns on target sites — so you always have something worth acting on.",
        preview: {
          label: "Today's queue — 6 new prospects",
          items: [
            "3 directory listings with editorial descriptions",
            "2 roundup articles covering your category",
            "1 resource page added since last crawl",
          ],
        },
      },
    ],
    comparison: {
      caption: "How the backlink opportunity queue compares",
      rows: [
        {
          label: "Content-based prospect matching",
          others: "Manual or domain-list only",
          mentiohunt: "Automatic, per article",
        },
        {
          label: "Fit rationale per prospect",
          others: "Domain metrics only",
          mentiohunt: "Plain-English explanation",
        },
        {
          label: "Outreach draft included",
          others: "Template library, copy-paste",
          mentiohunt: "Article-tied draft per prospect",
        },
        {
          label: "Daily queue refresh",
          others: "Manual re-run required",
          mentiohunt: "Automatic, every morning",
        },
        {
          label: "Setup complexity",
          others: "Full SEO suite onboarding",
          mentiohunt: "Sitemap + 3 articles to start",
        },
      ],
    },
    cta: {
      title: "Start with your first queue. Act on the clearest opportunity.",
      description:
        "Mentiohunt is built for founders and small teams that need a practical backlink workflow, not another analytics-heavy tool.",
      button: "Start your backlink queue",
    },
  },
  {
    slug: "link-building-software",
    eyebrow: "Automated link building tool",
    title:
      "The automated link building tool built for founders, not agencies",
    shortTitle: "Automated Link Building Tool for Founders",
    description:
      "Mentiohunt is an automated link building tool that finds prospects, scores fit, and drafts outreach — daily, without an agency or a full-time SEO team.",
    keyword: "automated link building tool",
    h2: "Stop paying for tools your team won't run.",
    category: "Backlink building",
    metric: "100+",
    metricLabel: "qualified prospects\nper month",
    primaryCta: "Try Mentiohunt free",
    secondaryCta: "See how it works",
    heroCardTitle: "Queue ready — 8 new prospects this morning",
    heroCardDescription:
      "Three directory placements, two resource pages, and one roundup article — all matched to your article on founder-led growth.",
    sampleLabel: "Outreach draft ready to review",
    sampleTitle: "Resource page fit confirmed — draft prepared",
    sampleBody:
      "The resource page already lists tools for early-stage founders. Your article on distribution is a direct topical fit. Draft asks for a one-line mention alongside the existing tools.",
    inputs: [
      "Sitemap or article URLs",
      "Competitor domains",
      "Target keywords",
      "Founder positioning and product context",
    ],
    outcomes: [
      "Daily prospect queue ranked by topical fit",
      "Fit rationale for every recommendation",
      "Ready-to-edit outreach draft per prospect",
      "Contact details for the relevant site owner",
    ],
    workflow: [
      {
        title: "Connect your content",
        description:
          "Add a sitemap or a list of your best articles. Mentiohunt reads each page to understand what it covers and what kind of site would naturally reference it.",
      },
      {
        title: "Get a scored prospect queue",
        description:
          "The software surfaces sites where your article is a topical fit — scored by relevance, not just domain authority. Each result includes a plain-English reason.",
      },
      {
        title: "Review and send outreach",
        description:
          "Each prospect comes with a ready-to-edit email draft. You review, adjust if needed, and approve. Nothing sends without your sign-off.",
      },
    ],
    reasons: [
      "Built for founders running link building without a dedicated SEO team.",
      "Surfaces fit rationale per prospect — you understand every recommendation before acting.",
      "Setup takes minutes, not a multi-day agency onboarding.",
    ],
    faq: [
      {
        question: "What is an automated link building tool?",
        answer:
          "An automated link building tool finds websites relevant to your content, scores how well your article fits each one, and prepares outreach on your behalf — replacing the manual research and cold-pitch writing a founder or SEO would otherwise do by hand. Mentiohunt automates discovery and outreach prep specifically; you still review and own every relationship once a prospect replies.",
      },
      {
        question: "Is Mentiohunt a replacement for Ahrefs or Semrush?",
        answer:
          "No. Mentiohunt is not a full-spectrum SEO suite. It focuses on one workflow: turning your content into a daily queue of backlink prospects with outreach prep included. If you already use a keyword tool or rank tracker, Mentiohunt complements it.",
      },
      {
        question: "Does this guarantee I'll get backlinks?",
        answer:
          "No. Mentiohunt helps you find relevant prospects and prepare personalized outreach. Whether the site owner links to you depends on them — the software gives you the best shot, not a guaranteed outcome.",
      },
      {
        question: "How is this different from a link building agency?",
        answer:
          "Agencies manage outreach on your behalf, often using opaque networks. Mentiohunt shows you every opportunity, explains why it fits, and lets you approve before anything goes out. You stay in control of your brand voice and outreach quality.",
      },
      {
        question: "What kind of content do I need to start?",
        answer:
          "Two or three solid articles and a sitemap are enough to generate an initial queue. The more content you add — and the more specific your keywords and competitors — the more relevant the prospects become.",
      },
      {
        question: "Does it work for SaaS products with a small blog?",
        answer:
          "Yes. Mentiohunt is designed for early-stage B2B SaaS teams that publish some content but don't have the volume or authority to run manual outreach at scale. A small, focused content set often surfaces cleaner prospects than a large unfocused one.",
      },
    ],
    updatedAt: "2026-08-08",
    relatedArticle: {
      title: "Best Automated Link Building Tools for Founders in 2026",
      href: "/blog/best-automated-link-building-tools-for-founders",
    },
    heroBadge: "Automated link building tool",
    titleHighlight: "automated link building tool",
    heroStats: [
      {
        value: 100,
        suffix: "+",
        label: "qualified prospects\nper month",
      },
      {
        value: 3,
        suffix: " min",
        label: "average setup\ntime to first queue",
      },
      {
        value: 0,
        suffix: "",
        label: "agency fees\nor retainers",
      },
    ],
    benefits: [
      {
        eyebrow: "Content-matched prospects",
        title: "Prospecting from your articles, not generic domain lists.",
        description:
          "Most link building software starts from a seed keyword or a competitor backlink export. Mentiohunt starts from what you already published — and finds sites where each article is a natural fit, not a cold pitch.",
        preview: {
          label: "Matched to: your guide on SaaS onboarding",
          items: [
            "Product management resource hub — editorial match",
            "Startup tools directory — topical fit confirmed",
            "Roundup on SaaS tools for early-stage teams — placement angle ready",
            "Founder newsletter link list — audience overlap noted",
          ],
        },
      },
      {
        eyebrow: "Outreach prep built in",
        title: "Every prospect ships with a ready-to-edit email draft.",
        description:
          "No blank templates, no copy-paste guesswork. Mentiohunt generates an outreach email tied to the specific article and prospect — including a subject line, fit rationale, and body copy you can edit before sending.",
        preview: {
          label: "Draft ready — startup tools directory",
          items: [
            "Subject line derived from article topic",
            "Opening references the specific page on their site",
            "Fit rationale written in plain English",
            "Nothing sends until you approve",
          ],
        },
      },
      {
        eyebrow: "No SEO expertise required",
        title: "Built to run without a dedicated SEO team.",
        description:
          "Enterprise link building tools require trained operators. Mentiohunt surfaces what to do next in plain language — so a founder can act on the highest-fit opportunity in minutes, not hours.",
        preview: {
          label: "Daily queue — Monday morning",
          items: [
            "2 directory listings with editorial fit confirmed",
            "1 resource page — draft outreach ready",
            "1 roundup article — placement angle included",
            "3 prospects deprioritized — low topical fit flagged",
          ],
        },
      },
    ],
    comparison: {
      caption: "How Mentiohunt compares to other link building software",
      rows: [
        {
          label: "Prospect matching method",
          others: "Domain export / keyword seed",
          mentiohunt: "Content-first, per article",
        },
        {
          label: "Fit rationale per prospect",
          others: "DA/DR metrics only",
          mentiohunt: "Plain-English explanation",
        },
        {
          label: "Outreach draft included",
          others: "Generic template library",
          mentiohunt: "Article-tied draft per prospect",
        },
        {
          label: "Team size required",
          others: "Dedicated SEO or agency",
          mentiohunt: "Works solo, no SEO background needed",
        },
        {
          label: "Setup to first queue",
          others: "Multi-day onboarding",
          mentiohunt: "Sitemap + 3 articles, under 5 minutes",
        },
      ],
    },
    cta: {
      title: "Start with your content. Get your first queue today.",
      description:
        "Mentiohunt is link building software built for founders who want a real backlink program — without the agency overhead or the enterprise learning curve.",
      button: "Try Mentiohunt free",
    },
  },
  {
    slug: "backlink-outreach",
    eyebrow: "Backlink outreach",
    title: "Backlink outreach with every draft written before you ask",
    shortTitle: "Backlink outreach",
    description:
      "Mentiohunt surfaces high-fit backlink prospects and prepares a personalized outreach email for each one — so you review and approve, not write from scratch.",
    keyword: "backlink outreach",
    h2: "The outreach is ready. You just decide what to send.",
    category: "Backlink building",
    metric: "< 5",
    metricLabel: "minutes from prospect\nto outreach ready",
    primaryCta: "Start your outreach queue",
    secondaryCta: "See how it works",
    heroCardTitle: "Draft ready — Resource page: Early-stage SaaS tools",
    heroCardDescription:
      "The page already lists founder tools. Your article on go-to-market for B2B SaaS is a topical fit. Draft asks for a one-line mention alongside the listed resources.",
    sampleLabel: "Review and approve to send",
    sampleTitle: "Subject: Your resource page + one thing we'd add",
    sampleBody:
      "Draft opens with a specific reference to their existing resource list, explains why the article fits their audience, and makes a single clear ask. Edit the tone if needed — nothing sends automatically.",
    inputs: [
      "Sitemap or article URLs",
      "Competitor domains",
      "Target keywords",
      "Product context and positioning",
    ],
    outcomes: [
      "Prospect list ranked by outreach readiness",
      "Personalized email draft per prospect",
      "Fit rationale explaining each opportunity",
      "Approve-before-send workflow",
    ],
    workflow: [
      {
        title: "Surface prospects with outreach potential",
        description:
          "Mentiohunt scans your content and finds sites where a personalized ask makes sense — editorial fit, right audience, clear placement angle.",
      },
      {
        title: "Draft gets written automatically",
        description:
          "Each prospect generates an outreach email tied to the specific article and the site's content. Subject line, opening, body, and ask — all pre-written and ready to edit.",
      },
      {
        title: "Review, edit, approve",
        description:
          "You see the draft before it goes anywhere. Adjust the tone, rewrite a line, or skip the prospect. Nothing sends without your explicit approval.",
      },
    ],
    reasons: [
      "Personalized outreach scales when the drafts write themselves.",
      "Every email references the specific site — not a generic pitch.",
      "You stay in control of what your brand sends.",
    ],
    faq: [
      {
        question: "Does Mentiohunt send emails automatically?",
        answer:
          "No. Every draft requires your review and approval before anything is sent. The software prepares the outreach — you decide what goes out and when.",
      },
      {
        question: "How personalized are the outreach drafts?",
        answer:
          "Each draft references the specific prospect page, explains why your article fits their content, and frames the ask around that context. It's not a template with a name swapped in — the copy is tied to the article and the site.",
      },
      {
        question: "What response rates should I expect?",
        answer:
          "Mentiohunt doesn't guarantee response rates — those depend on your niche, the quality of your content, and how closely the prospect matches. The software improves your odds by focusing your outreach on sites where a fit already exists, which historically performs better than cold domain lists.",
      },
      {
        question: "Can I edit the drafts before sending?",
        answer:
          "Yes. Every draft is editable before approval. You can adjust the tone, rewrite sections, or use it as a starting point and draft your own version — the software gives you a head start, not the final word.",
      },
      {
        question: "What types of sites does it prospect for outreach?",
        answer:
          "Directories, resource pages, roundup articles, and editorial sites that already reference content in your category. The prospect list focuses on sites where a placement ask makes editorial sense — not random high-DA domains.",
      },
    ],
    updatedAt: "2026-06-22",
    heroBadge: "Backlink outreach — draft-ready",
    titleHighlight: "every draft written before you ask",
    heroStats: [
      {
        value: 5,
        suffix: " min",
        label: "from prospect\nto outreach ready",
      },
      {
        value: 0,
        suffix: "",
        label: "blank emails\nto write",
      },
      {
        value: 100,
        suffix: "%",
        label: "approve-before-send\ncontrol",
      },
    ],
    benefits: [
      {
        eyebrow: "Outreach prep automated",
        title: "Every prospect comes with a personalized email draft.",
        description:
          "Mentiohunt writes the outreach for each opportunity — subject line, fit rationale, and body copy tied to the specific article and site. You review and approve, not write from scratch.",
        preview: {
          label: "Draft ready for: startup tools resource page",
          items: [
            "Subject line generated from article topic and site context",
            "Opening references a specific page on their site",
            "Fit rationale explains why the article belongs there",
            "Single clear ask — no overreach in the first email",
          ],
        },
      },
      {
        eyebrow: "Fit-first prospect selection",
        title: "Only reach out where a fit actually exists.",
        description:
          "Sending outreach to the wrong site wastes your reputation and theirs. Mentiohunt only queues prospects where your article has genuine topical relevance — so every email you approve has a real reason behind it.",
        preview: {
          label: "Prospects ranked by outreach readiness",
          items: [
            "Resource page — strong topical fit, editorial tone match",
            "Roundup article — covers your category, placement angle clear",
            "Directory — accepts submissions, audience overlap confirmed",
            "3 sites deprioritized — low fit score, no clear placement angle",
          ],
        },
      },
      {
        eyebrow: "Approve-before-send control",
        title: "Your brand voice. Your approval. Your timeline.",
        description:
          "Nothing sends automatically. Every draft goes through your review — you can edit, skip, or come back later. The workflow gives you coverage without giving up control.",
        preview: {
          label: "Outreach queue — this week",
          items: [
            "4 drafts ready for review",
            "2 approved and sent",
            "1 edited and sent with custom opening",
            "1 skipped — not the right time",
          ],
        },
      },
    ],
    comparison: {
      caption: "How Mentiohunt handles backlink outreach vs. alternatives",
      rows: [
        {
          label: "Outreach draft per prospect",
          others: "Generic template, manual edit",
          mentiohunt: "Personalized draft, article-tied",
        },
        {
          label: "Prospect selection method",
          others: "Keyword or domain list",
          mentiohunt: "Content-fit scoring per article",
        },
        {
          label: "Send control",
          others: "Automated sequences, opt-out",
          mentiohunt: "Approve before every send",
        },
        {
          label: "Fit rationale included",
          others: "Metrics only (DA, traffic)",
          mentiohunt: "Plain-English reason per prospect",
        },
        {
          label: "Setup to first draft ready",
          others: "Campaign setup + template config",
          mentiohunt: "Sitemap + articles, under 5 min",
        },
      ],
    },
    cta: {
      title: "Your outreach drafts are waiting. Start the queue.",
      description:
        "Mentiohunt prepares personalized backlink outreach for every high-fit prospect — so you spend your time reviewing, not writing.",
      button: "Start your outreach queue",
    },
  },
  {
    slug: "link-prospecting",
    eyebrow: "Link prospecting",
    title: "Link prospecting that starts from your content, not a domain list",
    shortTitle: "Link prospecting",
    description:
      "Mentiohunt reads your articles and surfaces sites where each one is a natural fit — with topical scoring, fit rationale, and contact details ready before you reach out.",
    keyword: "link prospecting",
    h2: "Find prospects worth emailing before you write a single word.",
    category: "Backlink building",
    metric: "Daily",
    metricLabel: "refreshed prospect\nqueue per article",
    primaryCta: "Start prospecting",
    secondaryCta: "See how it works",
    heroCardTitle: "Prospect scored: Founder tools directory",
    heroCardDescription:
      "Topical fit: high. Your article on early-stage distribution matches the editorial focus of this directory. Contact details ready, outreach angle identified.",
    sampleLabel: "Why this prospect made the queue",
    sampleTitle: "Strong editorial match — link angle prepared",
    sampleBody:
      "Directory lists tools for founders at the idea-to-seed stage. Your article covers go-to-market for early B2B SaaS — directly relevant to their audience. Placement angle: resource link alongside listed tools.",
    inputs: [
      "Sitemap or article URLs",
      "Competitor domains to find adjacent prospects",
      "Keywords describing your market",
      "Founder context and niche",
    ],
    outcomes: [
      "Prospect queue scored by topical fit",
      "Plain-English rationale for each match",
      "Contact details for the relevant site owner",
      "Outreach angle for the specific placement opportunity",
    ],
    workflow: [
      {
        title: "Scan your content",
        description:
          "Mentiohunt reads each article you add and builds a topical model — what the page covers, who the audience is, and what kind of external site would reference it naturally.",
      },
      {
        title: "Score external sites for fit",
        description:
          "Prospecting runs against editorial sites, directories, resource pages, and roundup articles in your category. Each result is scored for topical alignment, not just domain authority.",
      },
      {
        title: "Review the ranked queue",
        description:
          "Prospects arrive in a daily queue ordered by fit score. Each entry includes the rationale, the placement angle, and contact details so you can act immediately.",
      },
    ],
    reasons: [
      "Topical fit scores surface prospects you'd otherwise miss in a keyword export.",
      "Each rationale explains why the site made the queue — no guessing.",
      "The queue updates daily as new prospects are found and existing ones re-scored.",
    ],
    faq: [
      {
        question: "What is link prospecting?",
        answer:
          "Link prospecting is the process of finding websites that are worth reaching out to for a backlink. Good prospecting targets sites where your content is a genuine fit — not just high-authority domains with no editorial relevance.",
      },
      {
        question: "How does Mentiohunt score topical fit?",
        answer:
          "The system compares the topic, audience, and editorial tone of your article against each prospect's content. Each score comes with a plain-English rationale so you can agree with the ranking or skip it without guessing.",
      },
      {
        question: "What types of sites appear in the prospect queue?",
        answer:
          "Directories, resource pages, roundup articles, and editorial sites that already cover your topic area. The queue avoids generic high-DA lists in favor of sites where a placement would make editorial sense.",
      },
      {
        question: "Do I need a lot of content to start?",
        answer:
          "No. Two or three strong articles are enough to generate a useful initial queue. As you add more content and competitors, the prospecting gets more targeted.",
      },
      {
        question: "Can I use this for multiple articles at once?",
        answer:
          "Yes. Each article generates its own prospect thread. You can manage prospecting across multiple pages simultaneously — each one surfaces a separate queue of relevant sites.",
      },
    ],
    updatedAt: "2026-06-22",
    relatedArticle: {
      title: "How to Find Backlink Opportunities (Practical Guide)",
      href: "/blog/how-to-find-backlink-opportunities",
    },
    heroBadge: "Link prospecting — content-driven",
    titleHighlight: "starts from your content",
    heroStats: [
      {
        value: 1200,
        suffix: "+",
        label: "prospects surfaced\nevery month",
      },
      {
        value: 91,
        suffix: "",
        label: "average topical\nfit score",
      },
      {
        value: 3,
        suffix: " min",
        label: "setup to first\nprospect queue",
      },
    ],
    benefits: [
      {
        eyebrow: "Content-first prospecting",
        title: "Your articles define what's a fit — not a keyword list.",
        description:
          "Traditional prospecting tools start from a competitor backlink export or a seed keyword. Mentiohunt starts from what you published — and identifies sites where each specific article fits editorially.",
        preview: {
          label: "Prospecting from: guide on B2B SaaS go-to-market",
          items: [
            "Founder resource hub — strong editorial match",
            "SaaS tools directory — audience overlap confirmed",
            "Roundup: growth playbooks for early-stage teams — placement angle identified",
            "Newsletter link list — topical fit, relevant readership",
          ],
        },
      },
      {
        eyebrow: "Scored and ranked",
        title: "Know why each prospect made the list.",
        description:
          "A scored queue is only useful if you trust the scores. Every result includes a plain-English rationale explaining why the site is worth emailing — so you can agree, deprioritize, or skip without second-guessing.",
        preview: {
          label: "Prospect detail: Founder tools directory",
          items: [
            "Topical fit score: 94",
            "Editorial focus: tools and resources for early-stage founders",
            "Your article fit: covers go-to-market for B2B SaaS — direct audience match",
            "Placement angle: resource link alongside listed founder tools",
          ],
        },
      },
      {
        eyebrow: "Daily refresh",
        title: "New prospects every morning, automatically.",
        description:
          "The prospect queue refreshes daily as Mentiohunt re-scans your content, checks for new sites in your topic area, and re-scores existing prospects against updated editorial signals.",
        preview: {
          label: "New prospects — this morning",
          items: [
            "2 new directories discovered in your category",
            "1 roundup article updated — your topic now covered",
            "3 resource pages re-scored after content update",
            "1 prospect removed — editorial focus shifted away",
          ],
        },
      },
    ],
    comparison: {
      caption: "How Mentiohunt approaches link prospecting",
      rows: [
        {
          label: "Prospecting starting point",
          others: "Competitor backlink export",
          mentiohunt: "Your published articles",
        },
        {
          label: "Scoring method",
          others: "Domain authority / DR",
          mentiohunt: "Topical fit per article",
        },
        {
          label: "Rationale per prospect",
          others: "Metrics only",
          mentiohunt: "Plain-English editorial reason",
        },
        {
          label: "Queue refresh",
          others: "Manual re-run required",
          mentiohunt: "Daily, automatic",
        },
        {
          label: "Setup to first prospect",
          others: "Full tool onboarding + export",
          mentiohunt: "Sitemap + 2–3 articles",
        },
      ],
    },
    cta: {
      title: "Start with your content. See what's worth emailing.",
      description:
        "Mentiohunt surfaces the sites that fit your articles — scored, ranked, and ready to act on.",
      button: "Start prospecting",
    },
  },
  {
    slug: "backlink-opportunity-finder",
    eyebrow: "Backlink opportunity finder",
    title: "Find backlink opportunities that actually fit your content",
    shortTitle: "Backlink opportunity finder",
    description:
      "Mentiohunt scans the web for sites where your articles belong — not just high-authority domains, but pages where your content adds real context and a placement makes editorial sense.",
    keyword: "backlink opportunity finder",
    h2: "Surface opportunities worth acting on, not just sites worth emailing.",
    category: "Backlink building",
    metric: "40+",
    metricLabel: "qualified opportunities\nper article per month",
    primaryCta: "Find your first opportunity",
    secondaryCta: "See how it works",
    heroCardTitle: "Opportunity: Resource page — early-stage SaaS tools",
    heroCardDescription:
      "This page already references tools for founder-led go-to-market. Your article on distribution is a direct fit — editorial match confirmed, contact details ready.",
    sampleLabel: "Why this opportunity surfaced",
    sampleTitle: "Editorial fit confirmed — placement angle identified",
    sampleBody:
      "The resource page lists content relevant to early-stage B2B founders. Your article covers a topic already represented there. The opportunity is to request a resource link, not a cold mention.",
    inputs: [
      "Sitemap or article URLs",
      "Competitor domains",
      "Keywords describing your topic",
      "Product and audience context",
    ],
    outcomes: [
      "Opportunity list scored by editorial fit",
      "Plain-English reason for each match",
      "Placement angle per opportunity",
      "Outreach draft tied to the specific page",
    ],
    workflow: [
      {
        title: "Feed in your articles",
        description:
          "Add your sitemap or a selection of high-intent articles. Mentiohunt builds a topical model for each one — understanding the topic, audience, and what kind of site would naturally reference it.",
      },
      {
        title: "Find where each article fits",
        description:
          "The finder scans directories, resource pages, roundup articles, and editorial sites for pages where your article adds genuine context. Fit is scored against editorial topic, not domain size.",
      },
      {
        title: "Act on the clearest opportunities",
        description:
          "Each result includes a fit score, a placement rationale, and a ready-to-edit outreach draft. Start with the highest-scored opportunity and work down the list.",
      },
    ],
    reasons: [
      "Topical fit scoring surfaces opportunities you'd otherwise miss in a keyword export.",
      "Each opportunity includes a placement rationale — not just a domain and a DA score.",
      "The queue refreshes daily so you always have something worth reviewing.",
    ],
    faq: [
      {
        question: "What counts as a backlink opportunity?",
        answer:
          "A backlink opportunity is any site or page where your content is a genuine editorial fit — a resource page that already lists related content, a roundup article that covers your topic, a directory that accepts relevant tools, or an editorial site whose audience overlaps with yours.",
      },
      {
        question: "How does Mentiohunt identify fit?",
        answer:
          "The system compares the topic and editorial focus of each external site against your article's content. It looks for sites that already cover your category, reference content like yours, or serve an audience likely to benefit from what you've published.",
      },
      {
        question: "Does this guarantee I'll get a backlink?",
        answer:
          "No. Mentiohunt finds opportunities and prepares your outreach — whether a site links to you depends on the site owner. The focus is on surfacing relevant opportunities where a request makes editorial sense, not on guaranteeing placement.",
      },
      {
        question: "How often does the opportunity list refresh?",
        answer:
          "The queue refreshes daily. Mentiohunt re-scans your content, checks for newly published sites in your category, and updates scores on existing opportunities as editorial signals change.",
      },
      {
        question: "Can I find opportunities for a new site with little content?",
        answer:
          "Yes. Two or three solid articles are enough to start. The opportunity list grows and improves as you add more content, competitors, and target keywords — but even a small content set surfaces relevant placements.",
      },
    ],
    updatedAt: "2026-06-22",
    relatedArticle: {
      title: "How to Find Backlink Opportunities (Practical Guide)",
      href: "/blog/how-to-find-backlink-opportunities",
    },
    heroBadge: "Backlink opportunity finder",
    titleHighlight: "actually fit your content",
    heroStats: [
      {
        value: 40,
        suffix: "+",
        label: "qualified opportunities\nper article per month",
      },
      {
        value: 91,
        suffix: "",
        label: "average editorial\nfit score",
      },
      {
        value: 1,
        suffix: " day",
        label: "to first scored\nopportunity queue",
      },
    ],
    benefits: [
      {
        eyebrow: "Editorial fit scoring",
        title: "Opportunities ranked by how well your article fits — not by DA.",
        description:
          "Domain authority tells you a site is powerful. It doesn't tell you whether your article belongs there. Mentiohunt scores on editorial fit — topic alignment, audience overlap, placement angle — so you know which opportunity is actually worth pursuing.",
        preview: {
          label: "Opportunity detail: SaaS resource hub",
          items: [
            "Editorial fit score: 91",
            "Topic match: early-stage SaaS go-to-market",
            "Placement angle: resource link in 'distribution tools' section",
            "Audience: founders at idea-to-product stage",
          ],
        },
      },
      {
        eyebrow: "Placement rationale included",
        title: "Understand every opportunity before you act on it.",
        description:
          "Each result includes a plain-English explanation of why the site surfaced — what the editorial overlap is, what kind of placement makes sense, and what to say in your outreach. No guessing, no interpreting raw metrics.",
        preview: {
          label: "Why this opportunity made the list",
          items: [
            "Site already lists tools for early-stage founders",
            "Your article covers a topic already represented on the page",
            "Placement type: resource link, not editorial mention",
            "Outreach angle: reference the existing section, propose the addition",
          ],
        },
      },
      {
        eyebrow: "Daily queue",
        title: "New opportunities surface every morning.",
        description:
          "The finder refreshes daily — re-scanning your content, discovering newly published sites in your category, and re-scoring existing opportunities as editorial signals change. You always have something worth reviewing.",
        preview: {
          label: "New this morning",
          items: [
            "3 resource pages discovered in your category",
            "1 roundup article — your topic newly covered",
            "2 opportunities re-scored after site content update",
            "1 removed — site went off-topic",
          ],
        },
      },
    ],
    comparison: {
      caption: "How Mentiohunt finds backlink opportunities vs. alternatives",
      rows: [
        {
          label: "Opportunity identification method",
          others: "Competitor backlink export",
          mentiohunt: "Article-to-site editorial fit scan",
        },
        {
          label: "Scoring basis",
          others: "Domain authority / traffic",
          mentiohunt: "Topical fit + placement angle",
        },
        {
          label: "Placement rationale",
          others: "Not provided",
          mentiohunt: "Plain-English reason per opportunity",
        },
        {
          label: "Outreach prep",
          others: "Manual, from template",
          mentiohunt: "Draft ready per opportunity",
        },
        {
          label: "Queue refresh",
          others: "Manual re-run",
          mentiohunt: "Daily, automatic",
        },
      ],
    },
    cta: {
      title: "See which sites your articles actually belong on.",
      description:
        "Mentiohunt finds backlink opportunities where your content is a genuine editorial fit — scored, explained, and ready to act on.",
      button: "Find your first opportunity",
    },
  },
]

export function getFeatureBySlug(slug: string) {
  return features.find((feature) => feature.slug === slug)
}
