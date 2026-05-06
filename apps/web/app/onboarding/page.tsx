import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import { supabaseServer } from "@workspace/supabase/server"
import { redirect } from "next/navigation"

export default async function OnboardingPage() {
  const supabase = await supabaseServer()
  const { data: claimsData, error } = await supabase.auth.getClaims()

  if (error || !claimsData) {
    redirect("/")
  }

  return (
    <main className="min-h-screen bg-background">
      <OnboardingWizard />
    </main>
  )
}
