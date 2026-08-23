import {
  IconActivity,
  IconArticle,
  IconCalculator,
  IconFolderSearch,
  IconLink,
  IconLinkOff,
  IconMail,
  IconMailCheck,
  IconNews,
  IconShieldCheck,
  IconSitemap,
  IconSwords,
  IconTextSize,
  IconUserSearch,
  IconWorldSearch,
  type Icon,
} from "@tabler/icons-react"

import { FREE_TOOL_NAMES, type FreeToolName } from "@/consts/free-tools"

export type FreeToolDirectoryEntry = {
  slug: FreeToolName
  name: string
  eyebrow: string
  description: string
  icon: Icon
}

// Single source of truth for tool metadata — used by the free tools hub grid
// and the related-tools section on each individual tool page.
export const FREE_TOOLS_DIRECTORY: FreeToolDirectoryEntry[] = [
  {
    slug: FREE_TOOL_NAMES.startupDirectories,
    name: "Startup Directory Browser",
    eyebrow: "Directory index",
    description:
      "Browse a startup directory table by category, pricing, authority, backlink, and submission signals before running a gap scan.",
    icon: IconFolderSearch,
  },
  {
    slug: FREE_TOOL_NAMES.directoryBacklinkOpportunityFinder,
    name: "Free Directory Submission Sites",
    eyebrow: "Directory gap check",
    description:
      "Paste your product URL and check it against 100+ free directory submission sites to see which ones you're missing.",
    icon: IconLink,
  },
  {
    slug: FREE_TOOL_NAMES.backlinkPriceCalculator,
    name: "Backlink Price Calculator",
    eyebrow: "Site authority to price",
    description:
      "Enter any website URL to pull live Ahrefs authority metrics and estimate a fair market price for a backlink, adjusted for link type, placement, and content format.",
    icon: IconCalculator,
  },
  {
    slug: FREE_TOOL_NAMES.backlinkOpportunityFinder,
    name: "Backlink Opportunity Finder",
    eyebrow: "Website to opportunities",
    description:
      "Enter your website URL and surface relevant blogs, resource pages, and content hubs where a backlink to your product would be a strong fit.",
    icon: IconWorldSearch,
  },
  {
    slug: FREE_TOOL_NAMES.competitorBacklinkGap,
    name: "Backlink Gap Finder",
    eyebrow: "Competitor gaps to outreach",
    description:
      "Enter your website URL and see which sites link to your competitors but not to you. Turn gap analysis into a prioritized outreach list.",
    icon: IconSwords,
  },
  {
    slug: FREE_TOOL_NAMES.googleIndexChecker,
    name: "Google Index Checker",
    eyebrow: "Sitemap to index status",
    description:
      "Paste your sitemap URL and instantly see which pages Google has indexed, which are missing, and where keyword opportunities exist for each page.",
    icon: IconSitemap,
  },
  {
    slug: FREE_TOOL_NAMES.anchorTextGenerator,
    name: "Anchor Text Generator",
    eyebrow: "Keyword to anchor variants",
    description:
      "Enter a keyword and an optional target URL to generate a full set of anchor text variants — exact match, partial, branded, LSI, and generic — each with a safety label and plain-language guidance.",
    icon: IconTextSize,
  },
  {
    slug: FREE_TOOL_NAMES.authorContactFinder,
    name: "Author Contact Finder",
    eyebrow: "Article to contact",
    description:
      "Paste a blog post URL and find the author's name, role, and most likely contact email — labelled with a confidence level, for backlink outreach.",
    icon: IconUserSearch,
  },
  {
    slug: FREE_TOOL_NAMES.guestPostSitesFinder,
    name: "Guest Post Sites Finder",
    eyebrow: "Website to guest-post targets",
    description:
      "Enter your website URL and find sites in your niche that publicly invite guest contributors, each with a fit score and rationale.",
    icon: IconArticle,
  },
  {
    slug: FREE_TOOL_NAMES.backlinkOutreachEmailGenerator,
    name: "Backlink Outreach Email Generator",
    eyebrow: "Details to outreach draft",
    description:
      "Enter your details and a target site to generate four ready-to-send outreach emails — guest post, broken link, resource page, and unlinked mention — each with a follow-up.",
    icon: IconMail,
  },
  {
    slug: FREE_TOOL_NAMES.dofollowLinkChecker,
    name: "Dofollow Link Checker",
    eyebrow: "Page to link breakdown",
    description:
      "Paste any page URL and see every outbound link on it — dofollow, nofollow, ugc, or sponsored — split by internal and external.",
    icon: IconShieldCheck,
  },
  {
    slug: FREE_TOOL_NAMES.brokenLinkFinder,
    name: "Broken Link Finder",
    eyebrow: "Website to dead-link outreach",
    description:
      "Enter your website URL and find real pages in your niche with dead outbound links — each one a ready-made pitch to suggest your resource as the replacement.",
    icon: IconLinkOff,
  },
  {
    slug: FREE_TOOL_NAMES.bulkEmailVerifier,
    name: "Bulk Email Verifier",
    eyebrow: "List to risk signals",
    description:
      "Paste a list of contact emails and check each for syntax, disposable domains, and role-based addresses before you send outreach to it.",
    icon: IconMailCheck,
  },
  {
    slug: FREE_TOOL_NAMES.backlinkMonitor,
    name: "Backlink Monitor",
    eyebrow: "Link list to live status",
    description:
      "Paste your domain and the pages where you have backlinks, and check right now which ones are still live, gone nofollow, or dropped.",
    icon: IconActivity,
  },
  {
    slug: FREE_TOOL_NAMES.pressReleaseGenerator,
    name: "Press Release Generator",
    eyebrow: "Details to formatted release",
    description:
      "Fill in your announcement details and get a properly formatted press release — dateline, lead paragraph, quote, boilerplate, and media contact — for a launch, funding round, partnership, or milestone.",
    icon: IconNews,
  },
]

export function getFreeToolEntry(slug: FreeToolName) {
  return FREE_TOOLS_DIRECTORY.find((tool) => tool.slug === slug)
}

// Curated (not random) so each page links to genuinely adjacent workflows.
export const RELATED_FREE_TOOLS: Record<FreeToolName, FreeToolName[]> = {
  [FREE_TOOL_NAMES.startupDirectories]: [
    FREE_TOOL_NAMES.directoryBacklinkOpportunityFinder,
    FREE_TOOL_NAMES.backlinkOpportunityFinder,
    FREE_TOOL_NAMES.competitorBacklinkGap,
  ],
  [FREE_TOOL_NAMES.directoryBacklinkOpportunityFinder]: [
    FREE_TOOL_NAMES.startupDirectories,
    FREE_TOOL_NAMES.backlinkOpportunityFinder,
    FREE_TOOL_NAMES.guestPostSitesFinder,
  ],
  [FREE_TOOL_NAMES.backlinkPriceCalculator]: [
    FREE_TOOL_NAMES.backlinkOpportunityFinder,
    FREE_TOOL_NAMES.dofollowLinkChecker,
    FREE_TOOL_NAMES.competitorBacklinkGap,
  ],
  [FREE_TOOL_NAMES.backlinkOpportunityFinder]: [
    FREE_TOOL_NAMES.competitorBacklinkGap,
    FREE_TOOL_NAMES.guestPostSitesFinder,
    FREE_TOOL_NAMES.authorContactFinder,
  ],
  [FREE_TOOL_NAMES.competitorBacklinkGap]: [
    FREE_TOOL_NAMES.backlinkOpportunityFinder,
    FREE_TOOL_NAMES.backlinkPriceCalculator,
    FREE_TOOL_NAMES.dofollowLinkChecker,
  ],
  [FREE_TOOL_NAMES.googleIndexChecker]: [
    FREE_TOOL_NAMES.dofollowLinkChecker,
    FREE_TOOL_NAMES.anchorTextGenerator,
    FREE_TOOL_NAMES.backlinkOpportunityFinder,
  ],
  [FREE_TOOL_NAMES.anchorTextGenerator]: [
    FREE_TOOL_NAMES.backlinkOutreachEmailGenerator,
    FREE_TOOL_NAMES.googleIndexChecker,
    FREE_TOOL_NAMES.dofollowLinkChecker,
  ],
  [FREE_TOOL_NAMES.authorContactFinder]: [
    FREE_TOOL_NAMES.bulkEmailVerifier,
    FREE_TOOL_NAMES.backlinkOutreachEmailGenerator,
    FREE_TOOL_NAMES.guestPostSitesFinder,
  ],
  [FREE_TOOL_NAMES.guestPostSitesFinder]: [
    FREE_TOOL_NAMES.authorContactFinder,
    FREE_TOOL_NAMES.backlinkOutreachEmailGenerator,
    FREE_TOOL_NAMES.pressReleaseGenerator,
  ],
  [FREE_TOOL_NAMES.backlinkOutreachEmailGenerator]: [
    FREE_TOOL_NAMES.bulkEmailVerifier,
    FREE_TOOL_NAMES.authorContactFinder,
    FREE_TOOL_NAMES.pressReleaseGenerator,
  ],
  [FREE_TOOL_NAMES.dofollowLinkChecker]: [
    FREE_TOOL_NAMES.backlinkMonitor,
    FREE_TOOL_NAMES.brokenLinkFinder,
    FREE_TOOL_NAMES.googleIndexChecker,
  ],
  [FREE_TOOL_NAMES.brokenLinkFinder]: [
    FREE_TOOL_NAMES.backlinkMonitor,
    FREE_TOOL_NAMES.backlinkOutreachEmailGenerator,
    FREE_TOOL_NAMES.dofollowLinkChecker,
  ],
  [FREE_TOOL_NAMES.bulkEmailVerifier]: [
    FREE_TOOL_NAMES.authorContactFinder,
    FREE_TOOL_NAMES.backlinkOutreachEmailGenerator,
    FREE_TOOL_NAMES.guestPostSitesFinder,
  ],
  [FREE_TOOL_NAMES.backlinkMonitor]: [
    FREE_TOOL_NAMES.dofollowLinkChecker,
    FREE_TOOL_NAMES.competitorBacklinkGap,
    FREE_TOOL_NAMES.brokenLinkFinder,
  ],
  [FREE_TOOL_NAMES.pressReleaseGenerator]: [
    FREE_TOOL_NAMES.backlinkOutreachEmailGenerator,
    FREE_TOOL_NAMES.guestPostSitesFinder,
    FREE_TOOL_NAMES.authorContactFinder,
  ],
  // Registered in FREE_TOOL_NAMES but has no live page yet — no related-tools entry needed.
  [FREE_TOOL_NAMES.directoryOpportunityFinder]: [],
}
