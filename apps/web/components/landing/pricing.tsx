import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

const plans = [
  {
    name: "Starter",
    price: "49",
    description: "For individual founders building their backlink queue.",
    features: [
      "1 website",
      "Up to 10 competitors",
      "Weekly discovery runs",
      "Ranked opportunity queue",
      "Fit scores & rationale",
      "Suggested outreach angles",
      "14-day free trial",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Pro",
    price: "99",
    description: "For teams and agencies managing multiple sites.",
    features: [
      "Up to 5 websites",
      "Unlimited competitors per site",
      "Weekly discovery runs",
      "Ranked opportunity queue",
      "Fit scores & rationale",
      "Suggested outreach angles",
      "Export to CSV",
      "Priority support",
      "14-day free trial",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="bg-background py-20 sm:py-24 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[42px]">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            One price. No hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-8 lg:max-w-4xl lg:mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 ${
                plan.popular
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Most Popular
                </div>
              )}
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-4xl font-semibold tracking-tight">
                  ${plan.price}
                </span>
                <span
                  className={`text-sm ${
                    plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  /month
                </span>
              </div>
              <p
                className={`mt-2 text-sm ${
                  plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {plan.description}
              </p>

              <ul
                className={`mt-6 space-y-3 ${
                  plan.popular ? "text-primary-foreground" : ""
                }`}
              >
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <svg
                      className={`size-4 shrink-0 ${
                        plan.popular
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <Button
                  asChild
                  className={`w-full ${
                    plan.popular
                      ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                      : ""
                  }`}
                  size="lg"
                >
                  <Link href="#queue-preview">{plan.cta}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Both plans include a 14-day free trial. No credit card required to start.
        </p>
      </div>
    </section>
  )
}