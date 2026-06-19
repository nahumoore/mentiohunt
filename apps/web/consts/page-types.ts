import {
  IconAppWindow,
  IconArticle,
  IconBook2,
  IconSitemap,
  IconWand,
} from "@tabler/icons-react"
import type { ComponentType } from "react"

export type PageType = "landing_page" | "article" | "resource" | "free_tool" | "sitemap"

export const PAGE_TYPE_CONFIG: Record<
  PageType,
  { label: string; icon: ComponentType<{ className?: string; size?: number | string }> }
> = {
  landing_page: {
    label: "Landing Page",
    icon: IconAppWindow,
  },
  article: {
    label: "Article",
    icon: IconArticle,
  },
  resource: {
    label: "Resource",
    icon: IconBook2,
  },
  free_tool: {
    label: "Free Tool",
    icon: IconWand,
  },
  sitemap: {
    label: "Sitemap",
    icon: IconSitemap,
  },
}
