import type { Database } from "@workspace/supabase/database-types"

export const FREE_TRIAL_DAYS = 7

export type BillingTier = Database["public"]["Enums"]["billing_tier"]

export const PLAN_TIERS = {
  starter: "pro",
  pro: "agency",
} as const satisfies Record<string, BillingTier>
