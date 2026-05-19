import type { ElementType } from "react"
import { IconBrandBluesky } from "@tabler/icons-react"

import { IconBrandRedditNew } from "@/components/custom-icons/brand-reddit-new"

export const PLATFORM_KEYS = ["reddit", "bluesky"] as const

export type MentionPlatform = (typeof PLATFORM_KEYS)[number]

export interface PlatformConfig {
  label: string
  icon: ElementType
  color: string
  accentColor: string
  description: string
}

export const PLATFORM_CONFIG: Record<MentionPlatform, PlatformConfig> = {
  reddit: {
    label: "Reddit",
    icon: IconBrandRedditNew,
    color: "text-orange-600 bg-orange-500/10",
    accentColor: "#ff4500",
    description:
      "Searches subreddits and global Reddit for keyword matches. Supports community-scoped searches.",
  },
  bluesky: {
    label: "Bluesky",
    icon: IconBrandBluesky,
    color: "text-sky-600 bg-sky-500/10",
    accentColor: "#0085ff",
    description:
      "Searches public Bluesky posts for your keywords. Results are sorted by engagement.",
  },
}
