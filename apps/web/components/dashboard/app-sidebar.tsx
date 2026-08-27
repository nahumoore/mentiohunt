"use client"

import { IconAlertTriangle, IconSettings } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { IconBrandMentiohunt } from "@/components/custom-icons/brand-mentiohunt"
import { NavMain } from "@/components/dashboard/nav-main"
import { NavUser } from "@/components/dashboard/nav-user"
import { getTrialDaysRemaining, isOnTrial } from "@/lib/billing/trial"
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

function getProductHostname(websiteUrl: string | null | undefined) {
  if (!websiteUrl) return null
  try {
    return new URL(websiteUrl).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
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
  const activeProduct = product ?? initialProduct
  const productName = getProductDisplayName(activeProduct)
  const productHostname = getProductHostname(activeProduct?.website_url)
  const isTrialProfileLoading = profile === null
  const isFreeTrial = isOnTrial(profile)
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
            {productHostname ? (
              <p className="flex items-center gap-1 truncate text-xs leading-4 text-muted-foreground">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${productHostname}&sz=32`}
                  alt=""
                  width={12}
                  height={12}
                  className="size-3 shrink-0 rounded-[2px]"
                />
                <span className="truncate">{productHostname}</span>
              </p>
            ) : (
              <p className="truncate text-xs leading-4 text-muted-foreground">
                {user.email}
              </p>
            )}
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
            href="/dashboard/settings?tab=billing"
            className="group/trial mx-1 flex items-center gap-2.5 rounded-xl border border-blaze-orange/20 bg-blaze-orange/5 p-2.5 transition-colors hover:border-blaze-orange/35 hover:bg-blaze-orange/8 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
            aria-label={`Trial: ${trialTimeLabel}. Manage in billing.`}
          >
            <span className="flex size-6 shrink-0 items-center justify-center text-blaze-orange">
              <IconAlertTriangle className="size-4" stroke={2} />
            </span>
            <span className="min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="block text-[0.68rem] leading-4 font-semibold text-blaze-orange uppercase">
                Trial
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
