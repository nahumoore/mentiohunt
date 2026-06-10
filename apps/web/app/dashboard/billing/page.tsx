"use client"

import { useState, useTransition } from "react"
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconCircleCheck,
  IconCrown,
  IconExternalLink,
  IconLoader2,
} from "@tabler/icons-react"

import { stripeBuyPlanRedirect } from "@/actions/stripe-buy-plan-redirect"
import { stripeCustomerPortalRedirect } from "@/actions/stripe-customer-portal-redirect"
import { FREE_TRIAL_DAYS, PLANS } from "@/consts/billing"
import { useProfileStore } from "@/stores/profile-store"

const DAY_IN_MS = 24 * 60 * 60 * 1000

function getDaysRemaining(periodEndAt: string): number {
  const t = new Date(periodEndAt).getTime()
  if (Number.isNaN(t)) return 0
  return Math.max(0, Math.ceil((t - Date.now()) / DAY_IN_MS))
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export default function BillingPage() {
  const profile = useProfileStore((state) => state.profile)
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const currentPlan = PLANS.find((p) => p.tier === profile?.tier) ?? null
  const isFreeTrial = profile?.tier === "free" && profile.active_trial === true
  const daysRemaining =
    isFreeTrial && profile?.billing_period_end_at
      ? getDaysRemaining(profile.billing_period_end_at)
      : null
  const currentPlanIndex = PLANS.findIndex((p) => p.tier === profile?.tier)

  function handleSelectPlan(planKey: "pro" | "agency") {
    setPendingAction(planKey)
    startTransition(async () => {
      await stripeBuyPlanRedirect({ plan: planKey })
    })
  }

  function handleManageSubscription() {
    setPendingAction("portal")
    startTransition(async () => {
      await stripeCustomerPortalRedirect()
    })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Billing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and plan.
        </p>
      </div>

      {currentPlan && !isFreeTrial && (
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blaze-orange/10 text-blaze-orange">
            <IconCrown className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {currentPlan.name} plan — ${currentPlan.price}/month
            </p>
            {profile?.billing_period_end_at && (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <IconCalendar className="size-3.5 shrink-0" />
                Renews {formatDate(profile.billing_period_end_at)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[0.65rem] font-semibold text-emerald-600 dark:text-emerald-400">
              Active
            </span>
            <button
              type="button"
              disabled={isPending}
              onClick={handleManageSubscription}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-blaze-orange/30 hover:text-blaze-orange disabled:opacity-50"
            >
              {pendingAction === "portal" ? (
                <IconLoader2 className="size-3.5 animate-spin" />
              ) : (
                <IconExternalLink className="size-3.5" />
              )}
              Manage subscription
            </button>
          </div>
        </div>
      )}

      {isFreeTrial && (
        <div className="relative overflow-hidden rounded-2xl border border-blaze-orange/25 bg-gradient-to-br from-blaze-orange/10 via-card to-amber-flame/6 p-5 shadow-[0_8px_28px_-16px_rgba(255,84,0,0.2)]">
          <div className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full bg-blaze-orange/8 blur-3xl" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3 sm:items-center">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blaze-orange/12 text-blaze-orange">
                <IconAlertTriangle className="size-4.5" stroke={2} />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {daysRemaining === 0
                    ? "Your free trial ends today"
                    : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left on your free trial`}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Pick a plan below to keep your discovery queue running.
                </p>
              </div>
            </div>
            {profile?.billing_period_end_at && (
              <div className="ml-12 flex items-center gap-1.5 text-xs text-muted-foreground sm:ml-auto sm:shrink-0">
                <IconCalendar className="size-3.5 shrink-0" />
                Trial ends {formatDate(profile.billing_period_end_at)}
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <p className="mb-5 text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
          Available plans
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          {PLANS.map((plan, planIndex) => {
            const isCurrent = plan.tier === profile?.tier
            const isFeatured = plan.popular
            const isUpgrade =
              !isCurrent &&
              (currentPlanIndex === -1 || planIndex > currentPlanIndex)
            const ctaLabel = isUpgrade
              ? `Upgrade to ${plan.name}`
              : `Switch to ${plan.name}`
            const isThisPending = isPending && pendingAction === plan.key

            return (
              <article
                key={plan.key}
                className={`relative flex flex-col overflow-hidden rounded-[1.5rem] border p-6 transition duration-300 hover:-translate-y-0.5 ${
                  isCurrent
                    ? "border-border bg-card shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)]"
                    : isFeatured
                      ? "border-blaze-orange/30 bg-gradient-to-br from-blaze-orange/9 via-card to-amber-flame/6 shadow-[0_16px_56px_-32px_rgba(255,84,0,0.45)]"
                      : "border-border bg-card shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)]"
                }`}
              >
                {isCurrent && (
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/70 to-emerald-400/30" />
                )}
                {!isCurrent && isFeatured && (
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-crimson-carrot via-blaze-orange to-amber-flame" />
                )}

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-bold text-(--color-blaze-orange) uppercase">
                      {plan.name}
                    </p>
                    <h2 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-foreground">
                      ${plan.price}
                      <span className="ml-1 text-sm font-medium tracking-normal text-muted-foreground">
                        /month
                      </span>
                    </h2>
                  </div>
                  {isCurrent ? (
                    <span className="mt-0.5 shrink-0 rounded-full border border-border bg-muted px-2.5 py-1 text-[0.65rem] font-semibold text-muted-foreground">
                      Current
                    </span>
                  ) : isFeatured ? (
                    <span className="mt-0.5 shrink-0 rounded-full bg-blaze-orange px-2.5 py-1 text-[0.65rem] font-bold text-white shadow-[0_6px_16px_-8px_rgba(255,84,0,0.8)]">
                      Popular
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {plan.description}
                </p>

                <div className="my-5 h-px bg-gradient-to-r from-border via-border to-transparent" />

                <ul className="flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm leading-5"
                    >
                      <IconCircleCheck className="mt-0.5 size-4 shrink-0 text-(--color-blaze-orange)" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {isCurrent ? (
                    <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/60 py-3 text-sm font-semibold text-muted-foreground">
                      <IconCheck className="size-4" />
                      Current plan
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        handleSelectPlan(plan.key as "pro" | "agency")
                      }
                      className={`group flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 ${
                        isFeatured
                          ? "bg-blaze-orange text-white shadow-[0_10px_28px_-14px_rgba(255,84,0,0.75)] hover:bg-[var(--color-blaze-orange-2)]"
                          : "border border-border bg-background text-foreground hover:border-blaze-orange/30 hover:text-blaze-orange"
                      }`}
                    >
                      {isThisPending ? (
                        <IconLoader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          {ctaLabel}
                          <IconArrowRight className="size-4 transition duration-200 group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Both plans include a {FREE_TRIAL_DAYS}-day free trial · No credit card
          required to start
        </p>
      </div>
    </div>
  )
}
