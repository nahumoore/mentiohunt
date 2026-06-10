"use client"

import { EditableList } from "@/components/onboarding/editable-list"
import { IconBrandRedditNew } from "@/components/custom-icons/brand-reddit-new"
import { IconHash } from "@tabler/icons-react"
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
        badgeIcon={<IconHash className="h-3.5 w-3.5" />}
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
        badgeIcon={<IconBrandRedditNew size={14} />}
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
