"use client"

import { IconBrandMentiohunt } from "@/components/custom-icons/brand-mentiohunt"
import { ONBOARDING_STEPS, type OnboardingData, type OnboardingFieldErrors } from "@/consts/onboarding"
import { IconArrowRight, IconLoader2 } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

export function StepUrl({
  userName,
  data,
  errors,
  submitMessage,
  isFetching,
  onUrlChange,
  onNameChange,
  onSubmit,
}: {
  userName?: string | null
  data: OnboardingData
  errors: OnboardingFieldErrors
  submitMessage: string
  isFetching: boolean
  onUrlChange: (value: string) => void
  onNameChange: (value: string) => void
  onSubmit: () => void
}) {
  const showNameInput = !userName
  const resolvedFirstName = (userName ?? data.userName)?.split(" ")[0] ?? null

  return (
    <div>
      <div
        className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          background: "linear-gradient(135deg, var(--blaze-orange), var(--amber-flame))",
          boxShadow: "0 8px 28px color-mix(in oklch, var(--pumpkin-spice) 35%, transparent)",
        }}
      >
        <IconBrandMentiohunt className="h-8 w-8 text-white" />
      </div>

      <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        {resolvedFirstName ? `Hi, ${resolvedFirstName}` : ONBOARDING_STEPS[0]!.title}
      </h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">
        {ONBOARDING_STEPS[0]!.description}
      </p>

      <div className="mt-8 space-y-4">
        {showNameInput && (
          <div className="space-y-2">
            <label className="text-[0.7rem] font-bold text-muted-foreground uppercase">
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
          <label className="text-[0.7rem] font-bold text-muted-foreground uppercase">
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
          disabled={isFetching}
          className="w-full gap-2 rounded-full font-medium text-white"
          style={{
            background: "linear-gradient(135deg, var(--blaze-orange), var(--amber-flame))",
            boxShadow: "0 4px 20px color-mix(in oklch, var(--pumpkin-spice) 25%, transparent)",
          }}
        >
          {isFetching ? (
            <>
              <IconLoader2 className="h-4 w-4 animate-spin" />
              Reading your site...
            </>
          ) : (
            <>
              Find backlink opportunities
              <IconArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
