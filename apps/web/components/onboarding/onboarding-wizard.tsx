"use client"

import { supabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

import {
  ONBOARDING_STEPS,
  OPPORTUNITY_TYPES,
  competitorsStepSchema,
  normalizeUrl,
  onboardingSchema,
  opportunityTypesStepSchema,
  productDescriptionStepSchema,
  websiteUrlStepSchema,
  type OnboardingData,
  type OnboardingField,
  type OnboardingFieldErrors,
  type OpportunityTypeId,
} from "@/consts/onboarding"
import { useOnboardingStore } from "@/stores/onboarding-store"
import {
  IconArrowLeft,
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconFileDescription,
  IconListCheck,
  IconLoader2,
  IconTarget,
  IconUsersGroup,
  IconWorld,
  IconX,
} from "@tabler/icons-react"

const STEP_ICONS = [
  null,
  IconWorld,
  IconFileDescription,
  IconUsersGroup,
  IconTarget,
  IconListCheck,
]

export function OnboardingWizard({ userName }: { userName?: string | null }) {
  const router = useRouter()
  const {
    hasHydrated,
    currentStep,
    data,
    setCurrentStep,
    updateData,
    setIsCompleted,
  } = useOnboardingStore()
  const [fieldErrors, setFieldErrors] = useState<OnboardingFieldErrors>({})
  const [submitMessage, setSubmitMessage] = useState("")
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const lastStepIndex = ONBOARDING_STEPS.length - 1
    if (currentStep > lastStepIndex) {
      setCurrentStep(lastStepIndex)
    }
  }, [currentStep, setCurrentStep])

  const getCurrentStepErrors = (): OnboardingFieldErrors => {
    switch (currentStep) {
      case 1: {
        const result = websiteUrlStepSchema.safeParse(data)
        if (result.success) return {}
        const nextErrors: OnboardingFieldErrors = {}
        for (const issue of result.error.issues) {
          const field = issue.path[0] as OnboardingField | undefined
          if (field && !nextErrors[field]) nextErrors[field] = issue.message
        }
        return nextErrors
      }
      case 2: {
        const result = productDescriptionStepSchema.safeParse(data)
        return result.success
          ? {}
          : {
              productDescription:
                result.error.issues[0]?.message ??
                "Add a short description with at least 24 characters.",
            }
      }
      case 3: {
        const result = competitorsStepSchema.safeParse({
          competitors: data.competitors.map(normalizeUrl),
        })
        return result.success
          ? {}
          : {
              competitors:
                result.error.issues[0]?.message ?? "Add valid competitor URLs.",
            }
      }
      case 4: {
        const result = opportunityTypesStepSchema.safeParse(data)
        return result.success
          ? {}
          : {
              opportunityTypes:
                result.error.issues[0]?.message ??
                "Select at least one opportunity type.",
            }
      }
      default:
        return {}
    }
  }

  const clearFieldError = (field: OnboardingField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const updateField = <Key extends OnboardingField>(
    field: Key,
    value: OnboardingData[Key]
  ) => {
    updateData({ [field]: value } as Pick<OnboardingData, Key>)
    clearFieldError(field)
    setSubmitMessage("")
  }

  const validateCurrentStep = () => {
    const nextErrors = getCurrentStepErrors()
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      return false
    }
    switch (currentStep) {
      case 1: {
        const result = websiteUrlStepSchema.safeParse(data)
        if (result.success) updateData(result.data)
        break
      }
      case 2: {
        const result = productDescriptionStepSchema.safeParse(data)
        if (result.success) updateData(result.data)
        break
      }
      case 3: {
        const result = competitorsStepSchema.safeParse({
          competitors: data.competitors.map(normalizeUrl),
        })
        if (result.success) updateData(result.data)
        break
      }
      case 4: {
        const result = opportunityTypesStepSchema.safeParse(data)
        if (result.success) updateData(result.data)
        break
      }
      default:
        break
    }
    return true
  }

  const nextStep = async () => {
    if (currentStep === 1) {
      const normalizedUrl = normalizeUrl(data.websiteUrl.trim())
      if (!data.websiteUrl.trim()) {
        setFieldErrors({ websiteUrl: "Website URL is required." })
        return
      }
      try {
        new URL(normalizedUrl)
      } catch {
        setFieldErrors({ websiteUrl: "Enter a valid website URL." })
        return
      }

      setIsLoadingDetails(true)
      setSubmitMessage("")
      setFieldErrors({})

      try {
        const res = await fetch("/api/onboarding/get-product-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ websiteUrl: normalizedUrl }),
        })
        const json = (await res.json()) as {
          productDescription?: string
          competitors?: string[]
          error?: string
        }

        if (!res.ok) {
          setSubmitMessage(json.error ?? "Failed to fetch site details.")
          return
        }

        updateData({
          websiteUrl: normalizedUrl,
          productDescription: json.productDescription ?? data.productDescription,
          competitors: json.competitors ?? data.competitors,
        })
        setCurrentStep(2)
      } catch {
        setSubmitMessage("Failed to reach the server. Check your connection.")
      } finally {
        setIsLoadingDetails(false)
      }
      return
    }

    if (!validateCurrentStep()) return
    setCurrentStep(Math.min(currentStep + 1, ONBOARDING_STEPS.length - 1))
  }

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 0))
    setSubmitMessage("")
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    const normalizedData = {
      ...data,
      websiteUrl: normalizeUrl(data.websiteUrl),
      competitors: data.competitors.map(normalizeUrl),
    }

    for (
      let stepIndex = 0;
      stepIndex < ONBOARDING_STEPS.length - 1;
      stepIndex += 1
    ) {
      const result = (() => {
        switch (stepIndex) {
          case 0:
            return { success: true } as const
          case 1:
            return websiteUrlStepSchema.safeParse(normalizedData)
          case 2:
            return productDescriptionStepSchema.safeParse(normalizedData)
          case 3:
            return competitorsStepSchema.safeParse(normalizedData)
          case 4:
            return opportunityTypesStepSchema.safeParse(normalizedData)
          case 5:
            return { success: true } as const
          default:
            return { success: true } as const
        }
      })()

      if (!result.success) {
        setCurrentStep(stepIndex)
        const firstIssue = result.error.issues[0]
        const field = firstIssue?.path[0] as OnboardingField | undefined
        if (field && firstIssue) setFieldErrors({ [field]: firstIssue.message })
        setSubmitMessage(
          "Review the highlighted fields before completing setup."
        )
        return
      }
    }

    const result = onboardingSchema.safeParse(normalizedData)
    if (!result.success) {
      setSubmitMessage("Review the highlighted fields before completing setup.")
      return
    }

    updateData(result.data)
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      })

      const json = (await response.json().catch(() => null)) as {
        error?: string
      } | null

      if (!response.ok) {
        setSubmitMessage(json?.error ?? "Failed to complete onboarding.")
        return
      }

      setIsCompleted(true)
      router.replace("/dashboard")
      router.refresh()
    } catch {
      setSubmitMessage("Failed to reach the server. Check your connection.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    const supabase = supabaseClient()
    await supabase.auth.signOut()
    router.replace("/signin")
    router.refresh()
  }

  if (!hasHydrated) {
    return (
      <div className="flex h-screen w-full items-center justify-center px-4">
        <div className="h-[85vh] w-full max-w-xl rounded-[2rem] border border-border bg-card" />
      </div>
    )
  }

  if (currentStep === 0) {
    return (
      <StepWelcome
        userName={userName}
        onGetStarted={nextStep}
        onSignOut={() => void handleSignOut()}
        isSigningOut={isSigningOut}
      />
    )
  }

  const StepIcon = STEP_ICONS[currentStep] ?? null
  const totalSteps = ONBOARDING_STEPS.length - 1
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1

  return (
    <div className="mx-auto flex h-screen max-h-screen w-full max-w-xl items-center overflow-hidden px-4 py-4 sm:px-6">
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={isSigningOut}
        className="fixed top-5 right-5 z-20 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 sm:top-6 sm:right-6"
      >
        {isSigningOut ? "Signing out..." : "Sign out"}
      </button>

      <div className="flex h-[85vh] min-h-0 w-full flex-col overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
        {/* Step header */}
        <div className="shrink-0 px-7 pt-7 pb-5">
          {/* Progress bar */}
          <div className="mb-5 flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => {
              const stepNum = i + 1
              return (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-all duration-500"
                  style={{
                    background:
                      stepNum <= currentStep
                        ? "linear-gradient(90deg, var(--blaze-orange), var(--amber-flame))"
                        : "var(--border)",
                    opacity: stepNum < currentStep ? 0.4 : 1,
                  }}
                />
              )
            })}
          </div>

          <div
            key={`header-${currentStep}`}
            className="animate-in duration-200 fade-in slide-in-from-bottom-1"
          >
            <div className="flex items-center gap-3">
              {StepIcon && (
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background:
                      "color-mix(in oklch, var(--primary) 12%, var(--card))",
                  }}
                >
                  <StepIcon className="h-4 w-4 text-primary" />
                </div>
              )}
              <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                {ONBOARDING_STEPS[currentStep]!.title}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {ONBOARDING_STEPS[currentStep]!.description}
            </p>
          </div>
        </div>

        <div className="mx-7 shrink-0 border-t border-border" />

        {/* Content */}
        <div
          key={currentStep}
          className="min-h-0 flex-1 animate-in overflow-hidden px-7 py-5 duration-200 fade-in slide-in-from-bottom-2"
        >
          {currentStep === 1 && (
            <StepWebsite
              data={data}
              updateField={updateField}
              errors={fieldErrors}
            />
          )}
          {currentStep === 2 && (
            <StepProductDescription
              data={data}
              updateField={updateField}
              error={fieldErrors.productDescription}
            />
          )}
          {currentStep === 3 && (
            <StepCompetitors
              data={data}
              updateField={updateField}
              error={fieldErrors.competitors}
            />
          )}
          {currentStep === 4 && (
            <StepOpportunityTypes
              data={data}
              updateField={updateField}
              error={fieldErrors.opportunityTypes}
            />
          )}
          {currentStep === 5 && <StepReview data={data} />}
        </div>

        {submitMessage && (
          <div className="mx-7 mb-2 shrink-0 rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground">
            {submitMessage}
          </div>
        )}

        {/* Navigation */}
        <div className="flex shrink-0 items-center justify-between border-t border-border px-7 py-5">
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            onClick={prevStep}
            disabled={isLoadingDetails}
          >
            <IconArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          {isLastStep ? (
            <Button
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="gap-2 rounded-full px-7 font-medium text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--blaze-orange), var(--amber-flame))",
              }}
            >
              {isSubmitting ? (
                <>
                  <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <IconCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Complete setup
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => void nextStep()}
              disabled={isLoadingDetails}
              className="gap-2 rounded-full px-7 font-medium text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--blaze-orange), var(--amber-flame))",
              }}
            >
              {isLoadingDetails ? (
                <>
                  <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                  Analyzing site...
                </>
              ) : (
                <>
                  Continue
                  <IconArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function StepWelcome({
  userName,
  onGetStarted,
  onSignOut,
  isSigningOut,
}: {
  userName?: string | null
  onGetStarted: () => void
  onSignOut: () => void
  isSigningOut: boolean
}) {
  const firstName = userName?.split(" ")[0] ?? null
  return (
    <div className="relative flex h-screen max-h-screen w-full flex-col items-center justify-center overflow-hidden px-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 10%, color-mix(in oklch, var(--blaze-orange) 8%, transparent), transparent)",
        }}
      />

      <button
        type="button"
        className="fixed top-5 right-5 z-20 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 sm:top-6 sm:right-6"
        onClick={onSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? "Signing out..." : "Sign out"}
      </button>

      <div className="relative mx-auto w-full max-w-xl animate-in text-center duration-300 fade-in slide-in-from-bottom-3">
        <div
          className="mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, var(--blaze-orange), var(--amber-flame))",
            boxShadow:
              "0 8px 28px color-mix(in oklch, var(--pumpkin-spice) 40%, transparent)",
          }}
        >
          <IconBolt className="h-7 w-7 text-white" stroke={2} />
        </div>

        <h1 className="font-heading text-5xl font-semibold tracking-tight sm:text-6xl">
          {firstName ? `Hi, ${firstName}!` : "Welcome to Mentiohunt"}
        </h1>
        {firstName && (
          <p className="mt-2 font-heading text-2xl font-medium text-muted-foreground sm:text-3xl">
            Welcome to Mentiohunt
          </p>
        )}

        <p className="mx-auto mt-5 max-w-sm text-sm leading-7 text-muted-foreground sm:text-base">
          Find backlink opportunities worth acting on. Know why they fit. Move
          into outreach without the busywork.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={onGetStarted}
            className="gap-2.5 rounded-full px-10 font-medium text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--blaze-orange), var(--amber-flame))",
              boxShadow:
                "0 4px 20px color-mix(in oklch, var(--pumpkin-spice) 30%, transparent)",
            }}
          >
            Get started
            <IconArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground">Takes about 2 minutes</p>
        </div>
      </div>
    </div>
  )
}

function WelcomeCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div
      className="rounded-2xl border border-border p-4"
      style={{
        background:
          "linear-gradient(150deg, color-mix(in oklch, var(--primary) 6%, var(--card)) 0%, var(--card) 100%)",
      }}
    >
      <span
        className="text-[10px] font-semibold tracking-[0.15em]"
        style={{ color: "var(--harvest-orange)" }}
      >
        {number}
      </span>
      <p className="mt-2 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function StepWebsite({
  data,
  updateField,
  errors,
}: {
  data: OnboardingData
  updateField: <Key extends OnboardingField>(
    field: Key,
    value: OnboardingData[Key]
  ) => void
  errors: OnboardingFieldErrors
}) {
  const normalizedUrl = normalizeUrl(data.websiteUrl.trim())
  let hostname = ""
  try {
    if (data.websiteUrl.trim()) hostname = new URL(normalizedUrl).hostname
  } catch {
    // invalid url — no preview
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="space-y-2">
        <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Website URL
        </label>
        <Input
          placeholder="https://yourwebsite.com"
          value={data.websiteUrl}
          aria-invalid={Boolean(errors.websiteUrl)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateField("websiteUrl", e.target.value)
          }
          className={cn(
            "h-11 rounded-full border bg-background px-4",
            errors.websiteUrl ? "border-destructive" : "border-border"
          )}
        />
        {errors.websiteUrl && (
          <p className="text-xs text-destructive">{errors.websiteUrl}</p>
        )}
      </div>

      {hostname ? (
        <div
          className="animate-in fade-in slide-in-from-bottom-1 rounded-2xl border border-border p-4 duration-200"
          style={{
            background:
              "linear-gradient(150deg, color-mix(in oklch, var(--primary) 6%, var(--card)) 0%, var(--card) 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <img
              src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
              className="h-6 w-6 rounded"
              alt=""
            />
            <span className="text-sm font-medium text-foreground">
              {hostname}
            </span>
          </div>
          <p className="mt-2.5 text-xs leading-5 text-muted-foreground">
            We'll analyze this page and auto-detect a product description and
            competitor list for the next steps.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">
            Enter your URL to preview
          </p>
        </div>
      )}
    </div>
  )
}

function StepProductDescription({
  data,
  updateField,
  error,
}: {
  data: OnboardingData
  updateField: <Key extends OnboardingField>(
    field: Key,
    value: OnboardingData[Key]
  ) => void
  error?: string
}) {
  const charCount = data.productDescription.trim().length
  const charMax = 280
  const charPct = Math.min(charCount / charMax, 1)

  return (
    <div className="h-full overflow-y-auto pr-1">
      <div className="space-y-2 pb-2">
        <textarea
          className={cn(
            "min-h-[160px] w-full rounded-[1.5rem] border bg-background px-4 py-3 text-sm leading-6 outline-none placeholder:text-muted-foreground transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
            error ? "border-destructive" : "border-border"
          )}
          placeholder="Describe what your product does, who it helps, and what makes it useful."
          value={data.productDescription}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            updateField("productDescription", e.target.value)
          }
        />
        <div className="space-y-1.5">
          <div className="h-0.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${charPct * 100}%`,
                background:
                  charCount < 24
                    ? "var(--border)"
                    : charCount > 250
                      ? "var(--destructive)"
                      : "linear-gradient(90deg, var(--blaze-orange), var(--amber-flame))",
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {charCount < 24
                ? `${24 - charCount} more characters needed`
                : "Short, concrete copy works best."}
            </span>
            <span>
              {charCount} / {charMax}
            </span>
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}

function StepCompetitors({
  data,
  updateField,
  error,
}: {
  data: OnboardingData
  updateField: <Key extends OnboardingField>(
    field: Key,
    value: OnboardingData[Key]
  ) => void
  error?: string
}) {
  const [draftError, setDraftError] = useState("")

  const addCompetitor = (url: string) => {
    const normalizedUrl = normalizeUrl(url)

    if (data.competitors.length >= 10) {
      setDraftError("You can add up to 10 competitors.")
      return
    }

    try {
      new URL(normalizedUrl)
    } catch {
      setDraftError("Enter a valid competitor URL.")
      return
    }

    if (data.competitors.includes(normalizedUrl)) {
      setDraftError("That competitor is already in your list.")
      return
    }

    updateField("competitors", [...data.competitors, normalizedUrl])
    setDraftError("")
  }

  const removeCompetitor = (url: string) => {
    updateField(
      "competitors",
      data.competitors.filter((c) => c !== url)
    )
  }

  const needed = Math.max(0, 3 - data.competitors.length)

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Competitor URLs
          </label>
          <span className="text-xs text-muted-foreground">
            {needed > 0
              ? `${needed} more needed`
              : `${data.competitors.length} / 10 added`}
          </span>
        </div>
        <CompetitorInput
          onAdd={addCompetitor}
          disabled={data.competitors.length >= 10}
        />
        {(draftError || error) && (
          <p className="text-xs text-destructive">{draftError || error}</p>
        )}
      </div>

      {data.competitors.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">
            Add at least 3 competitor sites to continue
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="space-y-2">
            {data.competitors.map((url) => (
              <CompetitorCard
                key={url}
                url={url}
                onRemove={() => removeCompetitor(url)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CompetitorCard({
  url,
  onRemove,
}: {
  url: string
  onRemove: () => void
}) {
  let hostname = ""
  try {
    hostname = new URL(url).hostname
  } catch {
    hostname = url.replace(/^https?:\/\//, "")
  }

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-destructive/20 p-3"
      style={{
        background: "color-mix(in oklch, var(--destructive) 5%, var(--card))",
      }}
    >
      <img
        src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
        className="h-5 w-5 shrink-0 rounded"
        alt=""
      />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        {hostname}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-destructive/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <IconX className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function CompetitorInput({
  onAdd,
  disabled,
}: {
  onAdd: (url: string) => void
  disabled: boolean
}) {
  const [value, setValue] = useState("")

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (value.trim()) {
        onAdd(value.trim())
        setValue("")
      }
    }
  }

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row">
      <Input
        placeholder={
          disabled ? "Maximum 10 competitors" : "Enter a competitor URL"
        }
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setValue(e.target.value)
        }
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="h-11 rounded-full border border-border bg-background px-4"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          if (!value.trim()) return
          onAdd(value.trim())
          setValue("")
        }}
        disabled={disabled || !value.trim()}
        className="shrink-0 rounded-full"
      >
        Add
      </Button>
    </div>
  )
}

function StepOpportunityTypes({
  data,
  updateField,
  error,
}: {
  data: OnboardingData
  updateField: <Key extends OnboardingField>(
    field: Key,
    value: OnboardingData[Key]
  ) => void
  error?: string
}) {
  const toggleOpportunityType = (id: OpportunityTypeId) => {
    const isSelected = data.opportunityTypes.includes(id)
    updateField(
      "opportunityTypes",
      isSelected
        ? data.opportunityTypes.filter((t) => t !== id)
        : [...data.opportunityTypes, id]
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-2.5 pb-2">
          {OPPORTUNITY_TYPES.map((type) => {
            const selected = data.opportunityTypes.includes(type.id)
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => toggleOpportunityType(type.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/30 hover:bg-muted/20"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                    selected ? "border-primary bg-primary" : "border-border"
                  )}
                >
                  {selected && (
                    <IconCheck
                      className="h-3 w-3 text-primary-foreground"
                      strokeWidth={3}
                    />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {type.label}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    {type.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}

function ReviewRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      {children}
    </div>
  )
}

function StepReview({ data }: { data: OnboardingData }) {
  return (
    <div className="h-full overflow-y-auto pr-1">
      <div className="space-y-3 pb-2">
        <ReviewRow label="Website">
          <p className="text-sm text-foreground">{data.websiteUrl}</p>
        </ReviewRow>

        <ReviewRow label="Description">
          <p className="text-sm leading-6 text-foreground">
            {data.productDescription}
          </p>
        </ReviewRow>

        <ReviewRow label={`Competitors · ${data.competitors.length}`}>
          <div className="flex flex-wrap gap-1.5">
            {data.competitors.map((url) => (
              <span
                key={url}
                className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground"
              >
                {url.replace(/^https?:\/\//, "")}
              </span>
            ))}
          </div>
        </ReviewRow>

        <ReviewRow label="Opportunity types">
          <div className="flex flex-wrap gap-1.5">
            {OPPORTUNITY_TYPES.filter((t) =>
              data.opportunityTypes.includes(t.id)
            ).map((type) => (
              <span
                key={type.id}
                className="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-2.5 py-1 text-xs text-foreground"
              >
                <IconCheck
                  className="h-2.5 w-2.5 text-primary"
                  strokeWidth={3}
                />
                {type.label}
              </span>
            ))}
          </div>
        </ReviewRow>
      </div>
    </div>
  )
}
