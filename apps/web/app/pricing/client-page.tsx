"use client"

import Link from "next/link"
import type { BillingTier } from "@/consts/billing"
import { FREE_TRIAL_DAYS, PLAN_TIERS } from "@/consts/billing"

const plans = [
  {
    key: "starter" as const,
    name: "Starter",
    price: "49",
    description: "For individual founders building their backlink queue.",
    features: [
      "1 website",
      "Up to 10 competitors",
      "Daily discovery runs",
      "Ranked opportunity queue",
      "Fit scores & rationale",
      "Suggested outreach angles",
      `${FREE_TRIAL_DAYS}-day free trial`,
    ],
    popular: false,
  },
  {
    key: "pro" as const,
    name: "Pro",
    price: "99",
    description: "For teams and agencies managing multiple sites.",
    features: [
      "Up to 5 websites",
      "Unlimited competitors per site",
      "Daily discovery runs",
      "Ranked opportunity queue",
      "Fit scores & rationale",
      "Suggested outreach angles",
      "Export to CSV",
      "Priority support",
      `${FREE_TRIAL_DAYS}-day free trial`,
    ],
    popular: true,
  },
]

type PlanKey = (typeof plans)[number]["key"]

function getPlanStatus(
  planKey: PlanKey,
  userTier: BillingTier | null,
): "current" | "upgrade" | "unauthenticated" {
  if (!userTier || userTier === "free") return "unauthenticated"
  if (PLAN_TIERS[planKey] === userTier) return "current"
  // agency tier on starter card = downgrade, show nothing special → treat as upgrade prompt
  return "upgrade"
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden
      style={{ color: "var(--blaze-orange)" }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

export function PricingClientPage({
  userTier,
}: {
  userTier: BillingTier | null
}) {
  return (
    <div className="relative overflow-hidden bg-background">
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
        aria-hidden
      >
        <div
          className="h-[480px] w-[700px] rounded-full opacity-10 blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at center, var(--blaze-orange) 0%, var(--pumpkin-spice) 40%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        {/* header */}
        <div className="mx-auto max-w-2xl text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
            style={{
              borderColor:
                "color-mix(in oklch, var(--blaze-orange) 40%, transparent)",
              color: "var(--pumpkin-spice)",
              background:
                "color-mix(in oklch, var(--blaze-orange) 8%, transparent)",
            }}
          >
            Simple pricing
          </span>
          <h1 className="mt-5 font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[52px]">
            One tool. One daily queue.
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
              No agency required.
            </span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Discover qualified backlink opportunities every day. Upgrade when
            you&apos;re ready — cancel anytime.
          </p>
        </div>

        {/* cards */}
        <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {plans.map((plan) => {
            const status = getPlanStatus(plan.key, userTier)
            const isCurrent = status === "current"

            return (
              <div
                key={plan.key}
                className="relative rounded-2xl border p-8 transition-shadow"
                style={
                  plan.popular
                    ? {
                        background:
                          "linear-gradient(145deg, color-mix(in oklch, var(--blaze-orange) 12%, var(--card)) 0%, var(--card) 60%)",
                        borderColor:
                          "color-mix(in oklch, var(--blaze-orange) 35%, transparent)",
                        boxShadow:
                          "0 8px 32px color-mix(in oklch, var(--blaze-orange) 12%, transparent)",
                      }
                    : undefined
                }
              >
                {/* Popular badge */}
                {plan.popular && !isCurrent && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold text-white"
                    style={{
                      background:
                        "linear-gradient(90deg, var(--crimson-carrot), var(--pumpkin-spice))",
                    }}
                  >
                    Most Popular
                  </div>
                )}

                {/* Current plan badge */}
                {isCurrent && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                    Current plan
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {plan.name}
                    </p>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="font-heading text-5xl font-semibold tracking-tight text-foreground">
                        ${plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /month
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {plan.description}
                </p>

                <ul className="mt-7 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 text-sm text-foreground"
                    >
                      <CheckIcon className="size-4 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <PlanCta status={status} planName={plan.name} />
                </div>
              </div>
            )
          })}
        </div>

        {/* footnote */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Both plans include a {FREE_TRIAL_DAYS}-day free trial. No credit card required to
          start.
        </p>
      </div>
    </div>
  )
}

function PlanCta({
  status,
  planName,
}: {
  status: "current" | "upgrade" | "unauthenticated"
  planName: string
}) {
  if (status === "current") {
    return (
      <div className="flex w-full items-center justify-center rounded-xl border bg-muted/50 py-3 text-sm font-medium text-muted-foreground">
        Current plan
      </div>
    )
  }

  if (status === "upgrade") {
    return (
      <Link
        href="/dashboard/billing"
        className="flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
        style={{
          background:
            "linear-gradient(135deg, var(--crimson-carrot) 0%, var(--pumpkin-spice) 100%)",
          boxShadow:
            "0 4px 20px color-mix(in oklch, var(--blaze-orange) 30%, transparent)",
        }}
      >
        Upgrade to {planName}
      </Link>
    )
  }

  return (
    <Link
      href="/signup"
      className="flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
      style={{
        background:
          "linear-gradient(135deg, var(--crimson-carrot) 0%, var(--pumpkin-spice) 100%)",
        boxShadow:
          "0 4px 20px color-mix(in oklch, var(--blaze-orange) 30%, transparent)",
      }}
    >
      Start free trial
    </Link>
  )
}
