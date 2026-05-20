"use client"

import { captureEvent } from "@/lib/analytics"
import { supabaseClient } from "@/lib/supabase/client"
import { useOnboardingStore } from "@/stores/onboarding-store"
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconLoader2,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { type ChecklistTask } from "@/components/onboarding/generating-checklist"
import { StepAudience } from "@/components/onboarding/step-audience"
import { StepLaunch } from "@/components/onboarding/step-launch"
import { StepProduct } from "@/components/onboarding/step-product"
import { StepUrl, type GeneratingPhase } from "@/components/onboarding/step-url"
import {
  DEFAULT_MONITORING_PLATFORMS,
  DEFAULT_OPPORTUNITY_TYPES,
  INITIAL_ONBOARDING_DATA,
  ONBOARDING_STEPS,
  competitorsStepSchema,
  monitoringStepSchema,
  normalizeUrl,
  onboardingSchema,
  productDescriptionStepSchema,
  type MonitoringCommunity,
  type OnboardingData,
  type OnboardingField,
  type OnboardingFieldErrors,
} from "@/consts/onboarding"
import type { FetchedSiteDetails } from "@/lib/onboarding/fetch-site"

function normalizeOnboardingData(data: OnboardingData): OnboardingData {
  return {
    ...INITIAL_ONBOARDING_DATA,
    ...data,
    opportunityTypes:
      data.opportunityTypes?.length > 0
        ? data.opportunityTypes
        : DEFAULT_OPPORTUNITY_TYPES,
    monitoringPlatforms:
      data.monitoringPlatforms?.length > 0
        ? data.monitoringPlatforms
        : [...DEFAULT_MONITORING_PLATFORMS],
    emailAlertsEnabled: data.emailAlertsEnabled ?? true,
  }
}

function normalizeSubmissionData(data: OnboardingData): OnboardingData {
  return {
    ...normalizeOnboardingData(data),
    websiteUrl: normalizeUrl(data.websiteUrl),
    productName: data.productName.trim(),
    productDescription: data.productDescription.trim(),
    competitors: data.competitors.map(normalizeUrl),
    monitoringKeywords: data.monitoringKeywords.map((k) => k.trim()),
    monitoringCommunities: data.monitoringCommunities.map((c) => ({
      platform: "reddit",
      community: c.community
        .trim()
        .replace(/^\/?r\//i, "")
        .replace(/^\/+/, "")
        .trim(),
    })),
  }
}

const INITIAL_CHECKLIST: ChecklistTask[] = [
  { id: "site", label: "Reading your site", status: "pending" },
  { id: "product", label: "Drafting product profile", status: "pending" },
  { id: "competitors", label: "Finding competitors", status: "pending" },
  {
    id: "audience",
    label: "Picking communities & keywords",
    status: "pending",
  },
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

  useEffect(() => {
    captureEvent("onboarding_started")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [fieldErrors, setFieldErrors] = useState<OnboardingFieldErrors>({})
  const [submitMessage, setSubmitMessage] = useState("")
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [generatingPhase, setGeneratingPhase] =
    useState<GeneratingPhase>("idle")
  const [checklist, setChecklist] = useState<ChecklistTask[]>(INITIAL_CHECKLIST)
  const [siteCache, setSiteCache] = useState<FetchedSiteDetails | null>(null)
  const [cachedWebsiteUrl, setCachedWebsiteUrl] = useState<string>("")
  const generatingRef = useRef(false)

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

  const setTaskStatus = (
    id: string,
    status: ChecklistTask["status"],
    error?: string
  ) => {
    setChecklist((prev) =>
      prev.map((task) => (task.id === id ? { ...task, status, error } : task))
    )
  }

  const runGeneration = async (
    websiteUrl: string,
    site: FetchedSiteDetails
  ) => {
    if (generatingRef.current) return
    generatingRef.current = true

    setSiteCache(site)
    setCachedWebsiteUrl(websiteUrl)
    setGeneratingPhase("generating")

    setChecklist((prev) =>
      prev.map((task) =>
        task.id === "site"
          ? { ...task, status: "done" }
          : task.id === "product" ||
              task.id === "competitors" ||
              task.id === "audience"
            ? { ...task, status: "loading" }
            : task
      )
    )

    type ProductResult = { productName: string; productDescription: string }
    type CompetitorsResult = { competitors: string[] }
    type AudienceResult = {
      monitoringKeywords: string[]
      monitoringCommunities: MonitoringCommunity[]
    }

    async function callGenerate<T>(
      url: string,
      body: Record<string, unknown>,
      taskId: string
    ): Promise<T | null> {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const json = await res.json()
        if (!res.ok)
          throw new Error((json as { error?: string }).error ?? "Failed.")
        setTaskStatus(taskId, "done")
        captureEvent("onboarding_ai_generated", { field: taskId })
        return json as T
      } catch (err) {
        setTaskStatus(
          taskId,
          "error",
          err instanceof Error ? err.message : "Failed."
        )
        return null
      }
    }

    const [productResult, competitorsResult, audienceResult] =
      await Promise.all([
        callGenerate<ProductResult>(
          "/api/onboarding/generate/product",
          { site },
          "product"
        ),
        callGenerate<CompetitorsResult>(
          "/api/onboarding/generate/competitors",
          { site, websiteUrl },
          "competitors"
        ),
        callGenerate<AudienceResult>(
          "/api/onboarding/generate/audience",
          { site },
          "audience"
        ),
      ])

    generatingRef.current = false

    if (!productResult || !competitorsResult || !audienceResult) {
      setGeneratingPhase("error")
      return
    }

    updateData({
      websiteUrl,
      productName: productResult.productName,
      productDescription: productResult.productDescription,
      competitors: competitorsResult.competitors,
      opportunityTypes: DEFAULT_OPPORTUNITY_TYPES,
      monitoringPlatforms: [...DEFAULT_MONITORING_PLATFORMS],
      monitoringKeywords: audienceResult.monitoringKeywords,
      monitoringCommunities: audienceResult.monitoringCommunities,
      emailAlertsEnabled: true,
    })

    setGeneratingPhase("done")
    setCurrentStep(1)
  }

  const retryTask = async (id: string) => {
    if (!siteCache || !cachedWebsiteUrl) return

    setTaskStatus(id, "loading")

    if (id === "product") {
      try {
        const res = await fetch("/api/onboarding/generate/product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ site: siteCache }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? "Failed.")
        updateData({
          productName: json.productName,
          productDescription: json.productDescription,
        })
        setTaskStatus("product", "done")
      } catch (err) {
        setTaskStatus(
          "product",
          "error",
          err instanceof Error ? err.message : "Failed."
        )
        return
      }
    }

    if (id === "competitors") {
      try {
        const res = await fetch("/api/onboarding/generate/competitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            site: siteCache,
            websiteUrl: cachedWebsiteUrl,
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? "Failed.")
        updateData({ competitors: json.competitors })
        setTaskStatus("competitors", "done")
      } catch (err) {
        setTaskStatus(
          "competitors",
          "error",
          err instanceof Error ? err.message : "Failed."
        )
        return
      }
    }

    if (id === "audience") {
      try {
        const res = await fetch("/api/onboarding/generate/audience", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ site: siteCache }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? "Failed.")
        updateData({
          monitoringKeywords: json.monitoringKeywords,
          monitoringCommunities: json.monitoringCommunities,
        })
        setTaskStatus("audience", "done")
      } catch (err) {
        setTaskStatus(
          "audience",
          "error",
          err instanceof Error ? err.message : "Failed."
        )
        return
      }
    }

    const allDone = checklist.every((task) =>
      task.id === id ? true : task.status === "done"
    )
    if (allDone) {
      setGeneratingPhase("done")
      setCurrentStep(1)
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

    setGeneratingPhase("fetching-site")
    setFieldErrors({})
    setSubmitMessage("")
    setChecklist(
      INITIAL_CHECKLIST.map((t) =>
        t.id === "site" ? { ...t, status: "loading" } : t
      )
    )

    try {
      const res = await fetch("/api/onboarding/fetch-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: normalizedUrl }),
      })
      const json = await res.json()
      if (!res.ok) {
        setGeneratingPhase("idle")
        setChecklist(INITIAL_CHECKLIST)
        setFieldErrors({
          websiteUrl: json.error ?? "Failed to reach your site.",
        })
        return
      }
      const fetchedSite = json.site as FetchedSiteDetails
      captureEvent("onboarding_site_fetched", {
        had_sitemap: Boolean((fetchedSite as { sitemap?: unknown }).sitemap),
      })
      await runGeneration(json.websiteUrl as string, fetchedSite)
    } catch {
      setGeneratingPhase("idle")
      setChecklist(INITIAL_CHECKLIST)
      setSubmitMessage("Failed to reach the server. Check your connection.")
    }
  }

  const validateStep = (step: number): boolean => {
    const normalizedData = normalizeSubmissionData(safeData)
    const nextErrors: OnboardingFieldErrors = {}

    if (step === 1) {
      const productResult =
        productDescriptionStepSchema.safeParse(normalizedData)
      const competitorsResult = competitorsStepSchema.safeParse(normalizedData)
      for (const result of [productResult, competitorsResult]) {
        if (result.success) continue
        const issue = result.error.issues[0]
        const field = issue?.path[0] as OnboardingField | undefined
        if (field && issue && !nextErrors[field])
          nextErrors[field] = issue.message
      }
    }

    if (step === 2) {
      const monitoringResult = monitoringStepSchema.safeParse(normalizedData)
      if (!monitoringResult.success) {
        const issue = monitoringResult.error.issues[0]
        const field = issue?.path[0] as OnboardingField | undefined
        if (field && issue) nextErrors[field] = issue.message
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
    const stepNames = ["url", "product", "audience", "launch"] as const
    captureEvent("onboarding_step_completed", {
      step: stepNames[currentStep] ?? String(currentStep),
      step_index: currentStep,
    })
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
      setCurrentStep(1)
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
      router.replace("/dashboard")
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

  const isGenerating =
    generatingPhase === "fetching-site" || generatingPhase === "generating"

  if (currentStep === 0 || isGenerating || generatingPhase === "error") {
    return (
      <StepUrl
        userName={userName}
        data={safeData}
        errors={fieldErrors}
        submitMessage={submitMessage}
        generatingPhase={generatingPhase}
        checklist={checklist}
        isSigningOut={isSigningOut}
        onUrlChange={(value) => updateField("websiteUrl", value)}
        onSubmit={() => void startGeneration()}
        onSignOut={() => void handleSignOut()}
        onRetry={retryTask}
        onRetryAll={() => {
          if (!siteCache) return
          void runGeneration(cachedWebsiteUrl, siteCache)
        }}
      />
    )
  }

  const lastStepIndex = ONBOARDING_STEPS.length - 1
  const isLastStep = currentStep === lastStepIndex

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
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {ONBOARDING_STEPS[currentStep]!.title}
          </h2>
          <p className="mt-2 text-base leading-7 text-muted-foreground">
            {ONBOARDING_STEPS[currentStep]!.description}
          </p>

          <div className="mt-8 space-y-6">
            {currentStep === 1 && (
              <StepProduct
                data={safeData}
                errors={fieldErrors}
                updateField={updateField}
              />
            )}
            {currentStep === 2 && (
              <StepAudience
                data={safeData}
                errors={fieldErrors}
                updateField={updateField}
              />
            )}
            {currentStep === 3 && <StepLaunch data={safeData} />}
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
                  Start Distributing
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
