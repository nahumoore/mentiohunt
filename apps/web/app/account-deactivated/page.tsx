import { IconMail, IconShieldLock } from "@tabler/icons-react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { supabaseServer } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Account Deactivated",
  description: "Your Mentiohunt account has been deactivated.",
  robots: { index: false, follow: false },
}

export default async function AccountDeactivatedPage() {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("deactivated_at")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile?.deactivated_at) {
    redirect("/dashboard")
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute top-1/4 left-1/2 h-[480px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground/5 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 font-ui text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <IconShieldLock size={14} />
            Account deactivated
          </span>
        </div>

        <div className="text-center">
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
            Your account is deactivated.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Thank you for giving Mentiohunt a try. Outreach, discovery and all
            the features are not active anymore for your account.
          </p>
        </div>

        <div className="my-9 h-px w-full bg-border" />

        <div className="rounded-3xl border border-border/70 bg-white p-6 text-center shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
          <p className="text-sm font-medium text-foreground">
            To reactivate, email support.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Reactivating isn&apos;t self-serve — send us a note from this
            account&apos;s email and we&apos;ll turn it back on for you.
          </p>
          <a
            href="mailto:support@mentiohunt.com"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 font-ui text-sm font-semibold text-background transition-all duration-150 ease-out hover:bg-foreground/90 active:scale-[0.98]"
          >
            <IconMail size={16} />
            support@mentiohunt.com
          </a>
        </div>
      </div>
    </main>
  )
}
