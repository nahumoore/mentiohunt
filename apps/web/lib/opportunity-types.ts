import { IconLink, IconNews, IconSwords } from "@tabler/icons-react"
import type { Database } from "@workspace/supabase/database-types"
import type { ElementType } from "react"

export type OpportunityType =
  | "competitor_backlinks"
  | "unlinked_mentions"
  | "media_mentions"

export type ProspectTier = Database["public"]["Enums"]["prospect_tier"]

export interface TypeConfig {
  label: string
  description: string
  icon: ElementType
  color: string
}

export const TYPE_CONFIG: Record<OpportunityType, TypeConfig> = {
  media_mentions: {
    label: "Media Mentions",
    description:
      "Journalist and PR requests from platforms like JournoFinder, Qwoted, and Featured. Respond to get cited in published articles.",
    icon: IconNews,
    color: "text-blue-600 bg-blue-500/10",
  },
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
}

export const OPPORTUNITY_TYPE_TO_PROSPECT_TIER = {
  competitor_backlinks: "competitor_backlink",
  unlinked_mentions: "unlinked_mention",
  media_mentions: "media_mention",
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
  media_mention: {
    ...TYPE_CONFIG.media_mentions,
    label: "Media mention",
    description:
      "A press or media reference to your product that surfaced via inbox or social monitoring.",
  },
}
