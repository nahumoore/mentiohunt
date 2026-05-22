"use client"

import {
  IconAdjustments,
  IconEye,
  IconLayoutGrid,
  IconMessage2Share,
  IconNetwork,
  IconTarget,
} from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@workspace/ui/components/sidebar"
import { cn } from "@workspace/ui/lib/utils"

const linkBuildingHref = "/dashboard/link-building"
const communityMentionsHref = "/dashboard/community-mentions"

type SubItem = {
  title: string
  url: string
  icon: ReactNode
  disabled?: boolean
  badge?: string
}

type PageItem = {
  title: string
  url: string
  icon: ReactNode
  disabled?: boolean
  badge?: string
  items?: SubItem[]
}

type FeatureModule = {
  title: string
  baseHref: string
  pages: PageItem[]
}

const FEATURES: FeatureModule[] = [
  {
    title: "Link Building",
    baseHref: linkBuildingHref,
    pages: [
      {
        title: "Backlink Network",
        url: `${linkBuildingHref}/backlink-network`,
        icon: <IconNetwork />,
      },
      {
        title: "Directories",
        url: `${linkBuildingHref}/directories`,
        icon: <IconLayoutGrid />,
      },
      {
        title: "Opportunities",
        url: `${linkBuildingHref}/opportunities`,
        icon: <IconTarget />,
        items: [
          {
            title: "Sources",
            url: `${linkBuildingHref}/sources`,
            icon: <IconAdjustments />,
          },
        ],
      },
    ],
  },
  {
    title: "Community",
    baseHref: communityMentionsHref,
    pages: [
      {
        title: "Reply Queue",
        url: `${communityMentionsHref}/reply-queue`,
        icon: <IconMessage2Share />,
        items: [
          {
            title: "Watchlist",
            url: `${communityMentionsHref}/watchlist`,
            icon: <IconEye />,
          },
        ],
      },
    ],
  },
]

export function NavMain() {
  const pathname = usePathname()

  return (
    <>
      {FEATURES.map((feature, i) => {
        const isFeatureActive = pathname.startsWith(feature.baseHref)

        return (
          <SidebarGroup
            key={feature.baseHref}
            className="py-0 not-first:mt-4 first:pt-2"
          >
            {/* Feature module header */}
            <div className="mb-2 flex items-center gap-2 px-2 group-data-[collapsible=icon]:hidden">
              <p className="shrink-0 text-[10px] font-bold tracking-[0.18em] text-sidebar-foreground/40 uppercase">
                {feature.title}
              </p>
              <div
                className={cn(
                  "h-px flex-1 transition-colors duration-300",
                  isFeatureActive
                    ? "bg-gradient-to-r from-blaze-orange/40 to-transparent"
                    : "bg-sidebar-border"
                )}
              />
            </div>

            <SidebarMenu>
              {feature.pages.map((page) => {
                const isActive = isRouteActive(pathname, page.url)

                return (
                  <SidebarMenuItem key={page.url}>
                    {page.disabled ? (
                      <SidebarMenuButton
                        disabled
                        tooltip={`${page.title} (coming soon)`}
                        className="pr-14"
                      >
                        {page.icon}
                        <span>{page.title}</span>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={page.title}
                        className={
                          isActive
                            ? "bg-primary text-primary-foreground hover:opacity-80"
                            : undefined
                        }
                      >
                        <Link
                          href={page.url}
                          aria-current={isActive ? "page" : undefined}
                        >
                          {page.icon}
                          <span>{page.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                    {page.badge ? (
                      <SidebarMenuBadge className="right-2 bg-orange/10 px-1.5 text-[10px] font-semibold tracking-wide text-primary uppercase ring-1 ring-orange/20">
                        {page.badge}
                      </SidebarMenuBadge>
                    ) : null}
                    {page.items ? (
                      <SidebarMenuSub>
                        {page.items.map((subItem) => {
                          const isSubItemActive = isRouteActive(
                            pathname,
                            subItem.url
                          )

                          return (
                            <SidebarMenuSubItem key={subItem.url}>
                              {subItem.disabled ? (
                                <SidebarMenuSubButton
                                  aria-disabled="true"
                                  tabIndex={-1}
                                  className="pointer-events-none pr-12 opacity-50"
                                >
                                  {subItem.icon}
                                  <span>{subItem.title}</span>
                                </SidebarMenuSubButton>
                              ) : (
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isSubItemActive}
                                >
                                  <Link
                                    href={subItem.url}
                                    aria-current={
                                      isSubItemActive ? "page" : undefined
                                    }
                                  >
                                    {subItem.icon}
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              )}
                              {subItem.badge ? (
                                <span className="pointer-events-none absolute top-1 right-1 rounded-full bg-orange/10 px-1.5 py-0.5 text-[10px] leading-4 font-semibold tracking-wide text-primary uppercase ring-1 ring-orange/20">
                                  {subItem.badge}
                                </span>
                              ) : null}
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    ) : null}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        )
      })}
    </>
  )
}

function isRouteActive(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`)
}
