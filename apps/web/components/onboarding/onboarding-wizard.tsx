"use client"

import { captureEvent } from "@/lib/analytics"
import { supabaseClient } from "@/lib/supabase/client"
import { useOnboardingStore } from "@/stores/onboarding-store"
import {
  IconArrowLeft,
  IconArrowRight,
  IconFiles,
  IconLoader2,
  IconPackage,
  IconSearch,
  IconSwords,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { requestOnboardingPreview } from "@/actions/request-onboarding-preview"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"
import { StepKeywords } from "@/components/onboarding/step-keywords"
import { StepCompetitors } from "@/components/onboarding/step-competitors"
import { StepImportantPages } from "@/components/onboarding/step-important-pages"
import { StepProduct } from "@/components/onboarding/step-product"
import { StepUrl } from "@/components/onboarding/step-url"
import {
  DEFAULT_OPPORTUNITY_TYPES,
  INITIAL_ONBOARDING_DATA,
  ONBOARDING_STEPS,
  competitorsStepSchema,
  keywordsStepSchema,
  normalizeKeyword,
  normalizeCompetitorUrl,
  normalizeUrl,
  onboardingSchema,
  productDescriptionStepSchema,
  validateImportantPages,
  type OnboardingData,
  type OnboardingField,
  type OnboardingFieldErrors,
} from "@/consts/onboarding"
import type { FetchedSiteDetails } from "@/lib/onboarding/fetch-site"

type LoadingField =
  | "productName"
  | "productDescription"
  | "competitors"
  | "targetKeywords"

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
    competitors: data.competitors.map(
      (competitor) =>
        normalizeCompetitorUrl(competitor) || normalizeUrl(competitor)
    ),
    targetKeywords: data.targetKeywords.map(normalizeKeyword).filter(Boolean),
    importantPages: data.importantPages.map(normalizeUrl),
  }
}

export function OnboardingWizard({
  userName,
  emailConfirmed,
}: {
  userName?: string | null
  emailConfirmed?: boolean
}) {
  const router = useRouter()
  const { hasHydrated, currentStep, data, setCurrentStep, updateData } =
    useOnboardingStore()

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
  const [loadingFields, setLoadingFields] = useState<Set<LoadingField>>(
    new Set()
  )

  const safeData = normalizeOnboardingData(data)
  const lastStepIndex = ONBOARDING_STEPS.length - 1
  // Older persisted wizard state may still point at the removed sixth screen.
  // Render the final setup step immediately while syncing storage back to it.
  const activeStep = Math.min(currentStep, lastStepIndex)

  useEffect(() => {
    if (currentStep > lastStepIndex) setCurrentStep(lastStepIndex)
  }, [currentStep, lastStepIndex, setCurrentStep])

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

  const markGenerationFailure = (field: LoadingField, message: string) => {
    setFieldErrors((current) => ({
      ...current,
      [field]: current[field] ?? message,
    }))
    captureEvent("onboarding_failed", { field })
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
        body: JSON.stringify({
          site,
          websiteUrl,
          productName,
          productDescription,
        }),
      })
      const json = (await res.json().catch(() => null)) as {
        competitors?: string[]
        error?: string
      } | null

      if (!res.ok || !json?.competitors) {
        markGenerationFailure(
          "competitors",
          json?.error ?? "We couldn't generate competitors. Add them manually."
        )
        return
      }

      updateData({ competitors: json.competitors })
      captureEvent("onboarding_ai_generated", { field: "competitors" })
    } catch {
      markGenerationFailure(
        "competitors",
        "We couldn't generate competitors. Add them manually."
      )
    } finally {
      clearLoadingFields("competitors")
    }
  }

  const generateKeywords = async (
    site: FetchedSiteDetails,
    websiteUrl: string,
    productName: string,
    productDescription: string
  ) => {
    try {
      const res = await fetch("/api/onboarding/generate/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site,
          websiteUrl,
          productName,
          productDescription,
        }),
      })
      const json = (await res.json().catch(() => null)) as {
        keywords?: string[]
        error?: string
      } | null

      if (!res.ok || !json?.keywords) {
        markGenerationFailure(
          "targetKeywords",
          json?.error ?? "We couldn't generate keywords. Add them manually."
        )
        return
      }

      updateData({ targetKeywords: json.keywords })
      captureEvent("onboarding_ai_generated", { field: "targetKeywords" })
    } catch {
      markGenerationFailure(
        "targetKeywords",
        "We couldn't generate keywords. Add them manually."
      )
    } finally {
      clearLoadingFields("targetKeywords")
    }
  }

  const generateProduct = async (
    site: FetchedSiteDetails,
    websiteUrl: string
  ) => {
    let productName = ""
    let productDescription = ""
    try {
      const res = await fetch("/api/onboarding/generate/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site }),
      })
      const json = (await res.json().catch(() => null)) as {
        productName?: string
        productDescription?: string
        error?: string
      } | null

      if (!res.ok || !json?.productName || !json.productDescription) {
        markGenerationFailure(
          "productName",
          json?.error ??
            "We couldn't draft your product details. Add them manually."
        )
        return
      }

      productName = json.productName
      productDescription = json.productDescription
      updateData({ productName, productDescription })
      captureEvent("onboarding_ai_generated", { field: "product" })
    } catch {
      markGenerationFailure(
        "productName",
        "We couldn't draft your product details. Add them manually."
      )
    } finally {
      clearLoadingFields("productName", "productDescription")
      void generateCompetitors(
        site,
        websiteUrl,
        productName,
        productDescription
      )
      void generateKeywords(site, websiteUrl, productName, productDescription)
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
          websiteUrl:
            (json as { error?: string }).error ?? "Failed to reach your site.",
        })
        return
      }

      const fetchedSite = (json as { site: FetchedSiteDetails }).site
      const websiteUrl = (json as { websiteUrl: string }).websiteUrl
      captureEvent("onboarding_site_fetched", {})

      updateData({ websiteUrl })
      setIsFetchingSite(false)
      setLoadingFields(
        new Set<LoadingField>([
          "productName",
          "productDescription",
          "competitors",
          "targetKeywords",
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
      const productResult =
        productDescriptionStepSchema.safeParse(normalizedData)
      if (!productResult.success) {
        const issue = productResult.error.issues[0]
        const field = issue?.path[0] as OnboardingField | undefined
        if (field && issue) nextErrors[field] = issue.message
      }
    }

    if (step === 2) {
      const competitorsResult = competitorsStepSchema.safeParse(normalizedData)
      if (!competitorsResult.success) {
        const issue = competitorsResult.error.issues[0]
        const field = issue?.path[0] as OnboardingField | undefined
        if (field && issue) nextErrors[field] = issue.message
      }
    }

    if (step === 3) {
      const keywordsResult = keywordsStepSchema.safeParse(normalizedData)
      if (!keywordsResult.success) {
        const issue = keywordsResult.error.issues[0]
        const field = issue?.path[0] as OnboardingField | undefined
        if (field && issue) nextErrors[field] = issue.message
      }
    }

    if (step === 4) {
      const message = validateImportantPages(normalizedData)
      if (message) nextErrors.importantPages = message
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
    if (!validateStep(activeStep)) return
    const stepNames = [
      "url",
      "product",
      "competitors",
      "keywords",
      "pages",
    ] as const
    captureEvent("onboarding_step_completed", {
      step: stepNames[activeStep] ?? String(activeStep),
      step_index: activeStep,
    })
    setCurrentStep(Math.min(activeStep + 1, lastStepIndex))
    setSubmitMessage("")
  }

  const prevStep = () => {
    setCurrentStep(Math.max(activeStep - 1, 0))
    setSubmitMessage("")
    setFieldErrors({})
  }

  const handleRequestPreview = async () => {
    if (isSubmitting) return
    if (!validateStep(activeStep)) return

    const normalizedData = normalizeSubmissionData(safeData)
    const result = onboardingSchema.safeParse(normalizedData)

    if (!result.success) {
      const firstIssue = result.error.issues[0]
      const field = firstIssue?.path[0] as OnboardingField | undefined
      if (field && firstIssue) setFieldErrors({ [field]: firstIssue.message })
      setCurrentStep(1)
      setSubmitMessage(
        "Review the highlighted setup before requesting your preview."
      )
      return
    }

    updateData(result.data)
    setFieldErrors({})
    setIsSubmitting(true)

    captureEvent("onboarding_setup_saved", {
      competitors_count: result.data.competitors?.length ?? 0,
      keywords_count: result.data.targetKeywords?.length ?? 0,
    })

    try {
      const preview = await requestOnboardingPreview(result.data)
      if (!preview.ok) {
        setSubmitMessage(preview.message)
        setIsSubmitting(false)
        return
      }
      captureEvent("onboarding_step_completed", {
        step: "pages",
        step_index: activeStep,
      })
      router.push("/onboarding/preview")
    } catch {
      setSubmitMessage(
        "Something went wrong requesting your preview. Please try again."
      )
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

  const isUrlStep = activeStep === 0
  const isFinalStep = activeStep === lastStepIndex

  const stepIcons = [null, IconPackage, IconSwords, IconSearch, IconFiles]
  const StepIcon = stepIcons[activeStep] ?? null

  return (
    <OnboardingShell
      stepIndex={activeStep}
      lastStepIndex={lastStepIndex}
      isSigningOut={isSigningOut}
      onSignOut={() => void handleSignOut()}
    >
      {isUrlStep ? (
        <StepUrl
          userName={userName}
          data={safeData}
          errors={fieldErrors}
          submitMessage={submitMessage}
          isFetching={isFetchingSite}
          onUrlChange={(value) => updateField("websiteUrl", value)}
          onNameChange={(value) => updateField("userName", value)}
          onSubmit={() => void startGeneration()}
        />
      ) : (
        <div>
          <div className="flex items-center gap-3 pt-2">
            {StepIcon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <StepIcon className="h-5 w-5" strokeWidth={1.75} />
              </div>
            )}
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {ONBOARDING_STEPS[activeStep]!.title}
            </h2>
          </div>
          <p className="mt-2 text-base leading-7 text-muted-foreground">
            {ONBOARDING_STEPS[activeStep]!.description}
          </p>

          <div className="mt-8 space-y-6">
            {activeStep === 1 && (
              <StepProduct
                data={safeData}
                errors={fieldErrors}
                loadingFields={loadingFields}
                updateField={updateField}
              />
            )}
            {activeStep === 2 && (
              <StepCompetitors
                data={safeData}
                errors={fieldErrors}
                loadingFields={loadingFields}
                updateField={updateField}
              />
            )}
            {activeStep === 3 && (
              <StepKeywords
                data={safeData}
                errors={fieldErrors}
                loadingFields={loadingFields}
                updateField={updateField}
              />
            )}
            {activeStep === 4 && (
              <StepImportantPages
                data={safeData}
                errors={fieldErrors}
                updateField={updateField}
              />
            )}
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

            {isFinalStep ? (
              <Button
                onClick={() => void handleRequestPreview()}
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
                    Saving setup...
                  </>
                ) : (
                  "Find my opportunities"
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
      )}
    </OnboardingShell>
  )
}
