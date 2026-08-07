import { IconLink, IconLinkOff, IconLinkPlus, IconListNumbers, IconSwords } from "@tabler/icons-react"
import type { Database } from "@workspace/supabase/database-types"
import type { ElementType } from "react"

export type OpportunityType =
  | "competitor_backlinks"
  | "unlinked_mentions"
  | "listicle_roundups"
  | "resource_page_inclusions"
  | "broken_link_buildings"

export type ProspectTier = Database["public"]["Enums"]["prospect_tier"]

export const DEFAULT_PROSPECT_TIERS = [
  "competitor_backlink",
  "unlinked_mention",
  "listicle_roundup",
  "resource_page_inclusion",
  "broken_link_building",
] satisfies ProspectTier[]

export interface TypeConfig {
  label: string
  description: string
  icon: ElementType
  color: string
}

export const TYPE_CONFIG: Record<OpportunityType, TypeConfig> = {
  competitor_backlinks: {
    label: "Competitor Backlinks",
    description:
      "Pages that already recommend or mention products like yours. These are usually more valuable, but harder to win.",
    icon: IconSwords,
    color: "text-amber-600 bg-amber-500/10",
  },
  unlinked_mentions: {
    label: "Unlinked Mentions",
    description:
      "Pages that already mention your product but do not link to it yet. This is often the best tradeoff because the site already knows you.",
    icon: IconLink,
    color: "text-violet-600 bg-violet-500/10",
  },
  listicle_roundups: {
    label: "Listicle & Roundup Inclusion",
    description:
      "\"Best X tools\" and \"top N alternatives\" posts ranking in your niche. Pitch adding your product. High intent, recurring as posts get updated.",
    icon: IconListNumbers,
    color: "text-blue-600 bg-blue-500/10",
  },
  resource_page_inclusions: {
    label: "Resource Page Inclusions",
    description:
      "Curated resource pages where one of your existing pages would be a useful addition for readers.",
    icon: IconLink,
    color: "text-emerald-600 bg-emerald-500/10",
  },
  broken_link_buildings: {
    label: "Broken Link Building",
    description:
      "Pages that link to a dead URL in your competitors' backlink profiles, where one of your own pages is a credible replacement.",
    icon: IconLinkOff,
    color: "text-rose-600 bg-rose-500/10",
  },
}

export const OPPORTUNITY_TYPE_TO_PROSPECT_TIER = {
  competitor_backlinks: "competitor_backlink",
  unlinked_mentions: "unlinked_mention",
  listicle_roundups: "listicle_roundup",
  resource_page_inclusions: "resource_page_inclusion",
  broken_link_buildings: "broken_link_building",
} satisfies Record<OpportunityType, ProspectTier>

export const PROSPECT_TIER_CONFIG: Record<ProspectTier, TypeConfig> = {
  competitor_backlink: {
    ...TYPE_CONFIG.competitor_backlinks,
    label: "Competitor backlink",
    description:
      "A page that references competitors or similar products and may be a fit for outreach.",
  },
  unlinked_mention: {
    ...TYPE_CONFIG.unlinked_mentions,
    label: "Unlinked mention",
    description:
      "A page that mentions your product or brand context but has not linked yet.",
  },
  listicle_roundup: {
    ...TYPE_CONFIG.listicle_roundups,
    label: "Listicle roundup",
    description:
      "A \"best of\" or \"top alternatives\" post ranking in your niche that doesn't list your product yet.",
  },
  resource_page_inclusion: {
    ...TYPE_CONFIG.resource_page_inclusions,
    label: "Resource page inclusion",
    description:
      "A curated resource page where one of your existing pages would be a useful addition.",
  },
  broken_link_building: {
    ...TYPE_CONFIG.broken_link_buildings,
    label: "Broken link building",
    description:
      "A page that links to a dead URL, with one of your own pages as a credible replacement.",
  },
  // Deliberately NOT added to TYPE_CONFIG/DEFAULT_PROSPECT_TIERS above — this
  // tier is user-triggered only (submit-url-dialog.tsx), never a discovery
  // rotation strategy. Keeping it out of TYPE_CONFIG is what keeps it out of
  // the discovery-settings picker and its API schema, both of which derive
  // from Object.keys(TYPE_CONFIG).
  user_submitted: {
    label: "Submitted by you",
    description:
      "An article you submitted. We found the contact, picked the best page of yours to pitch, and scheduled the outreach.",
    icon: IconLinkPlus,
    color: "text-sky-600 bg-sky-500/10",
  },
}
