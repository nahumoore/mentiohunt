"use client"

import { IconCalendarPlus, IconCircleCheck, IconDiscount2 } from "@tabler/icons-react"

import {
  EXTEND_TRIAL_DAYS,
  RETENTION_DISCOUNT_MONTHS,
  RETENTION_DISCOUNT_PERCENT_OFF,
  type SaveOffer,
} from "@/consts/cancellation"

/** Presentational card for the cancellation wizard's save-offer step —
 * renders the pitch (or the "applied" confirmation) for whichever offer
 * resolveSaveOffer picked. Owns no button and no submit logic; the dialog's
 * footer drives acceptance so every step's actions live in one place. */
export function SaveOfferCard({
  offer,
  isTrialing,
  applied,
}: {
  offer: SaveOffer
  isTrialing: boolean
  applied: boolean
}) {
  const Icon = offer === "discount" ? IconDiscount2 : IconCalendarPlus

  const headline =
    offer === "discount"
      ? `Stay for ${RETENTION_DISCOUNT_PERCENT_OFF}% off, ${RETENTION_DISCOUNT_MONTHS} months on us.`
      : `Take ${EXTEND_TRIAL_DAYS} more days to try it out.`

  const body =
    offer === "discount"
      ? isTrialing
        ? `Before you go — take ${RETENTION_DISCOUNT_PERCENT_OFF}% off your first ${RETENTION_DISCOUNT_MONTHS} invoices once your trial ends. No code needed, applied automatically.`
        : `Before you go — take ${RETENTION_DISCOUNT_PERCENT_OFF}% off your next ${RETENTION_DISCOUNT_MONTHS} billing cycles. No code needed, applies instantly.`
      : `We'll push your trial end back by ${EXTEND_TRIAL_DAYS} days — no card charge, just more runway to see results.`

  const appliedBody =
    offer === "discount"
      ? isTrialing
        ? `You're locked in at ${RETENTION_DISCOUNT_PERCENT_OFF}% off your first ${RETENTION_DISCOUNT_MONTHS} invoices — it'll show up once your trial ends.`
        : `You're locked in at ${RETENTION_DISCOUNT_PERCENT_OFF}% off for your next ${RETENTION_DISCOUNT_MONTHS} billing cycles — it'll show up on your next invoice.`
      : `Your trial now runs ${EXTEND_TRIAL_DAYS} extra days — check the date above.`

  if (applied) {
    return (
      <div className="rounded-2xl border border-(--color-blaze-orange)/25 bg-(--color-blaze-orange)/5 p-5">
        <div className="flex items-start gap-3">
          <IconCircleCheck
            size={20}
            className="mt-0.5 shrink-0 text-(--color-blaze-orange)"
          />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {offer === "discount" ? "Discount applied" : "Trial extended"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{appliedBody}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-blaze-orange)/10">
          <Icon size={18} className="text-(--color-blaze-orange)" />
        </span>
        <div>
          <p className="font-heading text-base font-semibold text-foreground">{headline}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
        </div>
      </div>
    </div>
  )
}
