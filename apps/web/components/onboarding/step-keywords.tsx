"use client"

import { EditableList } from "@/components/onboarding/editable-list"
import {
  normalizeKeyword,
  type OnboardingData,
  type OnboardingField,
  type OnboardingFieldErrors,
} from "@/consts/onboarding"
import { IconSearch } from "@tabler/icons-react"

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
  return (
    <div className="space-y-6">
      <EditableList
        label={`Target keywords (${data.targetKeywords.length}/10, min 5)`}
        items={data.targetKeywords}
        placeholder="backlink outreach software"
        error={errors.targetKeywords}
        maxItems={10}
        badgeIcon={<IconSearch className="h-3.5 w-3.5" />}
        isLoading={loadingFields.has("targetKeywords")}
        loadingMessage="Finding your target keywords"
        normalizeItem={normalizeKeyword}
        onChange={(items) => updateField("targetKeywords", items)}
      />
      <p className="text-xs leading-5 text-muted-foreground">
        These decide which of your pages we target and which searches we mine
        for link opportunities.
      </p>
    </div>
  )
}
