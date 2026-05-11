"use client"

import {
  IconMessage2Share,
  IconRadar,
  IconSearch,
} from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@workspace/ui/components/sidebar"

const linkBuildingHref = "/dashboard/link-building"
const communityMentionsHref = "/dashboard/community-mentions"

type NavItem = {
  title: string
  url: string
  icon: ReactNode
  disabled?: boolean
  badge?: string
  items?: NavItem[]
}

type NavSection = {
  label: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Link Building",
    items: [
      {
        title: "Prospects",
        url: `${linkBuildingHref}/prospects`,
        icon: <IconSearch />,
        items: [
          {
            title: "Discovery Setup",
            url: `${linkBuildingHref}/discovery-setup`,
            icon: <IconRadar />,
          },
        ],
      },
    ],
  },
  {
    label: "Community Mentions",
    items: [
      {
        title: "Reply Queue",
        url: `${communityMentionsHref}/reply-queue`,
        icon: <IconMessage2Share />,
        disabled: true,
        badge: "Soon",
      },
    ],
  },
]

export function NavMain() {
  const pathname = usePathname()

  return (
    <>
      {NAV_SECTIONS.map((section) => (
        <SidebarGroup key={section.label}>
          <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
          <SidebarMenu>
            {section.items.map((item) => {
              const isActive = isRouteActive(pathname, item.url)

              return (
                <SidebarMenuItem key={item.url}>
                  {item.disabled ? (
                    <SidebarMenuButton
                      disabled
                      tooltip={`${item.title} (coming soon)`}
                      className="pr-14"
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={
                        isActive
                          ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                          : undefined
                      }
                    >
                      <Link
                        href={item.url}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                  {item.badge ? (
                    <SidebarMenuBadge className="right-2 bg-orange/10 px-1.5 text-[10px] font-semibold tracking-wide text-primary uppercase ring-1 ring-orange/20">
                      {item.badge}
                    </SidebarMenuBadge>
                  ) : null}
                  {item.items ? (
                    <SidebarMenuSub>
                      {item.items.map((subItem) => {
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
      ))}
    </>
  )
}

function isRouteActive(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`)
}
