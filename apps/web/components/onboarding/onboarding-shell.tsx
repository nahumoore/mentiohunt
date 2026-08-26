"use client"

import type { ReactNode } from "react"

import { IconBrandMentiohunt } from "@/components/custom-icons/brand-mentiohunt"
import { OnboardingVisual } from "@/components/onboarding/onboarding-visual"

export function OnboardingShell({
  stepIndex,
  lastStepIndex,
  finalStepLabel,
  isSigningOut,
  onSignOut,
  children,
}: {
  stepIndex: number
  lastStepIndex: number
  /** Overrides the numeric "Step X / Y" label — used for the final trial-start
   *  screen, which sits past the counted setup steps and shouldn't read as an
   *  extra numbered step. */
  finalStepLabel?: string
  isSigningOut: boolean
  onSignOut: () => void
  children: ReactNode
}) {
  const stepNumber = String(stepIndex + 1).padStart(2, "0")
  const totalSteps = String(lastStepIndex + 1).padStart(2, "0")
  const progress = Math.min(stepIndex, lastStepIndex) / lastStepIndex

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="relative flex min-h-screen w-full flex-col px-6 py-10 sm:px-12 sm:py-12">
        <div className="absolute inset-x-6 top-10 flex items-center justify-between sm:inset-x-12 sm:top-12">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: "linear-gradient(135deg, var(--blaze-orange), var(--amber-flame))",
            }}
          >
            <IconBrandMentiohunt className="h-5 w-5 text-white" />
          </div>
          <button
            type="button"
            onClick={onSignOut}
            disabled={isSigningOut}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-2 text-[0.7rem] font-bold tracking-wide uppercase">
              {finalStepLabel ? (
                <span className="text-primary">{finalStepLabel}</span>
              ) : (
                <>
                  <span className="text-muted-foreground">Step </span>
                  <span className="text-primary">{stepNumber}</span>
                  <span className="text-muted-foreground"> / {totalSteps}</span>
                </>
              )}
            </div>
            <div className="mb-8 h-1 w-full rounded-full bg-border">
              <div
                className="h-1 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            <div
              key={stepIndex}
              className="animate-in duration-200 fade-in slide-in-from-bottom-2"
            >
              {children}
            </div>
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-border/60 bg-muted/30 lg:block">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 75% 55% at 50% 48%, color-mix(in oklch, var(--blaze-orange) 7%, transparent), transparent)",
          }}
        />
        <div className="relative h-full overflow-y-auto px-10 py-12 xl:px-16">
          <div className="flex min-h-full items-center justify-center">
            <OnboardingVisual />
          </div>
        </div>
      </div>
    </div>
  )
}
