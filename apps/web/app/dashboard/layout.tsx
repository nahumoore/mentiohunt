import { supabaseServer } from "@/lib/supabase/server"
import type { Tables } from "@workspace/supabase/database-types"
import { redirect } from "next/navigation"

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, tier, active_trial")
    .eq("id", user.id)
    .maybeSingle()

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

  return children
}
