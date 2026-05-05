"use client"

import { useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

import {
  DISCOVERY_SOURCES,
  ONBOARDING_STEPS,
  OPPORTUNITY_TYPES,
  competitorsStepSchema,
  discoveryStepSchema,
  normalizeUrl,
  onboardingSchema,
  opportunityTypesStepSchema,
  websiteStepSchema,
  type OnboardingData,
  type OnboardingField,
  type OnboardingFieldErrors,
  type OpportunityTypeId,
} from "@/consts/onboarding"
import { useOnboardingStore } from "@/stores/onboarding-store"

export function OnboardingWizard() {
  const { hasHydrated, currentStep, data, setCurrentStep, updateData, reset } =
    useOnboardingStore()
  const [fieldErrors, setFieldErrors] = useState<OnboardingFieldErrors>({})
  const [submitMessage, setSubmitMessage] = useState("")

  const getCurrentStepErrors = (): OnboardingFieldErrors => {
    switch (currentStep) {
      case 1: {
        const result = websiteStepSchema.safeParse(data)

        if (result.success) {
          return {}
        }

        const nextErrors: OnboardingFieldErrors = {}

        for (const issue of result.error.issues) {
          const field = issue.path[0] as OnboardingField | undefined
          if (field && !nextErrors[field]) {
            nextErrors[field] = issue.message
          }
        }

        return nextErrors
      }
      case 2: {
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
      case 3: {
        const result = opportunityTypesStepSchema.safeParse(data)
        return result.success
          ? {}
          : {
              opportunityTypes:
                result.error.issues[0]?.message ??
                "Select at least one opportunity type.",
            }
      }
      case 4: {
        const result = discoveryStepSchema.safeParse(data)
        return result.success
          ? {}
          : {
              discoverySource:
                result.error.issues[0]?.message ??
                "Choose how you heard about mentions.",
            }
      }
      default:
        return {}
    }
  }

  const clearFieldError = (field: OnboardingField) => {
    setFieldErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors
      }

      const nextErrors = { ...currentErrors }
      delete nextErrors[field]
      return nextErrors
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
        const result = websiteStepSchema.safeParse(data)
        if (result.success) {
          updateData(result.data)
        }
        break
      }
      case 2: {
        const result = competitorsStepSchema.safeParse({
          competitors: data.competitors.map(normalizeUrl),
        })
        if (result.success) {
          updateData(result.data)
        }
        break
      }
      case 3: {
        const result = opportunityTypesStepSchema.safeParse(data)
        if (result.success) {
          updateData(result.data)
        }
        break
      }
      case 4: {
        const result = discoveryStepSchema.safeParse(data)
        if (result.success) {
          updateData(result.data)
        }
        break
      }
      default:
        break
    }

    return true
  }

  const handleReset = () => {
    reset()
    setFieldErrors({})
    setSubmitMessage("")
  }

  const nextStep = () => {
    if (!validateCurrentStep()) {
      return
    }

    setCurrentStep(Math.min(currentStep + 1, ONBOARDING_STEPS.length - 1))
  }

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 0))
    setSubmitMessage("")
  }

  const handleSubmit = () => {
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
            return websiteStepSchema.safeParse(normalizedData)
          case 2:
            return competitorsStepSchema.safeParse(normalizedData)
          case 3:
            return opportunityTypesStepSchema.safeParse(normalizedData)
          case 4:
            return discoveryStepSchema.safeParse(normalizedData)
          default:
            return { success: true } as const
        }
      })()

      if (!result.success) {
        setCurrentStep(stepIndex)
        const firstIssue = result.error.issues[0]
        const field = firstIssue?.path[0] as OnboardingField | undefined

        if (field && firstIssue) {
          setFieldErrors({ [field]: firstIssue.message })
        }

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
    console.log("Submitting onboarding data:", result.data)
    setSubmitMessage(
      "Setup looks good. Your progress is saved locally while the backend is not connected yet."
    )
  }

  if (!hasHydrated) {
    return (
      <div className="mx-auto flex h-screen max-h-screen w-full max-w-3xl items-center overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
        <div className="h-[80vh] min-h-0 w-full rounded-[2rem] border border-border bg-card p-8">
          <div className="h-64 rounded-[1.5rem] bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-screen max-h-screen w-full max-w-3xl items-center overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex h-[80vh] min-h-0 w-full flex-col overflow-hidden rounded-[2rem] border border-border bg-card p-6 sm:p-8">
        {currentStep > 0 && (
          <>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Step {currentStep + 1} of {ONBOARDING_STEPS.length}
                </p>
                <h2 className="mt-3 font-heading text-3xl font-medium tracking-tight">
                  {ONBOARDING_STEPS[currentStep]!.title}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  {ONBOARDING_STEPS[currentStep]!.description}
                </p>
              </div>
              <Button
                variant="link"
                className="h-auto p-0 text-muted-foreground"
                onClick={handleReset}
              >
                Reset
              </Button>
            </div>

            <div className="mt-6 flex gap-2">
              {ONBOARDING_STEPS.slice(1).map((step, index) => {
                const stepNumber = index + 1

                return (
                  <div
                    key={step.title}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors",
                      stepNumber === currentStep
                        ? "bg-primary"
                        : stepNumber < currentStep
                          ? "bg-primary/45"
                          : "bg-muted"
                    )}
                  />
                )
              })}
            </div>
          </>
        )}

        <div
          className={cn(
            "min-h-0 flex-1 overflow-hidden px-1 py-1",
            currentStep > 0 ? "mt-8" : "mt-0"
          )}
        >
          {currentStep === 0 && <StepWelcome />}
          {currentStep === 1 && (
            <StepWebsite
              data={data}
              updateField={updateField}
              errors={fieldErrors}
            />
          )}
          {currentStep === 2 && (
            <StepCompetitors
              data={data}
              updateField={updateField}
              error={fieldErrors.competitors}
            />
          )}
          {currentStep === 3 && (
            <StepOpportunityTypes
              data={data}
              updateField={updateField}
              error={fieldErrors.opportunityTypes}
            />
          )}
          {currentStep === 4 && (
            <StepDiscovery
              data={data}
              updateField={updateField}
              error={fieldErrors.discoverySource}
            />
          )}
          {currentStep === 5 && <StepReview data={data} />}
        </div>

        {submitMessage && (
          <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            {submitMessage}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Progress is saved in this browser.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            {currentStep < ONBOARDING_STEPS.length - 1 ? (
              <Button onClick={nextStep}>Continue</Button>
            ) : (
              <Button onClick={handleSubmit}>Complete setup</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StepWelcome() {
  return (
    <div className="flex h-full flex-col justify-center text-center">
      <div className="mx-auto max-w-xl">
        <h3 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Mentiohunt
        </h3>
        <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
          Find backlink opportunities worth acting on, understand why they fit,
          and move into outreach with less manual research.
        </p>
      </div>

      <div className="mx-auto mt-10 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
        <SimpleBenefitCard
          title="Qualified opportunities"
          description="See the pages that deserve attention this week."
        />
        <SimpleBenefitCard
          title="Clear reasoning"
          description="Know why each site is relevant before you pitch."
        />
        <SimpleBenefitCard
          title="Faster outreach"
          description="Move from discovery to action without the usual busywork."
        />
      </div>
    </div>
  )
}

function SimpleBenefitCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-[linear-gradient(180deg,#f3f7ff_0%,#ffffff_100%)] p-4 text-left">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
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
  return (
    <div className="h-full overflow-y-auto px-1 pr-2">
      <div className="space-y-6 pb-2">
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Website URL
          </label>
          <Input
            placeholder="https://yourwebsite.com"
            value={data.websiteUrl}
            aria-invalid={Boolean(errors.websiteUrl)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateField("websiteUrl", e.target.value)
            }
            className="h-11 rounded-full border border-border bg-background px-4"
          />
          {errors.websiteUrl && (
            <p className="text-sm text-destructive">{errors.websiteUrl}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Product description
          </label>
          <textarea
            className={cn(
              "min-h-[160px] w-full rounded-[1.5rem] border bg-background px-4 py-3 text-sm leading-6 transition-[color,box-shadow,border-color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
              errors.productDescription ? "border-destructive" : "border-border"
            )}
            placeholder="Describe what your product does, who it helps, and what makes it useful."
            value={data.productDescription}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              updateField("productDescription", e.target.value)
            }
          />
          <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>Short, concrete copy works best.</span>
            <span>{data.productDescription.trim().length}/280</span>
          </div>
          {errors.productDescription && (
            <p className="text-sm text-destructive">
              {errors.productDescription}
            </p>
          )}
        </div>
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
      data.competitors.filter((competitor) => competitor !== url)
    )
  }

  return (
    <div className="h-full overflow-y-auto px-1 pr-2">
      <div className="space-y-6 pb-2">
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Competitor URLs
          </label>
          <CompetitorInput
            onAdd={addCompetitor}
            disabled={data.competitors.length >= 10}
          />
          <p className="text-sm text-muted-foreground">
            Add 3 to 10 competitor sites to improve opportunity matching.
          </p>
          {draftError && (
            <p className="text-sm text-destructive">{draftError}</p>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {data.competitors.length} / 10 competitors added
          </p>
          <div className="space-y-3">
            {data.competitors.map((url) => (
              <div
                key={url}
                className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-border bg-background px-4 py-3"
              >
                <span className="truncate text-sm text-foreground">{url}</span>
                <button
                  className="text-sm text-muted-foreground transition-colors hover:text-destructive"
                  onClick={() => removeCompetitor(url)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
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
    <div className="flex flex-col gap-3 sm:flex-row">
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
          if (!value.trim()) {
            return
          }

          onAdd(value.trim())
          setValue("")
        }}
        disabled={disabled || !value.trim()}
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
    if (isSelected) {
      updateField(
        "opportunityTypes",
        data.opportunityTypes.filter((type) => type !== id)
      )
    } else {
      updateField("opportunityTypes", [...data.opportunityTypes, id])
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden px-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-card to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-card to-transparent" />

        <div className="h-full space-y-3 overflow-y-auto px-1 pr-2 pb-10">
          {OPPORTUNITY_TYPES.map((type) => (
            <button
              key={type.id}
              className={cn(
                "flex w-full items-start gap-4 rounded-[1.5rem] border p-4 text-left transition-colors hover:bg-muted/40",
                data.opportunityTypes.includes(type.id)
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background"
              )}
              onClick={() => toggleOpportunityType(type.id)}
              type="button"
            >
              <div
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  data.opportunityTypes.includes(type.id)
                    ? "border-primary bg-primary"
                    : "border-border"
                )}
              >
                {data.opportunityTypes.includes(type.id) && (
                  <svg
                    className="h-3.5 w-3.5 text-primary-foreground"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {type.label}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {type.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  )
}

function StepDiscovery({
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
  return (
    <div className="h-full overflow-y-auto px-1 pr-2">
      <div className="space-y-3 pb-2">
        {DISCOVERY_SOURCES.map((source) => (
          <button
            key={source.id}
            className={cn(
              "w-full rounded-[1.5rem] border p-4 text-left transition-colors hover:bg-muted/40",
              data.discoverySource === source.id
                ? "border-primary bg-primary/5"
                : "border-border bg-background"
            )}
            onClick={() => updateField("discoverySource", source.id)}
            type="button"
          >
            <p className="text-sm font-medium text-foreground">
              {source.label}
            </p>
          </button>
        ))}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  )
}

function StepReview({ data }: { data: OnboardingData }) {
  return (
    <div className="h-full overflow-y-auto px-1 pr-2">
      <div className="space-y-5 pb-2">
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Website
          </p>
          <p className="rounded-[1.5rem] border border-border bg-background px-4 py-3 text-sm">
            {data.websiteUrl}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Description
          </p>
          <p className="rounded-[1.5rem] border border-border bg-background px-4 py-3 text-sm leading-6">
            {data.productDescription}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Competitors ({data.competitors.length})
          </p>
          <div className="rounded-[1.5rem] border border-border bg-background px-4 py-3">
            <ul className="list-inside list-disc space-y-1">
              {data.competitors.map((url) => (
                <li key={url} className="truncate text-sm">
                  {url}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Opportunity types
          </p>
          <div className="flex flex-wrap gap-2">
            {OPPORTUNITY_TYPES.filter((t) =>
              data.opportunityTypes.includes(t.id)
            ).map((type) => (
              <span
                key={type.id}
                className="rounded-full border border-border bg-muted/40 px-3 py-1 text-sm text-foreground"
              >
                {type.label}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Found us through
          </p>
          <p className="rounded-[1.5rem] border border-border bg-background px-4 py-3 text-sm">
            {
              DISCOVERY_SOURCES.find((s) => s.id === data.discoverySource)
                ?.label
            }
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-[linear-gradient(180deg,#f3f7ff_0%,#ffffff_100%)] p-4">
          <p className="text-sm font-medium text-foreground">
            Ready for the first queue
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Once the backend is connected, these answers can drive weekly
            discovery jobs, fit reasoning, and outreach preparation.
          </p>
        </div>
      </div>
    </div>
  )
}
