"use client"

import { captureEvent } from "@/lib/analytics"
import { supabaseClient } from "@/lib/supabase/client"
import { useOnboardingStore } from "@/stores/onboarding-store"
import {
  IconArrowLeft,
  IconArrowRight,
  IconBuilding,
  IconCheck,
  IconFiles,
  IconLoader2,
  IconPackage,
  IconRocket,
  IconSwords,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { StepCompany } from "@/components/onboarding/step-company"
import { StepResources } from "@/components/onboarding/step-resources"
import { StepCompetitors } from "@/components/onboarding/step-competitors"
import { StepLaunch } from "@/components/onboarding/step-launch"
import { StepProduct } from "@/components/onboarding/step-product"
import { StepUrl } from "@/components/onboarding/step-url"
import {
  DEFAULT_OPPORTUNITY_TYPES,
  INITIAL_ONBOARDING_DATA,
  ONBOARDING_STEPS,
  competitorsStepSchema,
  companyStepSchema,
  normalizeUrl,
  onboardingSchema,
  productDescriptionStepSchema,
  type OnboardingData,
  type OnboardingField,
  type OnboardingFieldErrors,
} from "@/consts/onboarding"
import type { FetchedSiteDetails } from "@/lib/onboarding/fetch-site"

type LoadingField =
  | "productName"
  | "productDescription"
  | "competitors"

function normalizeOnboardingData(data: OnboardingData): OnboardingData {
  return {
    ...INITIAL_ONBOARDING_DATA,
    ...data,
    opportunityTypes:
      data.opportunityTypes?.length > 0
        ? data.opportunityTypes
        : DEFAULT_OPPORTUNITY_TYPES,
  }
}

function normalizeSubmissionData(data: OnboardingData): OnboardingData {
  return {
    ...normalizeOnboardingData(data),
    websiteUrl: normalizeUrl(data.websiteUrl),
    productName: data.productName.trim(),
    productDescription: data.productDescription.trim(),
    competitors: data.competitors.map(normalizeUrl),
    resourceMode: data.resourceMode,
    resourceUrls: data.resourceUrls.map((u) => normalizeUrl(u.trim())).filter(Boolean),
  }
}

export function OnboardingWizard({ userName, emailConfirmed }: { userName?: string | null; emailConfirmed?: boolean }) {
  const router = useRouter()
  const {
    hasHydrated,
    currentStep,
    data,
    setCurrentStep,
    updateData,
    setIsCompleted,
  } = useOnboardingStore()

  useEffect(() => {
    if (emailConfirmed) {
      captureEvent("email_confirmation_completed")
    }
    captureEvent("onboarding_started")
    if (userName && !data.userName) {
      updateData({ userName })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [fieldErrors, setFieldErrors] = useState<OnboardingFieldErrors>({})
  const [submitMessage, setSubmitMessage] = useState("")
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingSite, setIsFetchingSite] = useState(false)
  const [loadingFields, setLoadingFields] = useState<Set<LoadingField>>(new Set())

  const safeData = normalizeOnboardingData(data)

  useEffect(() => {
    const lastStepIndex = ONBOARDING_STEPS.length - 1
    if (currentStep > lastStepIndex) setCurrentStep(lastStepIndex)
  }, [currentStep, setCurrentStep])

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

  const clearLoadingFields = (...fields: LoadingField[]) => {
    setLoadingFields((prev) => {
      const next = new Set(prev)
      for (const f of fields) next.delete(f)
      return next
    })
  }

  const generateCompetitors = async (
    site: FetchedSiteDetails,
    websiteUrl: string,
    productName: string,
    productDescription: string
  ) => {
    try {
      const res = await fetch("/api/onboarding/generate/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site, websiteUrl, productName, productDescription }),
      })
      const json = await res.json()
      if (res.ok) {
        updateData({ competitors: (json as { competitors: string[] }).competitors })
        captureEvent("onboarding_ai_generated", { field: "competitors" })
      }
    } finally {
      clearLoadingFields("competitors")
    }
  }

  const generateProduct = async (site: FetchedSiteDetails, websiteUrl: string) => {
    let productName = ""
    let productDescription = ""
    try {
      const res = await fetch("/api/onboarding/generate/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site }),
      })
      const json = await res.json()
      if (res.ok) {
        productName = (json as { productName: string }).productName
        productDescription = (json as { productDescription: string }).productDescription
        updateData({ productName, productDescription })
        captureEvent("onboarding_ai_generated", { field: "product" })
      }
    } finally {
      clearLoadingFields("productName", "productDescription")
      void generateCompetitors(site, websiteUrl, productName, productDescription)
    }
  }

  const startGeneration = async () => {
    const normalizedUrl = normalizeUrl(safeData.websiteUrl.trim())

    if (!normalizedUrl) {
      setFieldErrors({ websiteUrl: "Enter your website URL." })
      return
    }

    try {
      new URL(normalizedUrl)
    } catch {
      setFieldErrors({ websiteUrl: "Enter a valid website URL." })
      return
    }

    setIsFetchingSite(true)
    setFieldErrors({})
    setSubmitMessage("")

    try {
      const res = await fetch("/api/onboarding/fetch-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: normalizedUrl }),
      })
      const json = await res.json()

      if (!res.ok) {
        setIsFetchingSite(false)
        setFieldErrors({
          websiteUrl: (json as { error?: string }).error ?? "Failed to reach your site.",
        })
        return
      }

      const fetchedSite = (json as { site: FetchedSiteDetails }).site
      const websiteUrl = (json as { websiteUrl: string }).websiteUrl
      captureEvent("onboarding_site_fetched", {
        had_sitemap: Boolean((fetchedSite as { sitemap?: unknown }).sitemap),
      })

      updateData({ websiteUrl })
      setIsFetchingSite(false)
      setLoadingFields(
        new Set<LoadingField>([
          "productName",
          "productDescription",
          "competitors",
        ])
      )
      setCurrentStep(1)

      void generateProduct(fetchedSite, websiteUrl)
    } catch {
      setIsFetchingSite(false)
      setSubmitMessage("Failed to reach the server. Check your connection.")
    }
  }

  const validateStep = (step: number): boolean => {
    const normalizedData = normalizeSubmissionData(safeData)
    const nextErrors: OnboardingFieldErrors = {}

    if (step === 1) {
      const companyResult = companyStepSchema.safeParse(normalizedData)
      if (!companyResult.success) {
        const issue = companyResult.error.issues[0]
        const field = issue?.path[0] as OnboardingField | undefined
        if (field && issue) nextErrors[field] = issue.message
      }
    }

    if (step === 2) {
      const productResult = productDescriptionStepSchema.safeParse(normalizedData)
      if (!productResult.success) {
        const issue = productResult.error.issues[0]
        const field = issue?.path[0] as OnboardingField | undefined
        if (field && issue) nextErrors[field] = issue.message
      }
    }

    if (step === 3) {
      const competitorsResult = competitorsStepSchema.safeParse(normalizedData)
      if (!competitorsResult.success) {
        const issue = competitorsResult.error.issues[0]
        const field = issue?.path[0] as OnboardingField | undefined
        if (field && issue) nextErrors[field] = issue.message
      }
    }

    if (step === 4) {
      if (safeData.resourceMode === "sitemap") {
        const url = normalizedData.resourceUrls[0] ?? ""
        if (!url) {
          nextErrors.resourceUrls = "Add your sitemap URL."
        } else {
          try { new URL(url) } catch {
            nextErrors.resourceUrls = "Enter a valid sitemap URL."
          }
        }
      } else {
        const count = normalizedData.resourceUrls.length
        if (count < 5) {
          const remaining = 5 - count
          nextErrors.resourceUrls = `Add ${remaining} more page URL${remaining === 1 ? "" : "s"}.`
        }
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      return false
    }

    updateData(normalizedData)
    setFieldErrors({})
    return true
  }

  const nextStep = () => {
    if (!validateStep(currentStep)) return
    const stepNames = ["url", "company", "product", "competitors", "audience", "launch"] as const
    captureEvent("onboarding_step_completed", {
      step: stepNames[currentStep] ?? String(currentStep),
      step_index: currentStep,
    })
    if (currentStep === 1) {
      captureEvent("onboarding_company_submitted", {
        company_size: safeData.companySize,
        role: safeData.role,
      })
    }
    setCurrentStep(Math.min(currentStep + 1, ONBOARDING_STEPS.length - 1))
    setSubmitMessage("")
  }

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 0))
    setSubmitMessage("")
    setFieldErrors({})
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    const normalizedData = normalizeSubmissionData(safeData)
    const result = onboardingSchema.safeParse(normalizedData)

    if (!result.success) {
      const firstIssue = result.error.issues[0]
      const field = firstIssue?.path[0] as OnboardingField | undefined
      if (field && firstIssue) setFieldErrors({ [field]: firstIssue.message })
      setCurrentStep(2)
      setSubmitMessage("Review the highlighted setup before launching.")
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
        setIsSubmitting(false)
        return
      }

      captureEvent("onboarding_completed", {
        competitors_count: result.data.competitors?.length ?? 0,
      })
      setIsCompleted(true)
      router.replace("/dashboard/opportunities")
      router.refresh()
    } catch {
      setSubmitMessage("Failed to reach the server. Check your connection.")
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    captureEvent("user_signed_out")
    const supabase = supabaseClient()
    await supabase.auth.signOut()
    router.replace("/signin")
    router.refresh()
  }

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center px-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    )
  }

  if (currentStep === 0) {
    return (
      <StepUrl
        userName={userName}
        data={safeData}
        errors={fieldErrors}
        submitMessage={submitMessage}
        isFetching={isFetchingSite}
        isSigningOut={isSigningOut}
        onUrlChange={(value) => updateField("websiteUrl", value)}
        onNameChange={(value) => updateField("userName", value)}
        onSubmit={() => void startGeneration()}
        onSignOut={() => void handleSignOut()}
      />
    )
  }

  const lastStepIndex = ONBOARDING_STEPS.length - 1
  const isLastStep = currentStep === lastStepIndex

  const stepIcons = [null, IconBuilding, IconPackage, IconSwords, IconFiles, IconRocket]
  const StepIcon = stepIcons[currentStep] ?? null

  return (
    <div className="flex min-h-screen w-full flex-col items-center px-4 py-16 sm:px-6">
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={isSigningOut}
        className="fixed top-5 right-5 z-20 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 sm:top-6 sm:right-6"
      >
        {isSigningOut ? "Signing out..." : "Sign out"}
      </button>

      <div className="w-full max-w-xl">
        <div className="mb-2 text-xs text-muted-foreground">
          Step {currentStep} of {lastStepIndex}
        </div>
        <div className="mb-8 h-1 w-full rounded-full bg-border">
          <div
            className="h-1 rounded-full bg-primary transition-all duration-500"
            style={{ width: `${(currentStep / lastStepIndex) * 100}%` }}
          />
        </div>

        <div
          key={currentStep}
          className="animate-in duration-200 fade-in slide-in-from-bottom-2"
        >
          <div className="flex items-center gap-3 pt-2">
            {StepIcon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <StepIcon className="h-5 w-5" strokeWidth={1.75} />
              </div>
            )}
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {ONBOARDING_STEPS[currentStep]!.title}
            </h2>
          </div>
          <p className="mt-2 text-base leading-7 text-muted-foreground">
            {ONBOARDING_STEPS[currentStep]!.description}
          </p>

          <div className="mt-8 space-y-6">
            {currentStep === 1 && (
              <StepCompany
                data={safeData}
                errors={fieldErrors}
                updateField={updateField}
              />
            )}
            {currentStep === 2 && (
              <StepProduct
                data={safeData}
                errors={fieldErrors}
                loadingFields={loadingFields}
                updateField={updateField}
              />
            )}
            {currentStep === 3 && (
              <StepCompetitors
                data={safeData}
                errors={fieldErrors}
                loadingFields={loadingFields}
                updateField={updateField}
              />
            )}
            {currentStep === 4 && (
              <StepResources
                data={safeData}
                errors={fieldErrors}
                updateField={updateField}
              />
            )}
            {currentStep === 5 && <StepLaunch data={safeData} />}
          </div>
        </div>

        {submitMessage && (
          <div className="mt-6 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            {submitMessage}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={prevStep}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          {isLastStep ? (
            <Button
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="gap-2 rounded-full px-8 font-medium text-white"
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
                  Find Opportunities
                  <IconCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              className="gap-2 rounded-full px-8 font-medium"
            >
              Continue
              <IconArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
