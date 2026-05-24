"use client"

import { IconAlertTriangle } from "@tabler/icons-react"
import Link from "next/link"
import * as React from "react"

import { IconBrandMentiohunt } from "@/components/custom-icons/brand-mentiohunt"
import { NavMain } from "@/components/dashboard/nav-main"
import { NavUser } from "@/components/dashboard/nav-user"
import {
  type DashboardProduct,
  getProductDisplayName,
  useProductStore,
} from "@/stores/product-store"
import { useProfileStore } from "@/stores/profile-store"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@workspace/ui/components/sidebar"
import { Skeleton } from "@workspace/ui/components/skeleton"

const DAY_IN_MS = 24 * 60 * 60 * 1000

function getTrialDaysRemaining(periodEndAt: string) {
  const periodEndTime = new Date(periodEndAt).getTime()

  if (Number.isNaN(periodEndTime)) {
    return 0
  }

  return Math.max(0, Math.ceil((periodEndTime - Date.now()) / DAY_IN_MS))
}

export function AppSidebar({
  user,
  initialProduct,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; avatar: string }
  initialProduct: DashboardProduct | null
}) {
  const product = useProductStore((state) => state.product)
  const profile = useProfileStore((state) => state.profile)
  const productName = getProductDisplayName(product ?? initialProduct)
  const isTrialProfileLoading = profile === null
  const isFreeTrial = profile?.tier === "free" && profile.active_trial
  const trialDaysRemaining = profile
    ? getTrialDaysRemaining(profile.billing_period_end_at)
    : null
  const trialTimeLabel =
    trialDaysRemaining === 0
      ? "Trial ends today"
      : `${trialDaysRemaining} day${trialDaysRemaining === 1 ? "" : "s"} left`

  return (
    <Sidebar
      collapsible="icon"
      className="shadow-[4px_0_24px_0_rgba(0,0,0,0.06)]"
      {...props}
    >
      <SidebarHeader className="p-3 pb-4">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 rounded-lg px-1 py-1 transition-opacity duration-150 hover:opacity-75 group-data-[collapsible=icon]:justify-center focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
          aria-label="Go to Mentiohunt home"
        >
          <IconBrandMentiohunt className="size-6 shrink-0 text-blaze-orange group-data-[collapsible=icon]:size-5" />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate font-heading text-sm font-semibold leading-5 tracking-tight">
              <span className="text-sidebar-foreground">Mentio</span>
              <span className="text-blaze-orange">hunt</span>
            </p>
            <p className="truncate text-xs leading-4 text-sidebar-foreground/50">
              {productName}
            </p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        {isTrialProfileLoading ? (
          <Skeleton className="mx-1 h-[78px] rounded-2xl group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-8" />
        ) : isFreeTrial ? (
          <Link
            href="/dashboard/billing"
            className="group/trial relative mx-1 overflow-hidden rounded-2xl border border-blaze-orange/20 bg-gradient-to-br from-amber-glow/14 via-sidebar to-sidebar p-3 shadow-[0_12px_32px_rgba(255,84,0,0.08)] transition-all duration-200 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:p-0 hover:-translate-y-0.5 hover:border-blaze-orange/35 hover:shadow-[0_16px_36px_rgba(255,84,0,0.13)] focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
            aria-label={`Free trial: ${trialTimeLabel}. Upgrade in billing.`}
          >
            <div className="pointer-events-none absolute -top-8 -right-7 size-20 rounded-full bg-blaze-orange/12 blur-2xl transition-transform duration-300 group-hover/trial:scale-125 group-data-[collapsible=icon]:hidden" />
            <div className="relative flex items-start gap-2.5 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-0">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blaze-orange/12 text-blaze-orange group-data-[collapsible=icon]:size-6">
                <IconAlertTriangle className="size-4" stroke={2.2} />
              </span>
              <span className="min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="block text-[0.68rem] leading-4 font-bold tracking-[0.16em] text-blaze-orange uppercase">
                  Free trial
                </span>
                <span className="mt-0.5 block text-sm leading-5 font-semibold text-sidebar-foreground">
                  {trialTimeLabel}
                </span>
              </span>
            </div>
          </Link>
        ) : null}
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
