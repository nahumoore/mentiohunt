import type { Database } from "@workspace/supabase/database-types"

export const FREE_TRIAL_DAYS = 7
export const FREE_TRIAL_MAX_PAGES = 50

// Each submitted URL costs a real scrape + email verification + LLM calls, so
// it needs a per-day throttle. Paid-plan only — free/trial users see a
// paywall instead of the form (submit-url-dialog.tsx, enforced server-side
// in app/api/link-building/opportunities/submit/route.ts).
export const PAID_MAX_URL_SUBMISSIONS_PER_DAY = 20

// Link Tracker: paid-plan only, gated the same way as URL submissions above.
// Cap is per product (an Growth-tier account with 5 products effectively
// gets more) — generous enough to cover a real backlink portfolio without
// the nightly sweep's cost scaling unbounded.
export const TRACKED_LINKS_MAX_PER_PRODUCT = 200

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
      "Up to 10 competitors tracked",
      "2 opportunity scans a day (~50 prospects weekly)",
      "Fit rationale, contacts & ready-to-send drafts",
      `Submit up to ${PAID_MAX_URL_SUBMISSIONS_PER_DAY} of your own prospect URLs a day`,
      `Link Tracker — daily monitoring for up to ${TRACKED_LINKS_MAX_PER_PRODUCT} backlinks`,
      "Export to CSV",
      "Priority support",
      `${FREE_TRIAL_DAYS}-day free trial`,
    ],
    popular: true,
  },
  {
    key: "agency",
    tier: PLAN_TIERS.agency,
    stripePriceId: "price_1TYvkzHoiNfmn8GhMduOno62",
    name: "Growth",
    price: "99",
    description: "For teams managing backlinks across multiple sites.",
    features: [
      "Up to 5 websites",
      "Up to 15 competitors tracked",
      "3 opportunity scans a day, per website",
    ],
    popular: false,
  },
]
