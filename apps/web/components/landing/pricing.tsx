import {
  IconArrowRight,
  IconCheck,
  IconInfoCircle,
  IconSparkles,
} from "@tabler/icons-react"
import Link from "next/link"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import { FREE_TRIAL_DAYS, PLANS } from "@/consts/billing"

const WARMUP_FEATURE_LABEL = "Free inbox warmup"
const WARMUP_FEATURE_INFO =
  "Warmup applies to your personal outreach account. Connect one if you'd rather send from your own domain than using a shared inbox pool."

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-x-0 top-0 mx-auto h-[34rem] w-[52rem] rounded-full bg-princeton-orange/10 blur-[120px]" />
        <div className="absolute right-0 bottom-20 h-[26rem] w-[26rem] translate-x-1/3 rounded-full bg-amber-flame/8 blur-[100px]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blaze-orange/20 bg-blaze-orange/8 px-3 py-1 text-xs font-bold text-blaze-orange uppercase">
            <IconSparkles className="h-3.5 w-3.5" />
            {FREE_TRIAL_DAYS}-day free trial
          </span>
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            Start with the plan that gets your{" "}
            <span className="bg-gradient-to-r from-[var(--color-blaze-orange-2)] via-[var(--color-harvest-orange)] to-[var(--color-amber-flame)] bg-clip-text text-transparent">
              backlink pipeline moving.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Two simple plans for backlink outreach autopilot. We discover
            opportunities and run outreach automatically through the first
            reply — you monitor the queue and cancel anything that isn&apos;t a
            fit.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl overflow-hidden rounded-[2rem] border border-border bg-card lg:grid-cols-2">
          {PLANS.map((plan, planIndex) => {
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
                    <p className="text-[0.7rem] font-bold text-blaze-orange uppercase">
                      {plan.name}
                    </p>
                    {isFeatured && (
                      <span className="rounded-full bg-muted px-3 py-1 text-[0.65rem] font-semibold text-muted-foreground uppercase">
                        Most popular
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 font-heading text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
                    ${plan.price}
                    <span className="ml-1 text-base font-medium tracking-normal text-muted-foreground">
                      /month
                    </span>
                  </h3>
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
                        <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-blaze-orange" />
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

                <Link
                  href="/signup"
                  className={`group flex w-full items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                    isFeatured
                      ? "bg-blaze-orange text-white shadow-[0_16px_38px_-20px_rgba(255,84,0,0.95)] hover:bg-blaze-orange-2"
                      : "border border-border bg-background text-foreground hover:border-blaze-orange/30 hover:text-blaze-orange"
                  }`}
                >
                  Start free trial
                  <IconArrowRight className="ml-2 h-4 w-4 transition duration-200 group-hover:translate-x-1" />
                </Link>
              </article>
            )
          })}
        </div>

        <p className="mt-8 text-center text-sm leading-6 text-muted-foreground">
          Both plans include a {FREE_TRIAL_DAYS}-day free trial. No credit card
          required to start.
        </p>
      </div>
    </section>
  )
}
