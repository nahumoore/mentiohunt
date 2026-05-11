import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardStoreHydrator } from "@/components/dashboard-store-hydrator"
import { supabaseServer } from "@/lib/supabase/server"
import type { ProspectListItem } from "@/stores/prospect-store"
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
      .select(
        "id, user_id, website_url, product_name, product_description, competitors, created_at, updated_at"
      )
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

  let prospects: ProspectListItem[] = []

  if (product) {
    const { data: prospectRows, error: prospectsError } = await supabase
      .from("backlink_prospects")
      .select(
        "id, product_id, domain, target_url, tier, action_type, status, discovered_at"
      )
      .eq("product_id", product.id)
      .order("discovered_at", { ascending: false })

    if (prospectsError) {
      console.error("Error fetching backlink prospects:", prospectsError)
    }

    prospects = prospectRows ?? []
  }

  const sidebarUser = {
    name: (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "User",
    email: user.email ?? "",
    avatar: (user.user_metadata?.avatar_url as string | undefined) ?? "",
  }

  return (
    <DashboardStoreHydrator
      profile={profile}
      product={product}
      prospects={prospects}
    >
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
