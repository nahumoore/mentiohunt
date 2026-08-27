"use client"

import { useEffect, useRef, type ReactNode } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  IconArrowRight,
  IconBolt,
  IconCalendarCheck,
  IconCircleCheck,
  IconCrown,
} from "@tabler/icons-react"

import { PLANS } from "@/consts/billing"
import { useProfileStore } from "@/stores/profile-store"
import { Confetti, type ConfettiRef } from "@workspace/ui/components/confetti"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"

const REFRESH_INTERVAL_MS = 1500
const MAX_REFRESH_TIME_MS = 20_000

export function DashboardUpgradeSuccess() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const confettiRef = useRef<ConfettiRef>(null)
  const profile = useProfileStore((state) => state.profile)
  const optimisticTier = useProfileStore((state) => state.optimisticTier)
  const setTierOptimistically = useProfileStore(
    (state) => state.optimisticallySetTier
  )
  const plan =
    PLANS.find((item) => item.key === searchParams.get("plan")) ??
    PLANS.find((item) => item.tier === profile?.tier)
  const targetTier = plan?.tier ?? null

  useEffect(() => {
    const fireConfetti = async () => {
      await confettiRef.current?.fire({
        particleCount: 150,
        spread: 78,
        startVelocity: 32,
        scalar: 0.95,
        origin: { y: 0.58 },
        colors: ["#ff5400", "#ff8a00", "#fbbf24", "#22c55e", "#ffffff"],
      })

      window.setTimeout(() => {
        void confettiRef.current?.fire({
          particleCount: 70,
          spread: 100,
          startVelocity: 24,
          scalar: 0.8,
          origin: { y: 0.62, x: 0.2 },
          colors: ["#ff5400", "#ff8a00", "#fbbf24"],
        })
      }, 180)
    }

    const initialBurstTimer = window.setTimeout(() => {
      void fireConfetti()
    }, 80)

    return () => window.clearTimeout(initialBurstTimer)
  }, [])

  useEffect(() => {
    if (!targetTier) return

    setTierOptimistically(targetTier)
    router.refresh()

    const startedAt = Date.now()
    const refreshTimer = window.setInterval(() => {
      const { optimisticTier: currentOptimisticTier } =
        useProfileStore.getState()

      if (
        currentOptimisticTier === null ||
        Date.now() - startedAt >= MAX_REFRESH_TIME_MS
      ) {
        window.clearInterval(refreshTimer)
        return
      }

      router.refresh()
    }, REFRESH_INTERVAL_MS)

    return () => window.clearInterval(refreshTimer)
  }, [router, setTierOptimistically, targetTier])

  return (
    <Dialog open>
      <DialogContent
        className="max-w-2xl overflow-hidden border-blaze-orange/20 bg-card/95 p-0 shadow-[0_24px_80px_-36px_rgba(255,84,0,0.5)] backdrop-blur"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <Confetti
          ref={confettiRef}
          manualstart
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[60] size-full"
        />

        <div className="relative isolate overflow-hidden p-6 text-center sm:p-12">
          <div className="pointer-events-none absolute inset-x-1/4 top-0 -z-10 h-64 rounded-full bg-blaze-orange/10 blur-3xl" />
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-blaze-orange to-amber-flame text-white shadow-[0_16px_32px_-16px_rgba(255,84,0,0.8)]">
            <IconCrown className="size-10" stroke={1.7} />
          </div>

          <p className="mt-7 text-[0.7rem] font-bold tracking-[0.22em] text-blaze-orange uppercase">
            Upgrade complete
          </p>
          <DialogTitle className="mt-3 font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            You&apos;re ready to grow.
          </DialogTitle>
          <DialogDescription className="mx-auto mt-4 max-w-lg text-base leading-7 text-muted-foreground">
            {plan ? (
              <>
                Your{" "}
                <span className="font-semibold text-foreground">
                  {plan.name}
                </span>{" "}
                plan is active. More prospecting power is unlocked and your next
                backlink opportunities are ready when you are.
              </>
            ) : (
              "Your new plan is active. More prospecting power is unlocked and your next backlink opportunities are ready when you are."
            )}
          </DialogDescription>

          <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
            <UpgradeDetail
              icon={<IconCrown className="size-4" />}
              label="Your plan"
              value={plan?.name ?? "Upgraded"}
            />
            <UpgradeDetail
              icon={<IconBolt className="size-4" />}
              label="Status"
              value="Active now"
            />
            <UpgradeDetail
              icon={<IconCalendarCheck className="size-4" />}
              label="Next step"
              value="Find opportunities"
            />
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/dashboard">
                Go to your dashboard
                <IconArrowRight className="size-4" />
              </Link>
            </Button>
            <Link
              href="/dashboard/settings?tab=billing"
              className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              View billing details
            </Link>
          </div>

          <p
            className="mt-7 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <IconCircleCheck className="size-3.5 text-emerald-500" />
            {optimisticTier
              ? "Finalizing your account — your plan is already available."
              : "Your plan is confirmed and ready to use."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function UpgradeDetail({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/70 p-4">
      <div className="flex items-center gap-2 text-blaze-orange">
        {icon}
        <span className="text-[0.65rem] font-bold tracking-wide uppercase">
          {label}
        </span>
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  )
}
