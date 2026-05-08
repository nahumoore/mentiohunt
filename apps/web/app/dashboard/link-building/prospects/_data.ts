import {
  IconCircleX,
  IconMessage,
  IconSend,
  IconSparkles,
  IconTrophy,
} from "@tabler/icons-react"
import type { ElementType } from "react"

import type { OpportunityType, TypeConfig } from "@/lib/opportunity-types"
export { TYPE_CONFIG } from "@/lib/opportunity-types"
export type { OpportunityType, TypeConfig }

export type OpportunityStatus =
  | "new"
  | "contacted"
  | "replied"
  | "won"
  | "dismissed"

export interface Contact {
  name: string
  role: string
  email: string
}

export interface Opportunity {
  id: string
  domain: string
  pageUrl: string
  pageTitle: string
  type: OpportunityType
  fitScore: number
  fitReason: string
  domainRating: number
  monthlyTraffic: number
  status: OpportunityStatus
  emailSubject: string
  emailBody: string
  contact: Contact | null
  discoveredAt: string
}

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: "1",
    domain: "backlinko.com",
    pageUrl: "https://backlinko.com/seo-tools",
    pageTitle: "The Best SEO Tools of 2024 (Tested & Ranked)",
    type: "resource_pages",
    fitScore: 94,
    fitReason:
      "Links to 50+ SEO and backlink tools. Your product fits directly under the 'prospecting' category alongside Ahrefs and Semrush.",
    domainRating: 90,
    monthlyTraffic: 2_400_000,
    status: "new",
    emailSubject: "Quick addition to your SEO tools list?",
    emailBody: `Hi Brian,

Big fan of the SEO tools roundup — it's one of the most thorough lists out there.

I noticed the prospecting section covers Ahrefs and Semrush but doesn't include tools built specifically for the discovery-queue side of backlink outreach. I built Mentiohunt for exactly that gap: it surfaces qualified opportunities daily and queues them with a clear outreach angle, so founders aren't manually running Google searches.

Would love to send you a quick demo or a trial account if it's a fit for the list.

Thanks,
[Your name]`,
    contact: {
      name: "Brian Dean",
      role: "Founder",
      email: "brian@backlinko.com",
    },
    discoveredAt: "2026-05-06",
  },
  {
    id: "2",
    domain: "ahrefs.com",
    pageUrl: "https://ahrefs.com/blog/link-building-tools/",
    pageTitle: "17 Best Link Building Tools to Get More Backlinks",
    type: "competitor_mentions",
    fitScore: 88,
    fitReason:
      "Mentions 4 direct competitors but not Mentiohunt. Article is actively maintained and rankings are climbing.",
    domainRating: 88,
    monthlyTraffic: 1_800_000,
    status: "new",
    emailSubject: "Tool you might be missing in the link building roundup",
    emailBody: `Hi Tim,

Your link building tools article does a great job covering the analytics side. One angle it doesn't hit yet is the founder/small agency segment — people who need opportunity discovery without the enterprise price tag.

Mentiohunt fills that gap: it runs automated prospecting jobs and delivers a daily queue of qualified outreach opportunities with fit scores and ready-to-send angles. No manual research required.

Happy to share a concrete example or trial access if you're considering an update.

Cheers,
[Your name]`,
    contact: {
      name: "Tim Soulo",
      role: "CMO",
      email: "tim@ahrefs.com",
    },
    discoveredAt: "2026-05-06",
  },
  {
    id: "3",
    domain: "neilpatel.com",
    pageUrl: "https://neilpatel.com/blog/link-building/",
    pageTitle: "The Definitive Guide to Link Building",
    type: "resource_pages",
    fitScore: 81,
    fitReason:
      "Two tools mentioned in section 4 have shut down. The link targets are dead 404 pages. A replacement recommendation is a natural ask.",
    domainRating: 85,
    monthlyTraffic: 950_000,
    status: "new",
    emailSubject:
      "Two broken links in your link building guide (+ replacement)",
    emailBody: `Hi,

Noticed two links in section 4 of your link building guide are now dead — both point to tools that have shut down. The anchor text still reads as active recommendations, which might confuse readers.

I built Mentiohunt to cover exactly the use case those tools addressed: automated backlink prospecting and outreach queuing. It'd be a natural working replacement.

Happy to share a one-liner description if you're open to a quick update.

Best,
[Your name]`,
    contact: null,
    discoveredAt: "2026-05-05",
  },
  {
    id: "4",
    domain: "searchengineland.com",
    pageUrl: "https://searchengineland.com/write-for-us",
    pageTitle: "Write for Search Engine Land",
    type: "niche_blogs",
    fitScore: 76,
    fitReason:
      "Accepts guest posts on SEO tools and workflows. Audience is SEO practitioners and agency owners — close match to your ICP.",
    domainRating: 82,
    monthlyTraffic: 740_000,
    status: "new",
    emailSubject:
      "Guest post pitch: backlink prospecting without enterprise tools",
    emailBody: `Hi Danny,

I'd love to contribute a piece to Search Engine Land. My pitch:

"How to build a backlink prospect queue without an enterprise tool budget"

It would cover a practical workflow for founders and small agencies — manual research steps, how to score opportunities, and how to prep outreach without paying $400/month for a suite. I'd reference Mentiohunt naturally mid-article as one option in the workflow.

The audience fit looks strong: your SEO practitioner and agency readership deals with this exact budget constraint. Happy to share an outline or writing samples.

Thanks,
[Your name]`,
    contact: {
      name: "Danny Goodwin",
      role: "Managing Editor",
      email: "editorial@searchengineland.com",
    },
    discoveredAt: "2026-05-05",
  },
  {
    id: "5",
    domain: "seoroundtable.com",
    pageUrl: "https://www.seroundtable.com/tools",
    pageTitle: "SEO Tools & Software Directory",
    type: "directories",
    fitScore: 72,
    fitReason:
      "Niche directory with 200+ SEO tools listed. Strong category relevance. Getting listed adds a dofollow link from a DR 72 domain with real SEO community traffic.",
    domainRating: 72,
    monthlyTraffic: 280_000,
    status: "new",
    emailSubject: "Listing submission: Mentiohunt — backlink prospecting tool",
    emailBody: `Hi,

I'd like to submit Mentiohunt for inclusion in the SEO Tools directory.

Mentiohunt is a backlink prospecting tool for founders and small agencies. It runs recurring discovery jobs against your niche, competitors, and keywords — and delivers a daily queue of qualified outreach opportunities with fit scores and ready-to-use angles.

Category: Link Building / Prospecting
URL: https://mentiohunt.com

Let me know if you need anything else for the listing.

Thanks,
[Your name]`,
    contact: null,
    discoveredAt: "2026-05-04",
  },
  {
    id: "6",
    domain: "moz.com",
    pageUrl: "https://moz.com/blog/best-link-prospecting-tools",
    pageTitle: "Best Link Prospecting Tools: A Practitioner's Guide",
    type: "competitor_mentions",
    fitScore: 68,
    fitReason:
      "Post references 'automated mention discovery tools' in passing without naming a product. The context matches exactly what Mentiohunt does.",
    domainRating: 91,
    monthlyTraffic: 1_100_000,
    status: "contacted",
    emailSubject:
      "Re: automated mention discovery tools in your prospecting guide",
    emailBody: `Hi Cyrus,

Quick note on your link prospecting guide — in the section on automated mention discovery, you reference the category without naming a specific tool.

Mentiohunt is built exactly for that use case: it monitors the web for brand mentions, competitor references, and niche roundups, then surfaces them as actionable opportunities with outreach angles already written.

If you're considering adding a tool name to that section, I'd be happy to share a short description and a screenshot of the opportunity queue.

Thanks,
[Your name]`,
    contact: {
      name: "Cyrus Shepard",
      role: "SEO Consultant",
      email: "cs@moz.com",
    },
    discoveredAt: "2026-05-03",
  },
  {
    id: "7",
    domain: "bloggingwizard.com",
    pageUrl: "https://bloggingwizard.com/link-building-software/",
    pageTitle: "The Best Link Building Software for Bloggers",
    type: "resource_pages",
    fitScore: 79,
    fitReason:
      "Active roundup maintained quarterly. 8 tools listed, none target the discovery-queue angle Mentiohunt covers. Author is reachable and responsive.",
    domainRating: 67,
    monthlyTraffic: 310_000,
    status: "replied",
    emailSubject: "Loom walkthrough + demo access (as promised)",
    emailBody: `Hi Adam,

Thanks for getting back to me — here's the Loom walkthrough I mentioned: [loom link]

The key difference from the tools already on your list: Mentiohunt focuses on the discovery-queue side rather than link analysis. You set up your niche, competitors, and target keywords once — it then runs jobs automatically and queues up opportunities with a fit score and a suggested outreach angle for each one.

I've also added a trial account for you: [trial link]

Happy to answer any questions or jump on a quick call.

Cheers,
[Your name]`,
    contact: {
      name: "Adam Connell",
      role: "Founder",
      email: "adam@bloggingwizard.com",
    },
    discoveredAt: "2026-05-01",
  },
  {
    id: "8",
    domain: "reliablesoft.net",
    pageUrl: "https://www.reliablesoft.net/backlink-tools/",
    pageTitle: "10 Best Backlink Tools for Beginners",
    type: "resource_pages",
    fitScore: 61,
    fitReason:
      "Beginner-focused roundup targeting small business owners. Audience overlap is good but DR is modest. Useful for topical relevance more than raw authority.",
    domainRating: 58,
    monthlyTraffic: 120_000,
    status: "dismissed",
    emailSubject: "Addition to your beginner backlink tools list?",
    emailBody: `Hi,

Came across your beginner backlink tools roundup — great breakdown for small business owners.

One gap I noticed: none of the tools listed are built specifically for founders who can't afford to do manual prospecting every week. Mentiohunt automates that — it runs discovery jobs and queues up outreach opportunities so you always know what to do next.

Would it be a fit for the list? Happy to share more details or a trial account.

Thanks,
[Your name]`,
    contact: null,
    discoveredAt: "2026-05-02",
  },
]

export interface StatusConfig {
  label: string
  icon: ElementType
  color: string
}

export const STATUS_CONFIG: Record<OpportunityStatus, StatusConfig> = {
  new: {
    label: "New",
    icon: IconSparkles,
    color: "text-blue-600 bg-blue-500/10",
  },
  contacted: {
    label: "Contacted",
    icon: IconSend,
    color: "text-orange-600 bg-orange-500/10",
  },
  replied: {
    label: "Replied",
    icon: IconMessage,
    color: "text-amber-600 bg-amber-500/10",
  },
  won: {
    label: "Won",
    icon: IconTrophy,
    color: "text-emerald-600 bg-emerald-500/10",
  },
  dismissed: {
    label: "Dismissed",
    icon: IconCircleX,
    color: "text-muted-foreground bg-muted",
  },
}

export function formatTraffic(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toString()
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 bg-emerald-500/10"
  if (score >= 60) return "text-amber-600 bg-amber-500/10"
  if (score >= 40) return "text-orange-600 bg-orange-500/10"
  return "text-red-600 bg-red-500/10"
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
