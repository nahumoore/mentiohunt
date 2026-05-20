"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { useDirectorySubmissionStore } from "@/stores/directory-submission-store"
import { useProspectStore } from "@/stores/prospect-store"
import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"

const prospectHref = "/dashboard/link-building/opportunities"
const directorySubmissionHref = "/dashboard/link-building/directories"

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

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-vertical:h-4 data-vertical:self-auto"
      />
      <nav
        aria-label="Dashboard breadcrumb"
        className="flex min-w-0 items-center gap-1 text-sm"
      >
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <React.Fragment key={breadcrumb.href}>
              {index > 0 ? (
                <span className="text-muted-foreground">&gt;</span>
              ) : null}
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
