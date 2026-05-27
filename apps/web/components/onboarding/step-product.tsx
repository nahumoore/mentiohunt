"use client"

import { TextField } from "@/components/onboarding/text-field"
import { TextareaField } from "@/components/onboarding/textarea-field"
import {
  type OnboardingData,
  type OnboardingField,
  type OnboardingFieldErrors,
} from "@/consts/onboarding"

export function StepProduct({
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
      <TextField
        label="Product name"
        value={data.productName}
        error={errors.productName}
        isLoading={loadingFields.has("productName")}
        onChange={(value) => updateField("productName", value)}
      />
      <TextareaField
        label="Product description"
        value={data.productDescription}
        error={errors.productDescription}
        isLoading={loadingFields.has("productDescription")}
        onChange={(value) => updateField("productDescription", value)}
      />
    </div>
  )
}
