import {
  IconAppWindow,
  IconArticle,
  IconBook2,
  IconGitCompare,
  IconPointer,
  IconSitemap,
  IconTrophy,
  IconWand,
} from "@tabler/icons-react"
import type { ComponentType } from "react"

export type PageType =
  | "landing_page"
  | "article"
  | "resource"
  | "free_tool"
  | "sitemap"
  | "case_study"
  | "comparison"
  | "manual"

export const PAGE_TYPE_CONFIG: Record<
  PageType,
  {
    label: string
    icon: ComponentType<{ className?: string; size?: number | string }>
    /** Category hue for the type chip — distinct per type so a target list scans by shape+color before label. */
    color: string
  }
> = {
  landing_page: {
    label: "Landing Page",
    icon: IconAppWindow,
    color: "text-blue-700 dark:text-blue-300 bg-blue-500/10",
  },
  article: {
    label: "Article",
    icon: IconArticle,
    color: "text-violet-700 dark:text-violet-300 bg-violet-500/10",
  },
  resource: {
    label: "Resource",
    icon: IconBook2,
    color: "text-teal-700 dark:text-teal-300 bg-teal-500/10",
  },
  free_tool: {
    label: "Free Tool",
    icon: IconWand,
    color: "text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-500/10",
  },
  sitemap: {
    label: "Sitemap",
    icon: IconSitemap,
    color: "text-slate-700 dark:text-slate-300 bg-slate-500/10",
  },
  case_study: {
    label: "Case Study",
    icon: IconTrophy,
    color: "text-amber-700 dark:text-amber-300 bg-amber-500/10",
  },
  comparison: {
    label: "Comparison",
    icon: IconGitCompare,
    color: "text-orange-700 dark:text-orange-300 bg-orange-500/10",
  },
  manual: {
    label: "Manual",
    icon: IconPointer,
    color: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10",
  },
}
