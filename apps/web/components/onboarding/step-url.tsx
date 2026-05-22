"use client"

import { IconBrandMentiohunt } from "@/components/custom-icons/brand-mentiohunt"
import {
  GeneratingChecklist,
  type ChecklistTask,
} from "@/components/onboarding/generating-checklist"
import { ONBOARDING_STEPS, type OnboardingData, type OnboardingFieldErrors } from "@/consts/onboarding"
import { IconArrowRight } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

export type GeneratingPhase =
  | "idle"
  | "fetching-site"
  | "generating"
  | "done"
  | "error"

export function StepUrl({
  userName,
  data,
  errors,
  submitMessage,
  generatingPhase,
  checklist,
  isSigningOut,
  onUrlChange,
  onNameChange,
  onSubmit,
  onSignOut,
  onRetry,
  onRetryAll,
}: {
  userName?: string | null
  data: OnboardingData
  errors: OnboardingFieldErrors
  submitMessage: string
  generatingPhase: GeneratingPhase
  checklist: ChecklistTask[]
  isSigningOut: boolean
  onUrlChange: (value: string) => void
  onNameChange: (value: string) => void
  onSubmit: () => void
  onSignOut: () => void
  onRetry: (id: string) => void
  onRetryAll: () => void
}) {
  const isGenerating =
    generatingPhase === "fetching-site" || generatingPhase === "generating"
  const hasError = generatingPhase === "error"
  const showNameInput = !userName
  const resolvedFirstName =
    (userName ?? data.userName)?.split(" ")[0] ?? null

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center px-4">
      <button
        type="button"
        className="fixed top-5 right-5 z-20 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 sm:top-6 sm:right-6"
        onClick={onSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? "Signing out..." : "Sign out"}
      </button>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% 5%, color-mix(in oklch, var(--blaze-orange) 7%, transparent), transparent)",
        }}
      />

      <div className="relative w-full max-w-lg animate-in duration-300 fade-in slide-in-from-bottom-3">
        <div
          className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{
            background:
              "linear-gradient(135deg, var(--blaze-orange), var(--amber-flame))",
            boxShadow:
              "0 8px 28px color-mix(in oklch, var(--pumpkin-spice) 35%, transparent)",
          }}
        >
          <IconBrandMentiohunt className="h-10 w-10 text-white" />
        </div>

        <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {resolvedFirstName ? `Hi, ${resolvedFirstName}` : ONBOARDING_STEPS[0]!.title}
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          {ONBOARDING_STEPS[0]!.description}
        </p>

        <div className="mt-8 space-y-4">
          {!isGenerating && !hasError && (
            <>
              {showNameInput && (
                <div className="space-y-2">
                  <label className="text-[0.7rem] font-bold tracking-[0.24em] text-muted-foreground uppercase">
                    What should we call you?
                  </label>
                  <Input
                    placeholder="Your name"
                    value={data.userName}
                    onChange={(event) => onNameChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") onSubmit()
                    }}
                    className="h-14 text-base"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[0.7rem] font-bold tracking-[0.24em] text-muted-foreground uppercase">
                  Website URL
                </label>
                <Input
                  placeholder="https://yourwebsite.com"
                  value={data.websiteUrl}
                  aria-invalid={Boolean(errors.websiteUrl)}
                  onChange={(event) => onUrlChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onSubmit()
                  }}
                  className={cn(
                    "h-14 text-base",
                    errors.websiteUrl ? "border-destructive" : "border-border"
                  )}
                />
                {errors.websiteUrl && (
                  <p className="text-xs text-destructive">{errors.websiteUrl}</p>
                )}
              </div>

              {submitMessage && (
                <p className="text-sm text-muted-foreground">{submitMessage}</p>
              )}

              <Button
                size="lg"
                onClick={onSubmit}
                className="w-full gap-2 rounded-full font-medium text-white"
                style={{
                  background:
                    "linear-gradient(135deg, var(--blaze-orange), var(--amber-flame))",
                  boxShadow:
                    "0 4px 20px color-mix(in oklch, var(--pumpkin-spice) 25%, transparent)",
                }}
              >
                Configure both queues
                <IconArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Takes about 30 seconds
              </p>
            </>
          )}

          {(isGenerating || hasError) && (
            <div className="space-y-6">
              <GeneratingChecklist tasks={checklist} onRetry={onRetry} />
              {hasError && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Some steps failed. You can retry individual ones above, or
                    start over.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-full"
                      onClick={onRetryAll}
                    >
                      Retry all
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
