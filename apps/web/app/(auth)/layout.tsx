import { supabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
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
