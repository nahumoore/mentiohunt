"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import * as React from "react"

import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { Separator } from "@workspace/ui/components/separator"

export function DashboardHeader() {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
      <nav aria-label="Dashboard breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <React.Fragment key={breadcrumb.href}>
              {index > 0 ? <span className="text-muted-foreground">&gt;</span> : null}
              <Link
                href={breadcrumb.href}
                aria-current={isLast ? "page" : undefined}
                className={
                  isLast
                    ? "truncate font-medium text-foreground"
                    : "truncate text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {breadcrumb.label}
              </Link>
            </React.Fragment>
          )
        })}
      </nav>
    </header>
  )
}

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  const dashboardIndex = segments.indexOf("dashboard")
  const visibleSegments = dashboardIndex >= 0 ? segments.slice(dashboardIndex + 1) : segments

  if (visibleSegments.length === 0) {
    return [{ label: "Dashboard", href: "/dashboard" }]
  }

  return visibleSegments.map((segment, index) => {
    const hrefSegments = segments.slice(0, dashboardIndex + 2 + index)

    return {
      label: titleizeSegment(segment),
      href: `/${hrefSegments.join("/")}`,
    }
  })
}

function titleizeSegment(segment: string) {
  return decodeURIComponent(segment)
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
