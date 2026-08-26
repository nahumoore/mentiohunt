"use client"

import { IconCheck, IconInfoCircle } from "@tabler/icons-react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import { FREE_TRIAL_DAYS, PLANS, WARMUP_FEATURE_INFO, WARMUP_FEATURE_LABEL } from "@/consts/billing"

const proPlan = PLANS.find((p) => p.key === "pro")!

// Presentational only — the wizard's own bottom-nav button (onboarding-wizard.tsx)
// is the single CTA that saves setup and hands off to Stripe Checkout, so this
// step no longer carries its own button.
export function StepPaywall() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[0.7rem] font-bold text-primary uppercase">
            {proPlan.name}
          </p>
          <span className="rounded-full bg-muted px-2.5 py-1 text-[0.65rem] font-semibold text-muted-foreground uppercase">
            Most popular
          </span>
        </div>

        <p className="mt-4 text-sm font-medium text-foreground">
          {FREE_TRIAL_DAYS} days free, then
        </p>
        <p className="mt-1 text-sm font-medium text-muted-foreground line-through">
          ${proPlan.originalPrice}/month
        </p>
        <h2 className="mt-0.5 font-heading text-4xl font-semibold tracking-tight text-foreground">
          ${proPlan.price}
          <span className="ml-1 text-sm font-medium tracking-normal text-muted-foreground">
            /month
          </span>
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {proPlan.description}
        </p>

        <ul className="mt-6 space-y-3">
          {proPlan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm leading-5">
              <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
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

      <p className="text-center text-xs text-muted-foreground">
        Cancel anytime before day {FREE_TRIAL_DAYS} and you won&apos;t be charged.
      </p>
    </div>
  )
}
