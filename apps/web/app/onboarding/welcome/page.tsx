import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { ReferralSourceForm } from "@/components/onboarding/referral-source-form"
import { supabaseServer } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Welcome",
  description: "Thanks for starting your Mentiohunt trial.",
  robots: { index: false, follow: false },
}

/** Mirrors what the onboarding pipeline is genuinely doing while this page is open. */
const BACKGROUND_WORK = [
  "Crawling your site",
  "Mining competitor backlinks",
  "Scoring prospects",
]

/**
 * Lands here right after checkout instead of the dashboard — see
 * app/onboarding/checkout-complete/route.ts. Asking "how did you find us"
 * on its own screen, once setup is already paid for and running, gets a
 * real answer instead of a lazy pick buried mid-wizard (the old
 * step-company.tsx). Existing accounts are never sent here; only new
 * signups land on this page, and only until they answer once.
 */
export default async function OnboardingWelcomePage() {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/signin")

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, referral_source")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile?.onboarding_completed) redirect("/onboarding")
  if (profile.referral_source) redirect("/dashboard/prospects")

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-24 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-princeton-orange/7 blur-[100px]" />
        <div className="absolute -bottom-32 right-[15%] h-[320px] w-[420px] rounded-full bg-blaze-orange/5 blur-[100px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-(--color-blaze-orange)/40 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-16">
        <div className="flex justify-center">
          <span className="font-ui inline-flex items-center gap-2 rounded-full border border-(--color-blaze-orange)/30 bg-(--color-blaze-orange)/8 px-3 py-1 text-[0.7rem] font-bold tracking-[0.18em] text-(--color-pumpkin-spice) uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-(--color-blaze-orange)" />
            You&apos;re in
          </span>
        </div>

        <div className="mt-6 text-center">
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
            Thanks for giving us a shot.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Your hunt is already running in the background. While that works,
            one question we actually care about.
          </p>
        </div>

        <ul className="font-ui mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          {BACKGROUND_WORK.map((label, index) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/70 px-3 py-1.5 backdrop-blur-sm"
            >
              <span
                className="h-1.5 w-1.5 animate-loading-dot rounded-full bg-(--color-blaze-orange)"
                style={{ animationDelay: `${index * 240}ms` }}
              />
              {label}
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-3xl border border-border/70 bg-white p-5 shadow-[0_2px_16px_-6px_rgba(0,0,0,0.10)] sm:p-7">
          <div className="mb-5">
            <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
              How did you find Mentiohunt?
            </h2>
            <div className="mt-2.5 h-px w-10 bg-blaze-orange/60" />
          </div>

          <ReferralSourceForm />
        </div>
      </div>
    </main>
  )
}
