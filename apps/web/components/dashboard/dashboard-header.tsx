"use client"

import {
  IconAdjustments,
  IconEye,
  IconLayoutGrid,
  IconMessage2Share,
  IconNetwork,
  IconSearch,
} from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { useDirectorySubmissionStore } from "@/stores/directory-submission-store"
import { useProspectStore } from "@/stores/prospect-store"
import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"

const prospectHref = "/dashboard/link-building/opportunities"
const directorySubmissionHref = "/dashboard/link-building/directories"

type PageConfig = {
  title: string
  description: string
  icon: React.ElementType
}

const NON_CLICKABLE_HREFS = new Set([
  "/dashboard/link-building",
  "/dashboard/community-mentions",
])

const PAGE_CONFIG: Record<string, PageConfig> = {
  "/dashboard/link-building/opportunities": {
    title: "Opportunity Queue",
    description:
      "Prioritized sites and outreach paths where there is a realistic next action toward a backlink.",
    icon: IconSearch,
  },
  "/dashboard/link-building/sources": {
    title: "Sources",
    description:
      "Choose which sources should feed your backlink queue. Start broad, then pause anything that feels noisy.",
    icon: IconAdjustments,
  },
  "/dashboard/link-building/directories": {
    title: "Directories",
    description:
      "Track which directories your product is listed in and whether those listings are indexed by Google.",
    icon: IconLayoutGrid,
  },
  "/dashboard/community-mentions/reply-queue": {
    title: "Reply Queue",
    description:
      "Community mentions matched to your product. Review the fit, refine the reply, and post it yourself from the original thread.",
    icon: IconMessage2Share,
  },
  "/dashboard/community-mentions/watchlist": {
    title: "Watchlist",
    description:
      "Configure which platforms and keywords feed your community reply queue. Start broad, then tighten keywords to improve match quality.",
    icon: IconEye,
  },
  "/dashboard/link-building/backlink-network": {
    title: "Backlink Network",
    description:
      "A private opt-in list for founders open to direct backlink collaboration. Coming soon — reserve your spot now.",
    icon: IconNetwork,
  },
}

export function DashboardHeader() {
  const pathname = usePathname()
  const currentProspectId = getCurrentProspectId(pathname)
  const currentDirectorySubmissionId = getCurrentDirectorySubmissionId(pathname)
  const currentProspectLabel = useProspectStore((state) => {
    if (!currentProspectId) return undefined

    return (
      state.prospectDetailsById[currentProspectId]?.domain ??
      state.prospects.find((prospect) => prospect.id === currentProspectId)
        ?.domain ??
      "Current prospect"
    )
  })
  const currentDirectorySubmissionLabel = useDirectorySubmissionStore((state) => {
    if (!currentDirectorySubmissionId) return undefined

    return (
      state.submissionDetailsById[currentDirectorySubmissionId]?.domain ??
      state.submissions.find(
        (submission) => submission.id === currentDirectorySubmissionId
      )?.domain ??
      "Current directory"
    )
  })
  const breadcrumbs = getBreadcrumbs(
    pathname,
    currentProspectId,
    currentProspectLabel,
    currentDirectorySubmissionId,
    currentDirectorySubmissionLabel
  )

  const pageConfig = PAGE_CONFIG[pathname] ?? null
  const PageIcon = pageConfig?.icon ?? null

  return (
    <header className="border-b">
      <div className="flex h-14 shrink-0 items-center gap-2 px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <nav
          aria-label="Dashboard breadcrumb"
          className="flex min-w-0 items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.16em]"
        >
          {breadcrumbs.map((breadcrumb, index) => {
            const isLast = index === breadcrumbs.length - 1

            return (
              <React.Fragment key={breadcrumb.href}>
                {index > 0 ? (
                  <span className="text-muted-foreground/50">/</span>
                ) : null}
                {NON_CLICKABLE_HREFS.has(breadcrumb.href) ? (
                  <span className="truncate text-muted-foreground">
                    {breadcrumb.label}
                  </span>
                ) : (
                  <Link
                    href={breadcrumb.href}
                    aria-current={isLast ? "page" : undefined}
                    className={
                      isLast
                        ? "truncate text-(--color-blaze-orange)"
                        : "truncate text-muted-foreground transition-colors hover:text-foreground"
                    }
                  >
                    {breadcrumb.label}
                  </Link>
                )}
              </React.Fragment>
            )
          })}
        </nav>
      </div>

      {pageConfig && PageIcon && (
        <div className="px-6 pb-6 pt-0.5">
          <h1 className="flex items-center gap-2.5 font-heading text-[1.75rem] font-bold tracking-tight text-foreground sm:text-[2rem]">
            <PageIcon className="size-8 shrink-0 text-foreground/80" />
            {pageConfig.title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
            {pageConfig.description}
          </p>
        </div>
      )}
    </header>
  )
}

function getBreadcrumbs(
  pathname: string,
  currentProspectId?: string | null,
  currentProspectLabel?: string,
  currentDirectorySubmissionId?: string | null,
  currentDirectorySubmissionLabel?: string
) {
  const segments = pathname.split("/").filter(Boolean)
  const dashboardIndex = segments.indexOf("dashboard")
  const visibleSegments =
    dashboardIndex >= 0 ? segments.slice(dashboardIndex + 1) : segments

  if (visibleSegments.length === 0) {
    return [{ label: "Dashboard", href: "/dashboard" }]
  }

  return visibleSegments.map((segment, index) => {
    const hrefSegments = segments.slice(0, dashboardIndex + 2 + index)
    const isCurrentProspect =
      segment === currentProspectId &&
      visibleSegments[index - 2] === "link-building" &&
      visibleSegments[index - 1] === "opportunities"
    const isCurrentDirectorySubmission =
      segment === currentDirectorySubmissionId &&
      visibleSegments[index - 2] === "link-building" &&
      visibleSegments[index - 1] === "directories"

    return {
      label: isCurrentProspect
        ? (currentProspectLabel ?? "Current prospect")
        : isCurrentDirectorySubmission
          ? (currentDirectorySubmissionLabel ?? "Current directory")
          : titleizeSegment(segment),
      href: `/${hrefSegments.join("/")}`,
    }
  })
}

function getCurrentProspectId(pathname: string) {
  const prospectPath = `${prospectHref}/`

  if (!pathname.startsWith(prospectPath)) return null

  const [prospectId] = pathname.slice(prospectPath.length).split("/")

  return prospectId || null
}

function getCurrentDirectorySubmissionId(pathname: string) {
  const directorySubmissionPath = `${directorySubmissionHref}/`

  if (!pathname.startsWith(directorySubmissionPath)) return null

  const [directorySubmissionId] = pathname
    .slice(directorySubmissionPath.length)
    .split("/")

  return directorySubmissionId || null
}

function titleizeSegment(segment: string) {
  return decodeURIComponent(segment)
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
