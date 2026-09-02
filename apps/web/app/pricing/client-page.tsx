"use client"

import {
  IconArrowRight,
  IconCheck,
  IconInfoCircle,
  IconLoader2,
  IconSparkles,
} from "@tabler/icons-react"
import Link from "next/link"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { useEffect, useTransition, useState } from "react"
import type { BillingTier, Plan } from "@/consts/billing"
import {
  PLANS,
  WARMUP_FEATURE_INFO,
  WARMUP_FEATURE_LABEL,
} from "@/consts/billing"
import { captureEvent } from "@/lib/analytics"
import { stripeBuyPlanRedirect } from "@/actions/stripe-buy-plan-redirect"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

type PlanStatus = "current" | "upgrade" | "buy" | "unauthenticated"

function getPlanStatus(
  plan: Plan,
  userTier: BillingTier | null,
  isLoggedIn: boolean
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
    <div className="bg-background">
      <div className="mx-auto max-w-6xl px-4 pt-20 pb-24 sm:px-6 lg:px-8 lg:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-blaze-orange)]/20 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-xs font-bold text-[var(--color-blaze-orange)] uppercase">
            <IconSparkles className="h-3.5 w-3.5" />
            Preview first, then 7 days free
          </span>
          <h1 className="mt-5 font-heading text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-[56px]">
            Start with the plan that gets your{" "}
            <span className="bg-gradient-to-r from-[var(--color-blaze-orange-2)] via-[var(--color-harvest-orange)] to-[var(--color-amber-flame)] bg-clip-text text-transparent">
              backlink pipeline moving.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Two simple plans for backlink outreach autopilot. We discover
            opportunities and run outreach automatically through the first reply
            — you monitor the queue and cancel anything that isn&apos;t a fit.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl overflow-hidden rounded-[2rem] border border-border bg-card lg:grid-cols-2">
          {PLANS.map((plan, planIndex) => {
            const status = getPlanStatus(plan, userTier, isLoggedIn)
            const isCurrent = status === "current"
            const isFeatured = plan.popular
            const previousPlan = planIndex > 0 ? PLANS[planIndex - 1] : null

            return (
              <article
                key={plan.key}
                className={`flex flex-col gap-8 p-8 sm:p-11 ${
                  planIndex === 0
                    ? "border-b border-border lg:border-r lg:border-b-0"
                    : "bg-muted/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[0.7rem] font-bold text-[var(--color-blaze-orange)] uppercase">
                      {plan.name}
                    </p>
                    {isCurrent ? (
                      <span className="rounded-full border border-border bg-card px-3 py-1 text-[0.65rem] font-semibold text-muted-foreground uppercase">
                        Current plan
                      </span>
                    ) : isFeatured ? (
                      <span className="rounded-full bg-muted px-3 py-1 text-[0.65rem] font-semibold text-muted-foreground uppercase">
                        Most popular
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 text-sm font-medium text-muted-foreground line-through">
                    ${plan.originalPrice}/month
                  </p>
                  <h2 className="mt-1 font-heading text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
                    ${plan.price}
                    <span className="ml-1 text-base font-medium tracking-normal text-muted-foreground">
                      /month
                    </span>
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                <div className="flex-1">
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
                        <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-blaze-orange)]" />
                        <span className="inline-flex items-center gap-1.5">
                          {feature}
                          {feature === WARMUP_FEATURE_LABEL && (
                            <TooltipProvider delayDuration={80}>
                              <Tooltip>
                                <TooltipTrigger
                                  className="text-muted-foreground hover:text-foreground"
                                  aria-label={`About ${WARMUP_FEATURE_LABEL}`}
                                >
                                  <IconInfoCircle className="h-3.5 w-3.5" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-64">
                                  {WARMUP_FEATURE_INFO}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <PlanCta status={status} plan={plan} featured={isFeatured} />
              </article>
            )
          })}
        </div>
        <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-muted-foreground">
          No card required to see your personalized opportunities. A card is
          required only when you choose to start automated outreach. $0 today;
          after the 7-day trial, the selected plan renews at the monthly price
          shown unless cancelled from Billing.
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

  const baseClass = `group flex w-full items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98]`
  const featuredClass = `bg-[var(--color-blaze-orange)] text-white shadow-[0_16px_38px_-20px_rgba(255,84,0,0.95)] hover:bg-[var(--color-blaze-orange-2)]`
  const defaultClass = `border border-border bg-background text-foreground hover:border-[var(--color-blaze-orange)]/30 hover:text-[var(--color-blaze-orange)]`

  if (status === "current") {
    return (
      <div className="flex w-full items-center justify-center rounded-full border border-border bg-muted/50 py-3.5 text-sm font-semibold text-muted-foreground">
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
        See my opportunities
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

  const label =
    status === "upgrade" ? `Upgrade to ${plan.name}` : `Get ${plan.name}`

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
      {error && <p className="text-center text-xs text-destructive">{error}</p>}
    </div>
  )
}
