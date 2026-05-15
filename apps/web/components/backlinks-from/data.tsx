import {
  IconArrowRight,
  IconArticle,
  IconBrandInstagram,
  IconBrandPinterest,
  IconBrandWikipedia,
  IconClockHour4,
  IconPencilSearch,
  IconSearch,
  IconTopologyStar3,
} from "@tabler/icons-react"
import type { ComponentType } from "react"

import { IconBrandChatGPT } from "@/components/custom-icons/brand-chatgpt"
import { IconBrandGoogle } from "@/components/custom-icons/brand-google"
import { IconBrandHackerNews } from "@/components/custom-icons/brand-hacker-news"
import { IconBrandLinkedinCustom } from "@/components/custom-icons/brand-linkedin"
import { BrandMediumIcon } from "@/components/custom-icons/brand-medium"
import { IconBrandProductHunt } from "@/components/custom-icons/brand-product-hunt"
import { IconBrandQuora } from "@/components/custom-icons/brand-quora"
import { IconBrandRedditNew } from "@/components/custom-icons/brand-reddit-new"

export const playbook = [
  {
    step: "01",
    title: "Pick the platform that already matches the content",
    text: "Do not start with a dream-site wishlist. Start with the platform whose editorial behavior already fits your article format, tone, and evidence level.",
    Icon: IconTopologyStar3,
  },
  {
    step: "02",
    title: "Find the angle before the outreach",
    text: "The backlink comes after relevance. First identify the thread, question, article gap, or contributor pattern where your page naturally helps.",
    Icon: IconSearch,
  },
  {
    step: "03",
    title: "Bring a useful source, not a naked ask",
    text: "The page has to do real work. Original data, a strong walkthrough, a clearer comparison, or a practical founder perspective beats generic SEO content every time.",
    Icon: IconPencilSearch,
  },
  {
    step: "04",
    title: "Prioritize opportunities that are still warm",
    text: "Fresh discussions, active contributor ecosystems, and recent coverage almost always outperform static prospect lists with no timing signal.",
    Icon: IconClockHour4,
  },
] as const

export const principles = [
  "A platform backlink is earned by fit, not by asking harder.",
  "Most wins come from contributor patterns and useful context, not homepage placements.",
  "Good source pages make the outreach easier because they already answer the recipient's hidden question: why this link?",
] as const

export const relatedResources = [
  {
    label: "Pillar guide",
    title: "How to Find Backlink Opportunities",
    href: "/blog/how-to-find-backlink-opportunities",
    description:
      "The broader workflow for discovering, scoring, and prioritizing link opportunities before you choose a platform-specific playbook.",
  },
  {
    label: "Product angle",
    title: "Mentiohunt Discovery Queue",
    href: "/signup",
    description:
      "Turn your content, keywords, and competitors into a recurring queue of backlink opportunities instead of starting research from zero.",
  },
] as const

export type PlatformSurface = {
  name: string
  Icon: ComponentType<{ className?: string }>
  className: string
}

export const platformSurfaces: PlatformSurface[] = [
  {
    name: "Reddit",
    Icon: IconBrandRedditNew,
    className: "h-8 w-8 sm:h-10 sm:w-10",
  },
  {
    name: "Quora",
    Icon: IconBrandQuora,
    className: "h-8 w-8 sm:h-10 sm:w-10",
  },
  {
    name: "Medium",
    Icon: BrandMediumIcon,
    className: "h-8 w-8 sm:h-10 sm:w-10",
  },
  {
    name: "Wikipedia",
    Icon: IconBrandWikipedia,
    className: "h-8 w-8 sm:h-10 sm:w-10",
  },
  {
    name: "ChatGPT",
    Icon: IconBrandChatGPT,
    className: "h-8 w-8 sm:h-10 sm:w-10",
  },
  {
    name: "Google",
    Icon: IconBrandGoogle,
    className: "h-8 w-8 sm:h-10 sm:w-10",
  },
  {
    name: "LinkedIn",
    Icon: IconBrandLinkedinCustom,
    className: "h-8 w-8 sm:h-10 sm:w-10",
  },
  {
    name: "Hacker News",
    Icon: IconBrandHackerNews,
    className: "h-8 w-8 sm:h-10 sm:w-10",
  },
  {
    name: "Product Hunt",
    Icon: IconBrandProductHunt,
    className: "h-8 w-8 sm:h-10 sm:w-10",
  },
  {
    name: "Instagram",
    Icon: IconBrandInstagram,
    className: "h-8 w-8 sm:h-10 sm:w-10",
  },
  {
    name: "Pinterest",
    Icon: IconBrandPinterest,
    className: "h-8 w-8 sm:h-10 sm:w-10",
  },
]

export function getPlatformCardIcon(slug: string) {
  if (slug === "reddit") return IconBrandRedditNew
  if (slug === "medium") return BrandMediumIcon
  return IconArticle
}

export { IconArrowRight }
