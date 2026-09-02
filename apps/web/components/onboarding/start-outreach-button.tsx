"use client"

import { stripeBuyPlanRedirect } from "@/actions/stripe-buy-plan-redirect"
import { IconLoader2 } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { useState } from "react"

export function StartOutreachButton({ productId }: { productId: string }) {
  const [pending, setPending] = useState(false)

  const start = async () => {
    if (pending) return
    setPending(true)
    try {
      await stripeBuyPlanRedirect({
        plan: "pro",
        context: "onboarding",
        onboardingProductId: productId,
      })
    } catch (error) {
      if (isRedirectError(error)) throw error
      setPending(false)
    }
  }

  return (
    <Button
      onClick={() => void start()}
      disabled={pending}
      className="h-12 w-full gap-2 rounded-full px-8 text-base font-semibold text-white sm:w-auto"
      style={{
        background:
          "linear-gradient(135deg, var(--blaze-orange), var(--amber-flame))",
      }}
    >
      {pending && <IconLoader2 className="h-4 w-4 animate-spin" />}
      {pending
        ? "Opening secure checkout..."
        : "Start outreach free for 7 days"}
    </Button>
  )
}
