import Link from "next/link"
import { FREE_TRIAL_DAYS } from "@/consts/billing"

export default function ExpiredTrialPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16">
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <div
          className="h-[420px] w-[520px] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at center, var(--blaze-orange) 0%, var(--pumpkin-spice) 40%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* badge */}
        <div className="mb-6 flex justify-center">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
            style={{
              borderColor: "color-mix(in oklch, var(--blaze-orange) 40%, transparent)",
              color: "var(--pumpkin-spice)",
              background: "color-mix(in oklch, var(--blaze-orange) 8%, transparent)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--blaze-orange)" }} />
            Free trial ended
          </span>
        </div>

        {/* heading */}
        <h1 className="text-center font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Your {FREE_TRIAL_DAYS} days are up.
          <br />
          <span
            style={{
              background:
                "linear-gradient(90deg, var(--crimson-carrot), var(--amber-glow))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Keep the momentum.
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-md text-center text-base leading-relaxed text-muted-foreground">
          You&apos;ve seen what a daily queue of qualified backlink opportunities looks like.
          Upgrade to keep discovering sites worth pursuing — and start turning them into links.
        </p>

        {/* value bullets */}
        <ul className="mt-8 space-y-2.5">
          {[
            "Daily discovery runs across your niche",
            "Ranked opportunity queue with fit scores",
            "Outreach angles and ready-to-send drafts",
            "No manual Google digging required",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px]"
                style={{
                  background: "color-mix(in oklch, var(--blaze-orange) 15%, transparent)",
                  color: "var(--blaze-orange)",
                }}
                aria-hidden
              >
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            href="/pricing"
            className="inline-flex w-full items-center justify-center rounded-xl px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:opacity-90 hover:shadow-xl active:scale-[0.98] sm:w-auto sm:min-w-56"
            style={{
              background:
                "linear-gradient(135deg, var(--crimson-carrot) 0%, var(--pumpkin-spice) 100%)",
              boxShadow:
                "0 4px 24px color-mix(in oklch, var(--blaze-orange) 35%, transparent)",
            }}
          >
            See pricing plans
          </Link>
          <p className="text-xs text-muted-foreground">
            Starts at $49 / month · Cancel anytime
          </p>
        </div>
      </div>
    </main>
  )
}
