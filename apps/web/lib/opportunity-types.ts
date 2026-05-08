import {
  IconArrowsLeftRight,
  IconLayoutGrid,
  IconList,
  IconListDetails,
  IconPencil,
  IconSwords,
} from "@tabler/icons-react"
import type { ElementType } from "react"

import type { Enums } from "@workspace/supabase/database-types"

export type OpportunityType = Enums<"opportunity_type">

export interface TypeConfig {
  label: string
  description: string
  icon: ElementType
  color: string
}

export const TYPE_CONFIG: Record<OpportunityType, TypeConfig> = {
  directories: {
    label: "Directories",
    description:
      "General or niche directories listing tools, products, or services in your category.",
    icon: IconLayoutGrid,
    color: "text-teal-600 bg-teal-500/10",
  },
  resource_pages: {
    label: "Resource Pages",
    description:
      "Curated pages linking to helpful tools and resources for a specific topic or audience.",
    icon: IconListDetails,
    color: "text-blue-600 bg-blue-500/10",
  },
  listicles: {
    label: "Listicles",
    description:
      "Top-N and roundup articles covering tools or solutions in your niche.",
    icon: IconList,
    color: "text-violet-600 bg-violet-500/10",
  },
  alternatives: {
    label: "Alternatives",
    description:
      "Comparison pages listing alternatives to competing tools — a natural entry point for your product.",
    icon: IconArrowsLeftRight,
    color: "text-amber-600 bg-amber-500/10",
  },
  competitor_mentions: {
    label: "Competitor Mentions",
    description:
      "Content that mentions competing tools but not yours yet.",
    icon: IconSwords,
    color: "text-orange-600 bg-orange-500/10",
  },
  niche_blogs: {
    label: "Niche Blogs",
    description:
      "Relevant blogs and publications in your niche that cover tools or accept contributions.",
    icon: IconPencil,
    color: "text-purple-600 bg-purple-500/10",
  },
}
