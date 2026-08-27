import type { Tables } from "@workspace/supabase/database-types"

const DAY_IN_MS = 24 * 60 * 60 * 1000

/**
 * Whether the account is inside a trial window right now — Stripe trial
 * (card-required, `tier` already "pro"/"agency") or the legacy no-card free
 * trial (`tier: "free"`). Both set `active_trial: true` while running, so
 * this alone is the correct check; don't gate it on `tier === "free"` too —
 * that excludes every card-required Stripe trial, which is most trials
 * since onboarding moved behind the paywall.
 */
export function isOnTrial(
  profile: Pick<Tables<"profiles">, "active_trial"> | null | undefined
): boolean {
  return profile?.active_trial === true
}

export function getTrialDaysRemaining(periodEndAt: string): number {
  const periodEndTime = new Date(periodEndAt).getTime()
  if (Number.isNaN(periodEndTime)) return 0
  return Math.max(0, Math.ceil((periodEndTime - Date.now()) / DAY_IN_MS))
}

export function formatBillingDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}
