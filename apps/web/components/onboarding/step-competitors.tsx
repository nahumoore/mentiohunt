"use client"

import { EditableList } from "@/components/onboarding/editable-list"
import {
  normalizeUrl,
  validateCompetitorUrl,
  type OnboardingData,
  type OnboardingField,
  type OnboardingFieldErrors,
} from "@/consts/onboarding"

export function StepCompetitors({
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
      <p className="text-sm leading-6 text-muted-foreground">
        Add 2–3 direct product competitors. We use their backlink profiles, so
        a short list of genuinely similar sites is more useful than a long list
        of marketplaces or directories.
      </p>
      <EditableList
        label="Competitor URLs"
        items={data.competitors}
        placeholder="https://competitor.com"
        error={errors.competitors}
        maxItems={10}
        showFavicon
        isLoading={loadingFields.has("competitors")}
        loadingMessage="Investigating your competitors"
        normalizeItem={normalizeUrl}
        validateItem={(value) => validateCompetitorUrl(value, data.websiteUrl)}
        onChange={(items) => updateField("competitors", items)}
      />
    </div>
  )
}
