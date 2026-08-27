import type Stripe from "stripe"

/** Fixed Stripe coupon id — actions/stripe-apply-retention-discount.ts
 * creates it on first use if missing, so nothing needs setting up by hand
 * in the Stripe dashboard. */
export const RETENTION_COUPON_ID = "cancel_save_30_2mo"
export const RETENTION_DISCOUNT_PERCENT_OFF = 30
export const RETENTION_DISCOUNT_MONTHS = 2

/** How many extra days actions/stripe-extend-trial.ts adds to a trialing
 * subscription's trial_end when a customer takes the "no time" save offer. */
export const EXTEND_TRIAL_DAYS = 3

/** Stripe customer metadata key both save-offer actions write once the
 * customer takes ANY save offer — a customer gets exactly one, ever, so a
 * cancellation wizard reopened after a decline never repeats it. */
export const SAVE_OFFER_USED_METADATA_KEY = "save_offer_used_at"

export type CancellationReason =
  | "too_expensive"
  | "not_enough_opportunities"
  | "no_results_yet"
  | "no_time"
  | "missing_feature"
  | "other_tool"
  | "just_testing"
  | "other"

export const CANCELLATION_REASONS: {
  id: CancellationReason
  label: string
}[] = [
  { id: "too_expensive", label: "It's too expensive" },
  {
    id: "not_enough_opportunities",
    label: "Not enough opportunities, or they weren't a good fit",
  },
  { id: "no_results_yet", label: "I haven't gotten replies or links yet" },
  { id: "no_time", label: "I haven't had time to use it" },
  { id: "missing_feature", label: "It's missing something I need" },
  { id: "other_tool", label: "I'm using another tool" },
  { id: "just_testing", label: "I was just testing it out" },
  { id: "other", label: "Something else" },
]

export const CANCELLATION_REASON_IDS = CANCELLATION_REASONS.map((r) => r.id) as [
  CancellationReason,
  ...CancellationReason[],
]

export function cancellationReasonLabel(reason: CancellationReason): string {
  return CANCELLATION_REASONS.find((r) => r.id === reason)?.label ?? reason
}

export type SaveOffer = "discount" | "extend_trial"

/** Which save offer (if any) answers each cancellation reason. `no_time`
 * maps to "extend_trial" because more days is the literal answer to "I
 * haven't had time" — but that only means something while a trial is
 * running, so resolveSaveOffer falls back to the discount for paid
 * subscribers. `missing_feature` and `other_tool` get a tailored follow-up
 * question instead of a save offer (see DETAIL_PROMPTS), and
 * `just_testing`/`other` get neither — nothing to counter-offer. */
const REASON_OFFERS: Partial<Record<CancellationReason, SaveOffer>> = {
  too_expensive: "discount",
  not_enough_opportunities: "discount",
  no_results_yet: "discount",
  no_time: "extend_trial",
}

/** Resolves the single save offer to show for a reason, or null for
 * "go straight to confirm". A customer gets one save offer ever — once
 * ctx.offerAlreadyUsed is true, every reason resolves to null. */
export function resolveSaveOffer(
  reason: CancellationReason,
  ctx: { isTrialing: boolean; offerAlreadyUsed: boolean }
): SaveOffer | null {
  if (ctx.offerAlreadyUsed) return null
  const offer = REASON_OFFERS[reason]
  if (!offer) return null
  if (offer === "extend_trial" && !ctx.isTrialing) return "discount"
  return offer
}

/** Per-reason prompt shown on the confirm step for reasons with no save
 * offer worth countering — collected as product feedback, not a retention
 * attempt. Reasons with a save offer never reach this; falls back to a
 * generic "anything else" prompt for the rest. */
export const DETAIL_PROMPTS: Partial<Record<CancellationReason, string>> = {
  missing_feature: "What's missing that you need?",
  other_tool: "Which tool, and what does it do better?",
}

/** Maps our reasons onto Stripe's own cancellation_details.feedback enum so
 * Stripe's churn reporting stays useful too. */
export function toStripeCancellationFeedback(
  reason: CancellationReason
): Stripe.SubscriptionUpdateParams.CancellationDetails.Feedback {
  switch (reason) {
    case "too_expensive":
      return "too_expensive"
    case "missing_feature":
      return "missing_features"
    case "other_tool":
      return "switched_service"
    case "not_enough_opportunities":
    case "no_results_yet":
    case "no_time":
    case "just_testing":
      return "unused"
    case "other":
    default:
      return "other"
  }
}
