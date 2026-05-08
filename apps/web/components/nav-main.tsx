"use client"

import {
  IconBroadcast,
  IconLink,
  IconMessage2Share,
  IconNotes,
  IconRadar,
  IconSearch,
} from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@workspace/ui/components/sidebar"

const linkBuildingHref = "/dashboard/link-building"
const communityMentionsHref = "/dashboard/community-mentions"

const NAV_ITEMS = [
  {
    title: "Link Building",
    url: linkBuildingHref,
    icon: <IconLink />,
    items: [
      {
        title: "Prospects Found",
        url: `${linkBuildingHref}/prospects`,
        icon: <IconSearch />,
      },
      {
        title: "Content Library",
        url: `${linkBuildingHref}/content-library`,
        icon: <IconNotes />,
      },
      {
        title: "Discovery Setup",
        url: `${linkBuildingHref}/discovery-setup`,
        icon: <IconRadar />,
      },
    ],
  },
  {
    title: "Community Mentions",
    url: communityMentionsHref,
    icon: <IconBroadcast />,
    items: [
      {
        title: "Reply Queue",
        url: `${communityMentionsHref}/reply-queue`,
        icon: <IconMessage2Share />,
      },
      {
        title: "Listening Setup",
        url: `${communityMentionsHref}/listening-setup`,
        icon: <IconRadar />,
      },
    ],
  },
]

export function NavMain() {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu className="gap-4">
        {NAV_ITEMS.map((item) => {
          const hasActiveSubItem = item.items?.some((subItem) =>
            isRouteActive(pathname, subItem.url)
          )
          const isActive =
            isRouteActive(pathname, item.url) && !hasActiveSubItem

          return (
            <SidebarMenuItem key={item.url}>
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
                  aria-current={pathname === item.url ? "page" : undefined}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
              {item.items?.length ? (
                <SidebarMenuSub>
                  {item.items.map((subItem) => {
                    const isSubItemActive = isRouteActive(pathname, subItem.url)

                    return (
                      <SidebarMenuSubItem key={subItem.url}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isSubItemActive}
                          className={
                            isSubItemActive
                              ? "bg-primary/10 font-medium text-primary hover:bg-primary/10 hover:text-primary"
                              : undefined
                          }
                        >
                          <Link
                            href={subItem.url}
                            aria-current={isSubItemActive ? "page" : undefined}
                          >
                            {subItem.icon}
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
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
}

function isRouteActive(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`)
}
