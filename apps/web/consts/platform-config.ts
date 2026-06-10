import type { ElementType } from "react"

import { IconBrandRedditNew } from "@/components/custom-icons/brand-reddit-new"
import { IconBrandQuora } from "@/components/custom-icons/brand-quora"

export const PLATFORM_KEYS = ["reddit", "quora"] as const

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
  quora: {
    label: "Quora",
    icon: IconBrandQuora,
    color: "text-red-700 bg-red-500/10",
    accentColor: "#b71c1c",
    description:
      "Surfaces public Quora questions and answers via Google search. Great for finding people asking about your category.",
  },
}
