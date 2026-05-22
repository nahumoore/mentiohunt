import {
  IconLink,
  IconSwords,
} from "@tabler/icons-react"
import type { ElementType } from "react"

export type OpportunityType =
  | "competitor_backlinks"
  | "unlinked_mentions"

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
}
