import type { Metadata } from "next"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"

export const metadata: Metadata = {
  title: "Onboarding",
  description:
    "Set up your product and target pages to start discovering backlink opportunities.",
  robots: { index: false, follow: false },
}
import { supabaseServer } from "@workspace/supabase/server"
import { redirect } from "next/navigation"

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmed?: string }>
}) {
  const supabase = await supabaseServer()
  const { data: userData, error } = await supabase.auth.getUser()

  if (error || !userData.user) {
    redirect("/")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, onboarding_completed")
    .eq("id", userData.user.id)
    .single()

  if (profile?.onboarding_completed) redirect("/dashboard")

  const { data: preview } = await supabase
    .from("onboarding_previews")
    .select("id")
    .eq("user_id", userData.user.id)
    .limit(1)
    .maybeSingle()

  if (preview) redirect("/onboarding/preview")

  const params = await searchParams
  const emailConfirmed = params.confirmed === "email"

  return (
    <main className="min-h-screen bg-background">
      <OnboardingWizard
        userName={profile?.name ?? null}
        emailConfirmed={emailConfirmed}
      />
    </main>
  )
}
