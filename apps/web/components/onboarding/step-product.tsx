"use client"

import { EditableList } from "@/components/onboarding/editable-list"
import { TextField } from "@/components/onboarding/text-field"
import { TextareaField } from "@/components/onboarding/textarea-field"
import {
  normalizeUrl,
  type OnboardingData,
  type OnboardingField,
  type OnboardingFieldErrors,
} from "@/consts/onboarding"

export function StepProduct({
  data,
  errors,
  updateField,
}: {
  data: OnboardingData
  errors: OnboardingFieldErrors
  updateField: <Key extends OnboardingField>(
    field: Key,
    value: OnboardingData[Key]
  ) => void
}) {
  return (
    <div className="space-y-6">
      <TextField
        label="Product name"
        value={data.productName}
        error={errors.productName}
        onChange={(value) => updateField("productName", value)}
      />
      <TextareaField
        label="Product description"
        value={data.productDescription}
        error={errors.productDescription}
        onChange={(value) => updateField("productDescription", value)}
      />
      <EditableList
        label="Competitor URLs"
        items={data.competitors}
        placeholder="https://competitor.com"
        error={errors.competitors}
        maxItems={10}
        showFavicon
        normalizeItem={normalizeUrl}
        onChange={(items) => updateField("competitors", items)}
      />
    </div>
  )
}
