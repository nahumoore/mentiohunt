import type { Metadata } from "next"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"

export const metadata: Metadata = {
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
    .select("name")
    .eq("id", userData.user.id)
    .single()

  const params = await searchParams
  const emailConfirmed = params.confirmed === "email"

  return (
    <main className="min-h-screen bg-background">
      <OnboardingWizard userName={profile?.name ?? null} emailConfirmed={emailConfirmed} />
    </main>
  )
}
