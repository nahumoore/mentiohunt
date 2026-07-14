"use client"

import { IconAlertTriangle, IconSettings } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
  const pathname = usePathname()
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
      <SidebarHeader className="border-b p-0">
        <Link
          href="/"
          className="flex h-16 items-center gap-2.5 px-5 transition-opacity duration-150 hover:opacity-75 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          aria-label="Go to Mentiohunt home"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <IconBrandMentiohunt className="size-5" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="font-heading text-base font-bold leading-5 tracking-tight text-sidebar-foreground">
              Mentiohunt
            </p>
            <p className="truncate text-xs leading-4 text-muted-foreground">
              {user.email}
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
            className="group/trial mx-1 flex items-center gap-2.5 rounded-xl border border-blaze-orange/20 bg-blaze-orange/5 p-2.5 transition-colors hover:border-blaze-orange/35 hover:bg-blaze-orange/8 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
            aria-label={`Free trial: ${trialTimeLabel}. Upgrade in billing.`}
          >
            <span className="flex size-6 shrink-0 items-center justify-center text-blaze-orange">
              <IconAlertTriangle className="size-4" stroke={2} />
            </span>
            <span className="min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="block text-[0.68rem] leading-4 font-semibold text-blaze-orange uppercase">
                Free trial
              </span>
              <span className="block text-xs leading-4 text-muted-foreground">
                {trialTimeLabel}
              </span>
            </span>
          </Link>
        ) : null}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/dashboard/settings"}
              tooltip="Settings"
            >
              <Link href="/dashboard/settings">
                <IconSettings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
