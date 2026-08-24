"use client"

import { KeywordPriorityList } from "@/components/keywords/keyword-priority-list"
import { OnboardingLoadingField } from "@/components/onboarding/onboarding-loading-field"
import {
  MAX_TARGET_KEYWORDS,
  MIN_TARGET_KEYWORDS,
  normalizeKeyword,
  type OnboardingData,
  type OnboardingField,
  type OnboardingFieldErrors,
} from "@/consts/onboarding"

export function StepKeywords({
  data,
  errors,
  loadingFields,
  updateField,
}: {
  data: OnboardingData
  errors: OnboardingFieldErrors
  loadingFields: Set<string>
  updateField: <Key extends OnboardingField>(
    field: Key,
    value: OnboardingData[Key]
  ) => void
}) {
  const isLoading = loadingFields.has("targetKeywords")

  function addKeyword(keyword: string): string | null {
    const normalized = normalizeKeyword(keyword)
    if (!normalized) return null

    if (data.targetKeywords.length >= MAX_TARGET_KEYWORDS) {
      return `You can rank up to ${MAX_TARGET_KEYWORDS} keywords.`
    }
    if (data.targetKeywords.some((k) => k.toLowerCase() === normalized.toLowerCase())) {
      return "Already added."
    }

    updateField("targetKeywords", [...data.targetKeywords, normalized])
    return null
  }

  function removeKeyword(keyword: string): string | null {
    if (data.targetKeywords.length <= MIN_TARGET_KEYWORDS) {
      return `Keep at least ${MIN_TARGET_KEYWORDS} target keywords.`
    }

    updateField(
      "targetKeywords",
      data.targetKeywords.filter((k) => k !== keyword)
    )
    return null
  }

  function reorderKeywords(keywords: string[]) {
    updateField("targetKeywords", keywords)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-[0.7rem] font-bold text-muted-foreground uppercase">
            Target keywords
          </label>
          <span className="text-xs text-muted-foreground">
            {data.targetKeywords.length} / {MAX_TARGET_KEYWORDS}
          </span>
        </div>
        {isLoading ? (
          <OnboardingLoadingField message="Finding your target keywords" className="h-12" />
        ) : (
          <KeywordPriorityList
            keywords={data.targetKeywords}
            onReorder={reorderKeywords}
            onAdd={addKeyword}
            onRemove={removeKeyword}
            variant="onboarding"
          />
        )}
        {errors.targetKeywords && (
          <p className="text-xs text-destructive">{errors.targetKeywords}</p>
        )}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Drag to rank them — priority 1 carries the most weight when we decide
        which of your pages to target and which searches we mine for link
        opportunities.
      </p>
    </div>
  )
}
