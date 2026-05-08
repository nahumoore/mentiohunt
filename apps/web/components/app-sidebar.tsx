"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { IconBrandReddinbox } from "@/components/custom-icons/brand-reddinbox"
import {
  type DashboardProduct,
  getProductDisplayName,
  useProductStore,
} from "@/stores/product-store"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@workspace/ui/components/sidebar"

export function AppSidebar({
  user,
  initialProduct,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; avatar: string }
  initialProduct: DashboardProduct | null
}) {
  const product = useProductStore((state) => state.product)
  const productName = getProductDisplayName(product ?? initialProduct)

  return (
    <Sidebar collapsible="icon" className="shadow-[4px_0_24px_0_rgba(0,0,0,0.06)]" {...props}>
      <SidebarHeader className="p-2 pb-3">
        <Link
          href="/"
          className="group/header relative block overflow-hidden rounded-2xl border border-sidebar-border/80 bg-gradient-to-br from-sidebar via-sidebar to-amber-glow/10 p-2 shadow-[0_18px_42px_rgba(255,84,0,0.08)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-blaze-orange/35 hover:shadow-[0_22px_46px_rgba(255,84,0,0.14)] focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-none group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:hover:translate-y-0"
          aria-label="Go to Mentiohunt home"
        >
          <div className="pointer-events-none absolute -top-12 -right-10 size-28 rounded-full bg-blaze-orange/10 blur-2xl transition-all duration-500 ease-out group-hover/header:scale-125 group-hover/header:bg-blaze-orange/18 group-data-[collapsible=icon]:hidden" />
          <div className="pointer-events-none absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-flame/0 to-transparent transition-colors duration-300 group-hover/header:via-amber-flame/60 group-data-[collapsible=icon]:hidden" />
          <div className="relative flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-crimson-carrot via-pumpkin-spice to-amber-flame text-white shadow-[0_10px_24px_rgba(255,84,0,0.26)] ring-1 ring-white/35 transition-all duration-300 ease-out group-hover/header:rotate-3 group-hover/header:scale-105 group-hover/header:shadow-[0_14px_30px_rgba(255,84,0,0.34)] group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-lg">
              <IconBrandReddinbox className="size-5" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="font-heading truncate text-sm leading-5 font-semibold tracking-tight transition-transform duration-300 ease-out group-hover/header:translate-x-0.5">
                <span className="text-sidebar-foreground">Mentio</span>
                <span className="bg-gradient-to-r from-blaze-orange-2 via-harvest-orange to-amber-flame bg-clip-text text-transparent">
                  hunt
                </span>
              </p>
              <p className="truncate text-xs leading-4 font-medium text-sidebar-foreground/55 transition-colors duration-300 group-hover/header:text-sidebar-foreground/75">
                {productName}
              </p>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
