"use client"

import {
  IconArrowRight,
  IconCircleCheck,
  IconLoader2,
  IconSparkles,
} from "@tabler/icons-react"
import Link from "next/link"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { useEffect, useTransition, useState } from "react"
import type { BillingTier, Plan } from "@/consts/billing"
import { FREE_TRIAL_DAYS, PLANS } from "@/consts/billing"
import { captureEvent } from "@/lib/analytics"
import { stripeBuyPlanRedirect } from "@/actions/stripe-buy-plan-redirect"

type PlanStatus = "current" | "upgrade" | "buy" | "unauthenticated"

function getPlanStatus(
  plan: Plan,
  userTier: BillingTier | null,
  isLoggedIn: boolean,
): PlanStatus {
  if (!isLoggedIn) return "unauthenticated"
  if (!userTier || userTier === "free") return "buy"
  if (plan.tier === userTier) return "current"
  return "upgrade"
}

export function PricingClientPage({
  userTier,
  isLoggedIn,
}: {
  userTier: BillingTier | null
  isLoggedIn: boolean
}) {
  useEffect(() => {
    captureEvent("pricing_page_viewed")
  }, [])

  return (
    <div className="relative overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-x-0 top-0 mx-auto h-[34rem] w-[52rem] rounded-full bg-[var(--color-princeton-orange)]/10 blur-[120px]" />
        <div className="absolute right-0 bottom-20 h-[26rem] w-[26rem] translate-x-1/3 rounded-full bg-[var(--color-amber-flame)]/8 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-20 pb-24 sm:px-6 lg:px-8 lg:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-blaze-orange)]/20 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-xs font-bold text-[var(--color-blaze-orange)] uppercase">
            <IconSparkles className="h-3.5 w-3.5" />
            7-day free trial
          </span>
          <h1 className="mt-5 font-heading text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-[56px]">
            Start with the plan that gets your{" "}
            <span className="bg-gradient-to-r from-[var(--color-blaze-orange-2)] via-[var(--color-harvest-orange)] to-[var(--color-amber-flame)] bg-clip-text text-transparent">
              backlink pipeline moving.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Two simple plans for managed backlink placement. We handle
            discovery and outreach — you approve what goes live.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-7">
          {PLANS.map((plan, planIndex) => {
            const status = getPlanStatus(plan, userTier, isLoggedIn)
            const isCurrent = status === "current"
            const isFeatured = plan.popular
            const previousPlan = planIndex > 0 ? PLANS[planIndex - 1] : null

            return (
              <article
                key={plan.key}
                className={`relative flex min-h-full flex-col overflow-hidden rounded-[2rem] border p-6 shadow-[0_18px_70px_-48px_rgba(0,0,0,0.55)] transition duration-300 hover:-translate-y-1 sm:p-8 ${
                  isFeatured
                    ? "border-[var(--color-blaze-orange)]/35 bg-gradient-to-br from-[var(--color-blaze-orange)]/10 via-card to-[var(--color-amber-flame)]/8 shadow-[0_26px_90px_-54px_rgba(255,84,0,0.9)]"
                    : "border-border bg-card"
                }`}
              >
                {isFeatured && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--color-crimson-carrot)] via-[var(--color-blaze-orange)] to-[var(--color-amber-flame)]" />
                )}

                {isFeatured && !isCurrent && (
                  <div className="absolute top-5 right-5 rounded-full bg-[var(--color-blaze-orange)] px-3 py-1 text-xs font-bold text-white shadow-[0_12px_28px_-16px_rgba(255,84,0,0.95)]">
                    Most Popular
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute top-5 right-5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
                    Current plan
                  </div>
                )}

                <div className="flex-1">
                  <div className="max-w-[17rem]">
                    <p className="text-[0.7rem] font-bold text-[var(--color-blaze-orange)] uppercase">
                      {plan.name}
                    </p>
                    <h2 className="mt-4 font-heading text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
                      ${plan.price}
                      <span className="ml-1 text-base font-medium tracking-normal text-muted-foreground">
                        /month
                      </span>
                    </h2>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>

                  <div className="my-7 h-px bg-gradient-to-r from-border via-border to-transparent" />

                  {previousPlan && (
                    <p className="mb-3.5 text-sm font-semibold text-foreground">
                      Everything in {previousPlan.name}, plus:
                    </p>
                  )}

                  <ul className="space-y-3.5">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm leading-6 text-foreground"
                      >
                        <IconCircleCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[var(--color-blaze-orange)]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <PlanCta
                    status={status}
                    plan={plan}
                    featured={isFeatured}
                  />
                </div>
              </article>
            )
          })}
        </div>

        <p className="mt-8 text-center text-sm leading-6 text-muted-foreground">
          Both plans include a {FREE_TRIAL_DAYS}-day free trial. No credit card
          required to start.
        </p>
      </div>
    </div>
  )
}

function PlanCta({
  status,
  plan,
  featured,
}: {
  status: PlanStatus
  plan: Plan
  featured: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const baseClass = `group flex w-full items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98]`
  const featuredClass = `bg-[var(--color-blaze-orange)] text-white shadow-[0_16px_38px_-20px_rgba(255,84,0,0.95)] hover:bg-[var(--color-blaze-orange-2)]`
  const defaultClass = `border border-border bg-background text-foreground hover:border-[var(--color-blaze-orange)]/30 hover:text-[var(--color-blaze-orange)]`

  if (status === "current") {
    return (
      <div className="flex w-full items-center justify-center rounded-2xl border border-border bg-muted/50 py-3.5 text-sm font-semibold text-muted-foreground">
        Current plan
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <Link
        href="/signup"
        className={`${baseClass} ${featured ? featuredClass : defaultClass}`}
      >
        Start free trial
        <IconArrowRight className="ml-2 h-4 w-4 transition duration-200 group-hover:translate-x-1" />
      </Link>
    )
  }

  // "buy" (logged-in free/expired) or "upgrade" (switching plans) — both go to Stripe
  function handleCheckout() {
    setError(null)
    startTransition(async () => {
      try {
        await stripeBuyPlanRedirect({ plan: plan.key as "pro" | "agency" })
      } catch (err) {
        if (isRedirectError(err)) throw err
        setError("Something went wrong. Please try again.")
      }
    })
  }

  const label = status === "upgrade" ? `Upgrade to ${plan.name}` : `Get ${plan.name}`

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        onClick={handleCheckout}
        className={`${baseClass} ${featured ? featuredClass : defaultClass} disabled:opacity-60 disabled:active:scale-100`}
      >
        {isPending ? (
          <IconLoader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {label}
            <IconArrowRight className="ml-2 h-4 w-4 transition duration-200 group-hover:translate-x-1" />
          </>
        )}
      </button>
      {error && (
        <p className="text-center text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
