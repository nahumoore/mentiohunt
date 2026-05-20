"use client"

import {
  IconCreditCard,
  IconLoader2,
  IconLogout,
  IconSelector,
  IconSparkles,
} from "@tabler/icons-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { stripeCustomerPortalRedirect } from "@/actions/stripe-customer-portal-redirect"
import { supabaseClient } from "@/lib/supabase/client"
import { useProfileStore } from "@/stores/profile-store"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const profile = useProfileStore((state) => state.profile)
  const [isPortalPending, startPortalTransition] = useTransition()
  const router = useRouter()

  const isFreeTrial = !profile || profile.tier === "free"

  async function handleLogout() {
    const supabase = supabaseClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  function handleBillingPortal() {
    startPortalTransition(async () => {
      await stripeCustomerPortalRedirect()
    })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <IconSelector className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isFreeTrial && (
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/billing">
                    <IconSparkles />
                    Upgrade plan
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            )}
            {isFreeTrial && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={isPortalPending}
                onClick={isFreeTrial ? undefined : handleBillingPortal}
                asChild={isFreeTrial}
              >
                {isFreeTrial ? (
                  <Link href="/dashboard/billing">
                    <IconCreditCard />
                    Billing
                  </Link>
                ) : (
                  <>
                    {isPortalPending ? (
                      <IconLoader2 className="animate-spin" />
                    ) : (
                      <IconCreditCard />
                    )}
                    Billing
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
