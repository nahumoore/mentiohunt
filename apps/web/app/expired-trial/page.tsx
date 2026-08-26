import type { Metadata } from "next"
import Link from "next/link"
import { IconCheck, IconArrowRight } from "@tabler/icons-react"
import { TestimonialExtensionCard } from "@/components/expired-trial/testimonial-extension-card"
import { FREE_TRIAL_DAYS } from "@/consts/billing"

export const metadata: Metadata = {
  title: "Trial Expired",
  description: "Your Mentiohunt free trial has ended. Upgrade to keep your outreach running.",
  robots: { index: false, follow: false },
}

const VALUE_BULLETS = [
  "Daily discovery runs across your niche",
  "Ranked opportunity queue with fit scores",
  "Outreach angles and ready-to-send drafts",
  "No manual Google digging required",
]

export default function ExpiredTrialPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16">
      {/* ambient blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-1/4 h-[480px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-princeton-orange/7 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-[300px] w-[400px] rounded-full bg-blaze-orange/5 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* status badge */}
        <div className="mb-8 flex justify-center">
          <span className="font-ui inline-flex items-center gap-2 rounded-full border border-(--color-blaze-orange)/30 bg-(--color-blaze-orange)/8 px-3 py-1 text-xs font-semibold text-(--color-pumpkin-spice) uppercase tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-(--color-blaze-orange)" />
            Free trial ended
          </span>
        </div>

        {/* heading */}
        <div className="text-center">
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
            Your {FREE_TRIAL_DAYS} days are up.
          </h1>
          <h2 className="font-heading mt-2 text-4xl font-semibold tracking-tight text-balance text-(--color-blaze-orange) sm:text-5xl">
            Keep the momentum.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            You&apos;ve seen what a daily queue of qualified backlink opportunities looks
            like. Upgrade to keep discovering sites worth pursuing — and start turning
            them into links.
          </p>
        </div>

        {/* value bullets */}
        <ul className="mt-9 space-y-3">
          {VALUE_BULLETS.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-foreground/80">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--color-blaze-orange)/10">
                <IconCheck size={12} stroke={2.5} className="text-(--color-blaze-orange)" />
              </span>
              {item}
            </li>
          ))}
        </ul>

        {/* reassurance */}
        <p className="mt-6 text-center text-sm leading-relaxed text-muted-foreground">
          Your opportunity queue, contacts, drafts, and prospect replies are
          all saved — and replies keep being collected. Upgrading picks up
          exactly where you left off.
        </p>

        {/* divider */}
        <div className="my-9 h-px w-full bg-border" />

        {/* testimonial extension offer */}
        <TestimonialExtensionCard />

        {/* divider */}
        <div className="my-9 h-px w-full bg-border" />

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/pricing"
            className="font-ui inline-flex w-full items-center justify-center gap-2 rounded-full bg-(--color-blaze-orange) px-8 py-3.5 text-sm font-semibold text-white transition-all duration-150 ease-out hover:bg-(--color-crimson-carrot) active:scale-[0.98] sm:w-auto sm:min-w-56"
          >
            See pricing plans
            <IconArrowRight size={16} />
          </Link>
          <p className="font-ui text-xs text-muted-foreground">
            Starts at $49 / month · Cancel anytime
          </p>
        </div>
      </div>
    </main>
  )
}
