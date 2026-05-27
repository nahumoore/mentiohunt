"use client"

import { EditableList } from "@/components/onboarding/editable-list"
import type {
  OnboardingData,
  OnboardingField,
  OnboardingFieldErrors,
} from "@/consts/onboarding"

export function StepAudience({
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
        label="Monitoring keywords"
        items={data.monitoringKeywords}
        placeholder="e.g. best backlink tool"
        error={errors.monitoringKeywords}
        maxItems={10}
        isLoading={loadingFields.has("monitoringKeywords")}
        onChange={(items) => updateField("monitoringKeywords", items)}
      />
      <EditableList
        label="Reddit communities"
        items={data.monitoringCommunities.map((item) => item.community)}
        placeholder="SaaS"
        prefix="r/"
        error={errors.monitoringCommunities}
        maxItems={10}
        isLoading={loadingFields.has("monitoringCommunities")}
        normalizeItem={(value) =>
          value
            .replace(/^\/?r\//i, "")
            .replace(/^\/+/, "")
            .trim()
        }
        onChange={(items) =>
          updateField(
            "monitoringCommunities",
            items.map((community) => ({ platform: "reddit", community }))
          )
        }
      />
    </div>
  )
}
