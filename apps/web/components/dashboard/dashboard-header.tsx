"use client"

import {
  IconLayoutDashboard,
  IconLayoutGrid,
  IconMailBolt,
  IconNetwork,
  IconRadar2,
  IconSettings,
  IconSparkles,
  IconTarget,
} from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { HowItWorksDialog } from "@/components/link-building/prospects/how-it-works-dialog"
import { SubmitUrlDialog } from "@/components/link-building/prospects/submit-url-dialog"
import { AddTrackedLinksDialog } from "@/components/link-tracker/add-tracked-links-dialog"
import { NotificationBell } from "@/components/dashboard/notification-bell"
import { SendingModeFlag } from "@/components/dashboard/sending-mode-flag"
import { useEmailAccountStore } from "@/stores/email-account-store"
import { useProductStore } from "@/stores/product-store"
import { useProfileStore } from "@/stores/profile-store"
import { useProspectStore } from "@/stores/prospect-store"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"

const opportunitiesHref = "/dashboard/prospects"
const emailAccountsHref = "/dashboard/email-accounts"

type PageConfig = {
  title: string
  description: string
  icon: React.ElementType
  settingsHref?: string
  action?: React.ReactNode
  showSiteBadge?: boolean
}

const PAGE_CONFIG: Record<string, PageConfig> = {
  "/dashboard/prospects": {
    title: "Prospects",
    description:
      "Prioritized sites and next actions where there is a realistic path toward a backlink.",
    icon: IconSparkles,
    settingsHref: "/dashboard/prospects/settings",
    action: (
      <>
        <SubmitUrlDialog />
        <HowItWorksDialog />
      </>
    ),
  },
  "/dashboard/prospects/settings": {
    title: "Prospect Settings",
    description:
      "Choose which sources should feed your prospect queue. Start broad, then pause anything that feels noisy.",
    icon: IconSettings,
  },
  "/dashboard/directories": {
    title: "Directories",
    description:
      "Browse directories to submit your product to. Sort by authority to prioritize the highest-value listings.",
    icon: IconLayoutGrid,
  },
  "/dashboard/network": {
    title: "Link Exchange",
    description:
      "A private opt-in list for founders open to direct backlink collaboration. Coming soon — reserve your spot now.",
    icon: IconNetwork,
  },
  "/dashboard/targets": {
    title: "Targets",
    description:
      "The pages and keywords we match backlink opportunities against. Prioritize what matters most to build authority where it counts.",
    icon: IconTarget,
    showSiteBadge: true,
  },
  "/dashboard/email-accounts": {
    title: "Email Accounts",
    description:
      "Connect your own inbox so you can reply personally once a prospect responds. Outreach and follow-ups still send automatically until then.",
    icon: IconMailBolt,
  },
  "/dashboard/settings": {
    title: "Settings",
    description: "Manage your profile, notifications, and billing.",
    icon: IconSettings,
  },
  "/dashboard/link-tracker": {
    title: "Link Tracker",
    description:
      "Backlinks you've already earned, re-checked every day. We'll flag anything that disappears, goes nofollow, or changes.",
    icon: IconRadar2,
    action: <AddTrackedLinksDialog />,
  },
}

export function DashboardHeader() {
  const pathname = usePathname()
  const isDashboardHome = pathname === "/dashboard"
  const profile = useProfileStore((state) => state.profile)
  const product = useProductStore((state) => state.product)
  const currentProspectId = getCurrentProspectId(pathname)
  const currentEmailAccountId = getCurrentEmailAccountId(pathname)
  const currentProspectLabel = useProspectStore((state) => {
    if (!currentProspectId) return undefined

    return (
      state.prospectDetailsById[currentProspectId]?.domain ??
      state.prospects.find((prospect) => prospect.id === currentProspectId)
        ?.domain ??
      "Current prospect"
    )
  })
  const currentEmailAccountLabel = useEmailAccountStore((state) => {
    if (!currentEmailAccountId) return undefined
    return state.emailAccountDetailsById[currentEmailAccountId]?.email
  })
  const breadcrumbs = getBreadcrumbs(
    pathname,
    currentProspectId,
    currentProspectLabel,
    currentEmailAccountId,
    currentEmailAccountLabel
  )

  const firstName = profile?.name?.trim()?.split(" ")[0] ?? null
  const pageConfig: PageConfig | null = isDashboardHome
    ? {
        title: `Welcome back${firstName ? `, ${firstName}` : ""}.`,
        description:
          "Stay on top of your backlink outreach and steer what happens next.",
        icon: IconLayoutDashboard,
      }
    : (PAGE_CONFIG[pathname] ?? null)
  const PageIcon = pageConfig?.icon ?? null
  const siteBadge =
    pageConfig?.showSiteBadge && product?.website_url
      ? {
          name: product.product_name,
          favicon: getFaviconUrl(product.website_url),
        }
      : null

  return (
    <header>
      <div className="flex h-14 shrink-0 items-center gap-2 px-4 sm:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <nav
          aria-label="Dashboard breadcrumb"
          className="flex min-w-0 flex-1 items-center gap-1.5 text-[0.65rem] font-bold uppercase"
        >
          {breadcrumbs.map((breadcrumb, index) => {
            const isLast = index === breadcrumbs.length - 1

            return (
              <React.Fragment key={breadcrumb.href}>
                {index > 0 ? (
                  <span className="text-muted-foreground/50">/</span>
                ) : null}
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
              </React.Fragment>
            )
          })}
        </nav>
        <SendingModeFlag />
        <NotificationBell />
      </div>

      {pageConfig && PageIcon && (
        <div className="flex flex-col gap-3 px-4 pt-0.5 pb-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pb-6">
          <div>
            <h1 className="flex items-center gap-2.5 font-heading text-[1.75rem] font-bold tracking-tight text-foreground sm:text-[2rem]">
              <PageIcon className="size-8 shrink-0 text-foreground/80" />
              {pageConfig.title}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
              {pageConfig.description}
            </p>
            {siteBadge && (
              <div className="mt-2.5 flex items-center gap-1.5">
                {siteBadge.favicon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={siteBadge.favicon}
                    alt=""
                    width={14}
                    height={14}
                    className="size-3.5 rounded-sm"
                  />
                ) : (
                  <div className="size-3.5 rounded-sm bg-muted" />
                )}
                <span className="text-xs font-medium text-muted-foreground">
                  {siteBadge.name} — your content
                </span>
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {pageConfig.action}
            {pageConfig.settingsHref && (
              <Button
                asChild
                variant="ghost"
                size="default"
                className="shrink-0 sm:mt-1"
              >
                <Link href={pageConfig.settingsHref}>
                  <IconSettings className="size-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

function getBreadcrumbs(
  pathname: string,
  currentProspectId?: string | null,
  currentProspectLabel?: string,
  currentEmailAccountId?: string | null,
  currentEmailAccountLabel?: string
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
      visibleSegments[index - 1] === "prospects"
    const isCurrentEmailAccount =
      segment === currentEmailAccountId &&
      visibleSegments[index - 1] === "email-accounts"

    return {
      label: isCurrentProspect
        ? (currentProspectLabel ?? "Current prospect")
        : isCurrentEmailAccount
          ? (currentEmailAccountLabel ?? titleizeSegment(segment))
          : titleizeSegment(segment),
      href: `/${hrefSegments.join("/")}`,
    }
  })
}

function getCurrentProspectId(pathname: string) {
  const prospectPath = `${opportunitiesHref}/`

  if (!pathname.startsWith(prospectPath)) return null

  const afterBase = pathname.slice(prospectPath.length)

  if (afterBase === "settings" || afterBase.startsWith("settings/")) return null

  const [prospectId] = afterBase.split("/")

  return prospectId || null
}

function getCurrentEmailAccountId(pathname: string) {
  const base = `${emailAccountsHref}/`
  if (!pathname.startsWith(base)) return null
  const [id] = pathname.slice(base.length).split("/")
  return id || null
}

function getFaviconUrl(url: string) {
  try {
    const { hostname } = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch {
    return null
  }
}

function titleizeSegment(segment: string) {
  return decodeURIComponent(segment)
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
