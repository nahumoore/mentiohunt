"use client"

import {
  IconArrowLeft,
  IconCalendarPlus,
  IconCircleCheck,
  IconDiscount2,
  IconFlag,
  IconLoader2,
  IconMoodSad2,
} from "@tabler/icons-react"
import { useState } from "react"
import { toast } from "sonner"

import { captureEvent } from "@/lib/analytics"
import { formatBillingDate } from "@/lib/billing/trial"
import {
  CANCELLATION_REASONS,
  DETAIL_PROMPTS,
  EXTEND_TRIAL_DAYS,
  RETENTION_DISCOUNT_MONTHS,
  RETENTION_DISCOUNT_PERCENT_OFF,
  resolveSaveOffer,
  type CancellationReason,
  type SaveOffer,
} from "@/consts/cancellation"
import { stripeApplyRetentionDiscount } from "@/actions/stripe-apply-retention-discount"
import { stripeExtendTrial } from "@/actions/stripe-extend-trial"
import type { SubscriptionState } from "@/actions/stripe-subscription-state"
import { SaveOfferCard } from "@/components/dashboard/settings/retention-discount-offer"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Textarea } from "@workspace/ui/components/textarea"

type Step = "reason" | "offer" | "confirm"

const DEFAULT_DETAIL_PROMPT = "Anything else we should know? (optional)"

type CancelSubscriptionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription: SubscriptionState
  onSubscriptionChanged: () => void
}

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  subscription,
  onSubscriptionChanged,
}: CancelSubscriptionDialogProps) {
  const [step, setStep] = useState<Step>("reason")
  const [reason, setReason] = useState<CancellationReason | null>(null)
  const [detail, setDetail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [offerApplied, setOfferApplied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const offer: SaveOffer | null = reason
    ? resolveSaveOffer(reason, {
        isTrialing: subscription.isTrialing,
        offerAlreadyUsed: subscription.saveOfferUsed,
      })
    : null

  const stepOrder: Step[] = offer ? ["reason", "offer", "confirm"] : ["reason", "confirm"]
  const stepIndex = stepOrder.indexOf(step)

  function reset() {
    setStep("reason")
    setReason(null)
    setDetail("")
    setOfferApplied(false)
    setError(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)
    if (nextOpen) {
      captureEvent("cancellation_wizard_opened")
    } else {
      setTimeout(reset, 200)
    }
  }

  function handlePickReason(nextReason: CancellationReason) {
    setReason(nextReason)
    captureEvent("cancellation_reason_selected", { reason: nextReason })
    const nextOffer = resolveSaveOffer(nextReason, {
      isTrialing: subscription.isTrialing,
      offerAlreadyUsed: subscription.saveOfferUsed,
    })
    setStep(nextOffer ? "offer" : "confirm")
  }

  function handleBack() {
    if (step === "confirm") {
      setStep(offer ? "offer" : "reason")
    } else if (step === "offer") {
      setStep("reason")
    }
  }

  function handleDeclineOffer() {
    captureEvent("cancellation_offer_declined", { reason, offer })
    setStep("confirm")
  }

  async function handleAcceptOffer() {
    if (!offer || isSubmitting) return
    setIsSubmitting(true)
    setError(null)

    const result =
      offer === "discount" ? await stripeApplyRetentionDiscount() : await stripeExtendTrial()

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    captureEvent("cancellation_offer_accepted", { reason, offer })
    setOfferApplied(true)
    setIsSubmitting(false)
    onSubscriptionChanged()
    toast.success(
      offer === "discount"
        ? `Applied — ${RETENTION_DISCOUNT_PERCENT_OFF}% off for your next ${RETENTION_DISCOUNT_MONTHS} billing cycles.`
        : `Applied — your trial now runs ${EXTEND_TRIAL_DAYS} extra days.`
    )
    // Give the offer card's own "applied" state a moment on screen before
    // the dialog closes, instead of yanking it away the instant it lands.
    setTimeout(() => handleOpenChange(false), 1500)
  }

  async function handleConfirm() {
    if (!reason || isSubmitting) return
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, detail: detail.trim() || undefined }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null
        setError(data?.error ?? "Could not cancel your subscription. Try again.")
        return
      }

      captureEvent("cancellation_confirmed", { reason })
      toast.success(
        `Canceled — you'll keep access until ${formatBillingDate(subscription.currentPeriodEnd)}.`
      )
      onSubscriptionChanged()
      handleOpenChange(false)
    } catch {
      setError("Could not cancel your subscription. Try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const stepMeta: Record<Step, { eyebrow: string; title: string; description: string; Icon: typeof IconFlag }> = {
    reason: {
      eyebrow: "Cancel subscription",
      title: "Why are you canceling?",
      description: "This helps us understand what to fix. Pick the closest one.",
      Icon: IconFlag,
    },
    offer:
      offer === "extend_trial"
        ? {
            eyebrow: "Before you go",
            title: "Would more time help?",
            description: `${EXTEND_TRIAL_DAYS} extra trial days, added instantly — no card charge.`,
            Icon: IconCalendarPlus,
          }
        : {
            eyebrow: "Before you go",
            title: "Would a discount change things?",
            description: `${RETENTION_DISCOUNT_PERCENT_OFF}% off for your next ${RETENTION_DISCOUNT_MONTHS} billing cycles, applied instantly — no code needed.`,
            Icon: IconDiscount2,
          },
    confirm: {
      eyebrow: "Confirm",
      title: "Cancel your subscription?",
      description: "You'll keep full access until the date below — this is fully reversible until then.",
      Icon: IconMoodSad2,
    },
  }

  const meta = stepMeta[step]
  const detailPrompt = reason ? (DETAIL_PROMPTS[reason] ?? DEFAULT_DETAIL_PROMPT) : DEFAULT_DETAIL_PROMPT

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogTitle className="sr-only">{meta.title}</DialogTitle>
        <DialogDescription className="sr-only">{meta.description}</DialogDescription>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <meta.Icon className="size-3.5" />
            </span>
            <span className="text-[0.7rem] font-bold tracking-[0.24em] text-muted-foreground uppercase">
              {meta.eyebrow}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {stepOrder.map((s, i) => (
              <span
                key={s}
                className={
                  i === stepIndex
                    ? "h-1.5 w-5 rounded-full bg-(--color-blaze-orange) transition-all duration-150"
                    : "size-1.5 rounded-full bg-border transition-all duration-150"
                }
              />
            ))}
          </div>
        </div>

        <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-balance text-foreground">
          {meta.title}
        </h2>
        {meta.description && (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{meta.description}</p>
        )}

        <div className="mt-6 min-h-[8rem]">
          {step === "reason" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CANCELLATION_REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handlePickReason(r.id)}
                  className="rounded-2xl border border-border bg-background px-4 py-3.5 text-left text-sm font-medium text-foreground transition-colors hover:border-blaze-orange/30 hover:bg-muted/50"
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {step === "offer" && offer && (
            <>
              <SaveOfferCard
                offer={offer}
                isTrialing={subscription.isTrialing}
                applied={offerApplied}
              />
              {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
            </>
          )}

          {step === "confirm" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3.5 text-sm text-foreground">
                Access ends <strong>{formatBillingDate(subscription.currentPeriodEnd)}</strong> —
                you won't be charged again, and you can resume anytime before then.
              </div>
              <Textarea
                placeholder={detailPrompt}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            style={step === "reason" ? { visibility: "hidden" } : undefined}
            tabIndex={step === "reason" ? -1 : 0}
          >
            <IconArrowLeft className="size-3.5" />
            Back
          </button>

          {step === "reason" && (
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Keep my subscription
            </button>
          )}

          {step === "offer" && offer && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDeclineOffer}
                disabled={isSubmitting || offerApplied}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                No thanks, continue canceling
              </button>
              <Button
                onClick={() => void handleAcceptOffer()}
                disabled={isSubmitting || offerApplied}
                className="rounded-full px-6 font-medium"
              >
                {isSubmitting ? (
                  <IconLoader2 className="animate-spin" />
                ) : offerApplied ? (
                  <IconCircleCheck />
                ) : null}
                {offer === "discount"
                  ? `Apply ${RETENTION_DISCOUNT_PERCENT_OFF}% discount`
                  : `Get ${EXTEND_TRIAL_DAYS} more days`}
              </Button>
            </div>
          )}

          {step === "confirm" && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Keep my subscription
              </button>
              <Button
                variant="destructive"
                disabled={isSubmitting}
                onClick={() => void handleConfirm()}
                className="rounded-full px-6 font-medium"
              >
                {isSubmitting ? (
                  <IconLoader2 className="animate-spin" />
                ) : (
                  <IconCircleCheck />
                )}
                Cancel my subscription
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
