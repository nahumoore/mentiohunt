"use client"

import {
  IconAlertTriangle,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconCrown,
  IconExternalLink,
  IconInfoCircle,
  IconLoader2,
} from "@tabler/icons-react"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { stripeBuyPlanRedirect } from "@/actions/stripe-buy-plan-redirect"
import { stripeCustomerPortalRedirect } from "@/actions/stripe-customer-portal-redirect"
import { stripeResumeSubscription } from "@/actions/stripe-resume-subscription"
import { stripeSwitchPlan } from "@/actions/stripe-switch-plan"
import {
  getSubscriptionState,
  type SubscriptionState,
} from "@/actions/stripe-subscription-state"
import { PLANS, WARMUP_FEATURE_INFO, WARMUP_FEATURE_LABEL } from "@/consts/billing"
import { formatBillingDate, getTrialDaysRemaining, isOnTrial } from "@/lib/billing/trial"
import { useProfileStore, type DashboardProfile } from "@/stores/profile-store"
import { CancelSubscriptionDialog } from "@/components/dashboard/settings/cancel-subscription-dialog"

export function BillingTab() {
  const profile = useProfileStore((state) => state.profile)
  const setProfile = useProfileStore((state) => state.setProfile)
  const [subscription, setSubscription] = useState<SubscriptionState | null | undefined>(
    undefined
  )
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  useEffect(() => {
    void getSubscriptionState().then(setSubscription)
  }, [])

  function refetchSubscription() {
    void getSubscriptionState().then(setSubscription)
  }

  function handleSelectPlan(planKey: "pro" | "agency") {
    // No Stripe subscription yet — this is the legacy no-card trial cohort,
    // so a fresh Checkout Session is the right call.
    setPendingAction(planKey)
    startTransition(async () => {
      await stripeBuyPlanRedirect({ plan: planKey })
    })
  }

  function handleSwitchPlan(planKey: "pro" | "agency") {
    setPendingAction(planKey)
    startTransition(async () => {
      const result = await stripeSwitchPlan({ plan: planKey })
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (profile && result.tier) setProfile({ ...profile, tier: result.tier })
      toast.success(`Switched to ${planKey === "pro" ? "Pro" : "Agency"}.`)
      refetchSubscription()
    })
  }

  function handleManageSubscription() {
    setPendingAction("portal")
    startTransition(async () => {
      await stripeCustomerPortalRedirect()
    })
  }

  function handleResume() {
    setPendingAction("resume")
    startTransition(async () => {
      const result = await stripeResumeSubscription()
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Subscription resumed.")
      refetchSubscription()
    })
  }

  const isLoading = subscription === undefined

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
          <div className="border-b border-border/70 px-6 py-5">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="mt-2.5 h-4 w-full max-w-md" />
          </div>
          <div className="px-6 py-5">
            <Skeleton className="h-9 w-56" />
          </div>
        </div>
      ) : subscription === null ? (
        <LegacyTrialView
          profile={profile}
          isPending={isPending}
          pendingAction={pendingAction}
          onSelectPlan={handleSelectPlan}
        />
      ) : (
        <>
          {subscription.cancelAtPeriodEnd ? (
            <div className="flex flex-col gap-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                  <IconAlertTriangle className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Your subscription ends {formatBillingDate(subscription.currentPeriodEnd)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    You keep full access until then — resume anytime before it ends.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={handleResume}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-blaze-orange/30 hover:text-blaze-orange disabled:opacity-50 sm:ml-auto sm:shrink-0"
              >
                {pendingAction === "resume" && isPending ? (
                  <IconLoader2 className="size-3.5 animate-spin" />
                ) : null}
                Resume subscription
              </button>
            </div>
          ) : subscription.isTrialing ? (
            <TrialCard
              planName={PLANS.find((p) => p.tier === subscription.tier)?.name ?? "trial"}
              price={PLANS.find((p) => p.tier === subscription.tier)?.price}
              trialEnd={subscription.trialEnd ?? subscription.currentPeriodEnd}
              discount={subscription.discount}
            />
          ) : (
            <ActiveCard
              planName={PLANS.find((p) => p.tier === subscription.tier)?.name ?? "plan"}
              price={PLANS.find((p) => p.tier === subscription.tier)?.price}
              renewsAt={subscription.currentPeriodEnd}
              isPending={isPending}
              pendingAction={pendingAction}
              onManage={handleManageSubscription}
              discount={subscription.discount}
            />
          )}

          <PlanGrid
            currentPlanKey={subscription.planKey}
            disabled={subscription.cancelAtPeriodEnd}
            isPending={isPending}
            pendingAction={pendingAction}
            onSwitchPlan={handleSwitchPlan}
          />

          {!subscription.cancelAtPeriodEnd && (
            <div className="flex justify-center border-t border-border pt-6">
              <button
                type="button"
                onClick={() => setShowCancelDialog(true)}
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
              >
                Cancel subscription
              </button>
            </div>
          )}

          <CancelSubscriptionDialog
            open={showCancelDialog}
            onOpenChange={setShowCancelDialog}
            subscription={subscription}
            onSubscriptionChanged={refetchSubscription}
          />
        </>
      )}
    </div>
  )
}

function DiscountPill({ discount }: { discount: NonNullable<SubscriptionState["discount"]> }) {
  return (
    <span className="rounded-full bg-(--color-blaze-orange)/10 px-2.5 py-1 text-[0.65rem] font-semibold text-(--color-blaze-orange)">
      {discount.percentOff}% off
      {discount.endsAt ? ` · until ${formatBillingDate(discount.endsAt)}` : null}
    </span>
  )
}

function TrialCard({
  planName,
  price,
  trialEnd,
  discount,
}: {
  planName: string
  price?: string
  trialEnd: string
  discount: SubscriptionState["discount"]
}) {
  const daysRemaining = getTrialDaysRemaining(trialEnd)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blaze-orange/25 bg-gradient-to-br from-blaze-orange/10 via-card to-amber-flame/6 p-5 shadow-[0_8px_28px_-16px_rgba(255,84,0,0.2)]">
      <div className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full bg-blaze-orange/8 blur-3xl" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3 sm:items-center">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blaze-orange/12 text-blaze-orange">
            <IconAlertTriangle className="size-4.5" stroke={2} />
          </span>
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              {daysRemaining === 0
                ? `Your ${planName} trial ends today`
                : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left on your ${planName} trial`}
              {discount && <DiscountPill discount={discount} />}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {price
                ? `You'll be charged $${price} on ${formatBillingDate(trialEnd)} unless you cancel.`
                : "Cancel anytime before your trial ends to avoid being charged."}
            </p>
          </div>
        </div>
        <div className="ml-12 flex items-center gap-1.5 text-xs text-muted-foreground sm:ml-auto sm:shrink-0">
          <IconCalendar className="size-3.5 shrink-0" />
          Trial ends {formatBillingDate(trialEnd)}
        </div>
      </div>
    </div>
  )
}

function ActiveCard({
  planName,
  price,
  renewsAt,
  isPending,
  pendingAction,
  onManage,
  discount,
}: {
  planName: string
  price?: string
  renewsAt: string
  isPending: boolean
  pendingAction: string | null
  onManage: () => void
  discount: SubscriptionState["discount"]
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blaze-orange/10 text-blaze-orange">
          <IconCrown className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {planName} plan{price ? ` — $${price}/month` : ""}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconCalendar className="size-3.5 shrink-0" />
            Renews {formatBillingDate(renewsAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:ml-auto sm:shrink-0">
        {discount && <DiscountPill discount={discount} />}
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[0.65rem] font-semibold text-emerald-600 dark:text-emerald-400">
          Active
        </span>
        <button
          type="button"
          disabled={isPending}
          onClick={onManage}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-blaze-orange/30 hover:text-blaze-orange disabled:opacity-50"
        >
          {pendingAction === "portal" && isPending ? (
            <IconLoader2 className="size-3.5 animate-spin" />
          ) : (
            <IconExternalLink className="size-3.5" />
          )}
          Manage payment method
        </button>
      </div>
    </div>
  )
}

function PlanGrid({
  currentPlanKey,
  disabled,
  isPending,
  pendingAction,
  onSwitchPlan,
}: {
  currentPlanKey: "pro" | "agency" | null
  disabled: boolean
  isPending: boolean
  pendingAction: string | null
  onSwitchPlan: (plan: "pro" | "agency") => void
}) {
  const currentPlanIndex = PLANS.findIndex((p) => p.key === currentPlanKey)

  return (
    <div>
      <p className="mb-5 text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
        Available plans
      </p>

      <div className="grid overflow-hidden rounded-[1.5rem] border border-border bg-card sm:grid-cols-2">
        {PLANS.map((plan, planIndex) => {
          const isCurrent = plan.key === currentPlanKey
          const isFeatured = plan.popular
          const previousPlan = planIndex > 0 ? PLANS[planIndex - 1] : null
          const isUpgrade =
            !isCurrent && (currentPlanIndex === -1 || planIndex > currentPlanIndex)
          const ctaLabel = isUpgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`
          const isThisPending = isPending && pendingAction === plan.key

          return (
            <article
              key={plan.key}
              className={`flex flex-col gap-6 p-6 sm:p-8 ${
                planIndex === 0
                  ? "border-b border-border sm:border-r sm:border-b-0"
                  : "bg-muted/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[0.68rem] font-bold text-(--color-blaze-orange) uppercase">
                    {plan.name}
                  </p>
                  {isCurrent ? (
                    <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[0.65rem] font-semibold text-muted-foreground uppercase">
                      Current
                    </span>
                  ) : isFeatured ? (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[0.65rem] font-semibold text-muted-foreground uppercase">
                      Popular
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm font-medium text-muted-foreground line-through">
                  ${plan.originalPrice}/month
                </p>
                <h2 className="mt-0.5 font-heading text-4xl font-semibold tracking-tight text-foreground">
                  ${plan.price}
                  <span className="ml-1 text-sm font-medium tracking-normal text-muted-foreground">
                    /month
                  </span>
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <div className="flex-1">
                {previousPlan && (
                  <p className="mb-3 text-sm font-semibold text-foreground">
                    Everything in {previousPlan.name}, plus:
                  </p>
                )}

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm leading-5">
                      <IconCheck className="mt-0.5 size-4 shrink-0 text-(--color-blaze-orange)" />
                      <span className="inline-flex items-center gap-1.5 text-foreground">
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

              {isCurrent ? (
                <div className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-muted/60 py-3 text-sm font-semibold text-muted-foreground">
                  <IconCheck className="size-4" />
                  Current plan
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isPending || disabled}
                  onClick={() => onSwitchPlan(plan.key as "pro" | "agency")}
                  className={`group flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 ${
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
            </article>
          )
        })}
      </div>
    </div>
  )
}

function LegacyTrialView({
  profile,
  isPending,
  pendingAction,
  onSelectPlan,
}: {
  profile: DashboardProfile | null
  isPending: boolean
  pendingAction: string | null
  onSelectPlan: (plan: "pro" | "agency") => void
}) {
  const trialing = isOnTrial(profile)
  const daysRemaining =
    trialing && profile?.billing_period_end_at
      ? getTrialDaysRemaining(profile.billing_period_end_at)
      : null

  return (
    <>
      {trialing && (
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
                Trial ends {formatBillingDate(profile.billing_period_end_at)}
              </div>
            )}
          </div>
        </div>
      )}

      <PlanGrid
        currentPlanKey={null}
        disabled={false}
        isPending={isPending}
        pendingAction={pendingAction}
        onSwitchPlan={onSelectPlan}
      />
    </>
  )
}
