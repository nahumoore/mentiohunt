import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardStoreHydrator } from "@/components/dashboard-store-hydrator"
import { supabaseServer } from "@/lib/supabase/server"
import type { Tables } from "@workspace/supabase/database-types"
import { redirect } from "next/navigation"
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  const [profileResult, productResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, name, onboarding_completed, tier, active_trial")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const profile = profileResult.data
  const product = productResult.data

  if (!profile?.onboarding_completed) {
    redirect("/onboarding")
  }

  const billingProfile = profile as Pick<
    Tables<"profiles">,
    "onboarding_completed" | "tier" | "active_trial"
  > | null

  if (
    billingProfile?.tier === "free" &&
    billingProfile.active_trial === false
  ) {
    redirect("/expired-trial")
  }

  const sidebarUser = {
    name: (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "User",
    email: user.email ?? "",
    avatar: (user.user_metadata?.avatar_url as string | undefined) ?? "",
  }

  return (
    <DashboardStoreHydrator profile={profile} product={product}>
      <SidebarProvider>
        <AppSidebar user={sidebarUser} initialProduct={product} />
        <SidebarInset>
          <DashboardHeader />
          <div className="p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </DashboardStoreHydrator>
  )
}
