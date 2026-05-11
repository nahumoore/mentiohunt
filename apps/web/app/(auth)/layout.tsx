import { supabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AuthComingSoon } from "./coming-soon/coming-soon"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (process.env.NODE_END !== "dev") {
    return <AuthComingSoon />
  }

  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // If MFA is still required, let the user stay to complete the challenge
    const { data: aalData } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (
      aalData?.nextLevel === "aal2" &&
      aalData.nextLevel !== aalData.currentLevel
    ) {
      return <div>{children}</div>
    }

    return redirect("/dashboard")
  }

  return <div>{children}</div>
}
