import type { Database } from "@workspace/supabase/database-types"

export const FREE_TRIAL_DAYS = 7

export type BillingTier = Database["public"]["Enums"]["billing_tier"]

export const PLAN_TIERS = {
  pro: "pro",
  agency: "agency",
} as const satisfies Record<string, BillingTier>

export interface Plan {
  key: keyof typeof PLAN_TIERS
  tier: BillingTier
  stripePriceId: string
  name: string
  price: string
  description: string
  features: string[]
  popular: boolean
}

export const PLANS: Plan[] = [
  {
    key: "pro",
    tier: PLAN_TIERS.pro,
    stripePriceId: "price_1TYvkTHoiNfmn8GhTMo6cm2j",
    name: "Pro",
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
    popular: true,
  },
  {
    key: "agency",
    tier: PLAN_TIERS.agency,
    stripePriceId: "price_1TYvkzHoiNfmn8GhMduOno62",
    name: "Agency",
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
    popular: false,
  },
]
