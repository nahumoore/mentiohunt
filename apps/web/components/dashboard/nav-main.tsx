"use client"

import {
  IconFiles,
  IconLayoutGrid,
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
  pages: PageItem[]
}

const FEATURES: FeatureModule[] = [
  {
    title: "Main",
    pages: [
      {
        title: "Outreach",
        url: "/dashboard/outreach",
        icon: <IconTarget />,
      },
      {
        title: "Pages",
        url: "/dashboard/pages",
        icon: <IconFiles />,
      },
    ],
  },
  {
    title: "Submissions",
    pages: [
      {
        title: "Directories",
        url: "/dashboard/directories",
        icon: <IconLayoutGrid />,
      },
      {
        title: "Link Exchange",
        url: "/dashboard/network",
        icon: <IconNetwork />,
      },
    ],
  },
]

export function NavMain() {
  const pathname = usePathname()

  return (
    <>
      {FEATURES.map((feature) => {
        return (
          <SidebarGroup
            key={feature.title}
            className="py-0 not-first:mt-3 first:pt-3"
          >
            <div className="mb-1 px-3 pb-1 group-data-[collapsible=icon]:hidden">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {feature.title}
              </p>
            </div>

            <SidebarMenu>
              {feature.pages.map((page) => {
                const isSubActive = page.items?.some((sub) => isRouteActive(pathname, sub.url)) ?? false
                const isActive = !isSubActive && isRouteActive(pathname, page.url)

                return (
                  <SidebarMenuItem key={page.url}>
                    {page.disabled ? (
                      <SidebarMenuButton
                        disabled
                        tooltip={`${page.title} (coming soon)`}
                        className="gap-3 px-3 py-2 text-sm font-medium text-sidebar-foreground/50"
                      >
                        {page.icon}
                        <span>{page.title}</span>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={page.title}
                        className={cn(
                          "gap-3 px-3 py-2 text-sm",
                          isActive
                            ? "relative font-semibold text-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary hover:bg-primary/15 hover:text-primary"
                            : "font-medium text-sidebar-foreground/80 hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Link
                          href={page.url}
                          aria-current={isActive ? "page" : undefined}
                        >
                          {isActive && (
                            <span className="absolute top-1.5 bottom-1.5 left-0 w-1 rounded-r-full bg-primary" />
                          )}
                          {page.icon}
                          <span>{page.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                    {page.badge ? (
                      <SidebarMenuBadge className="right-2 bg-orange/10 px-1.5 text-[10px] font-semibold text-primary uppercase ring-1 ring-orange/20">
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
                                <span className="pointer-events-none absolute top-1 right-1 rounded-full bg-orange/10 px-1.5 py-0.5 text-[10px] leading-4 font-semibold text-primary uppercase ring-1 ring-orange/20">
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
