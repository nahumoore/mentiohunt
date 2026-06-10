import {
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconAlertTriangle,
  IconListDetails,
  IconSparkles,
} from "@tabler/icons-react"
import type { Database } from "@workspace/supabase/database-types"
import type { ElementType } from "react"

export type DirectorySubmissionStatus =
  Database["public"]["Enums"]["directory_submission_status"]

export interface StatusConfig {
  label: string
  description: string
  icon: ElementType
  color: string
}

export interface StatusFilterConfig {
  value: DirectorySubmissionStatus | "all"
  label: string
  icon: ElementType
}

export const ALL_FILTER_CONFIG = {
  label: "All",
  icon: IconListDetails,
}

export const STATUS_CONFIG: Record<DirectorySubmissionStatus, StatusConfig> = {
  not_submitted: {
    label: "Not submitted",
    description: "Gap found — your product is not listed here yet.",
    icon: IconSparkles,
    color: "text-blue-600 bg-blue-500/10",
  },
  submitted: {
    label: "Submitted",
    description: "You submitted — waiting for Google to index the listing.",
    icon: IconClock,
    color: "text-indigo-600 bg-indigo-500/10",
  },
  indexed: {
    label: "Indexed",
    description: "Google has indexed your listing. This backlink is counting.",
    icon: IconCircleCheck,
    color: "text-emerald-600 bg-emerald-500/10",
  },
  not_indexed: {
    label: "Not indexed",
    description:
      "Submitted 30+ days ago and still not indexed. Backlink not counting.",
    icon: IconAlertTriangle,
    color: "text-amber-600 bg-amber-500/10",
  },
  dismissed: {
    label: "Dismissed",
    description: "You chose to skip this directory.",
    icon: IconCircleX,
    color: "text-muted-foreground bg-muted",
  },
}

export const STATUS_FILTERS: StatusFilterConfig[] = [
  { value: "all", label: ALL_FILTER_CONFIG.label, icon: ALL_FILTER_CONFIG.icon },
  {
    value: "not_submitted",
    label: STATUS_CONFIG.not_submitted.label,
    icon: STATUS_CONFIG.not_submitted.icon,
  },
  {
    value: "submitted",
    label: STATUS_CONFIG.submitted.label,
    icon: STATUS_CONFIG.submitted.icon,
  },
  {
    value: "indexed",
    label: STATUS_CONFIG.indexed.label,
    icon: STATUS_CONFIG.indexed.icon,
  },
  {
    value: "not_indexed",
    label: STATUS_CONFIG.not_indexed.label,
    icon: STATUS_CONFIG.not_indexed.icon,
  },
  {
    value: "dismissed",
    label: STATUS_CONFIG.dismissed.label,
    icon: STATUS_CONFIG.dismissed.icon,
  },
]

export const STATUS_ACTIONS: DirectorySubmissionStatus[] = [
  "not_submitted",
  "submitted",
  "dismissed",
]

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}
