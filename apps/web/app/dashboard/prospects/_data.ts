import {
  IconCircleCheck,
  IconCircleX,
  IconLink,
  IconListDetails,
  IconMailQuestion,
  IconMailX,
  IconSend,
  IconSparkles,
} from "@tabler/icons-react"
import type { Database } from "@workspace/supabase/database-types"
import type { ElementType } from "react"

import { PROSPECT_TIER_CONFIG } from "@/lib/opportunity-types"

export type ProspectStatus = Database["public"]["Enums"]["prospect_status"]
export type ProspectTier = Database["public"]["Enums"]["prospect_tier"]

export interface TierConfig {
  label: string
  description: string
  icon: ElementType
  color: string
}

export interface StatusConfig {
  label: string
  icon: ElementType
  color: string
}

export interface ProspectFilterConfig {
  value: ProspectStatus | "all"
  label: string
  icon: ElementType
}

export const ALL_FILTER_CONFIG = {
  label: "All",
  icon: IconListDetails,
}

export const TYPE_CONFIG: Record<ProspectTier, TierConfig> = PROSPECT_TIER_CONFIG

export const STATUS_CONFIG: Record<ProspectStatus, StatusConfig> = {
  new: {
    label: "New",
    icon: IconSparkles,
    color: "text-primary bg-primary/10",
  },
  contacted: {
    label: "Contacted",
    icon: IconSend,
    color: "text-primary bg-primary/20",
  },
  negotiating: {
    label: "Negotiating",
    icon: IconLink,
    color: "text-amber-700 dark:text-brand-warning bg-brand-warning/15",
  },
  won: {
    label: "Won",
    icon: IconCircleCheck,
    color: "text-emerald-700 dark:text-brand-success bg-brand-success/10",
  },
  dismissed: {
    label: "Dismissed",
    icon: IconCircleX,
    color: "text-muted-foreground bg-muted",
  },
  email_not_found: {
    label: "Email not found",
    icon: IconMailQuestion,
    color: "text-amber-700 dark:text-brand-warning bg-brand-warning/15",
  },
  bounced: {
    label: "Undeliverable",
    icon: IconMailX,
    color: "text-destructive bg-destructive/10",
  },
}

export const STATUS_FILTERS: ProspectFilterConfig[] = [
  {
    value: "all",
    label: ALL_FILTER_CONFIG.label,
    icon: ALL_FILTER_CONFIG.icon,
  },
  {
    value: "new",
    label: STATUS_CONFIG.new.label,
    icon: STATUS_CONFIG.new.icon,
  },
  {
    value: "contacted",
    label: STATUS_CONFIG.contacted.label,
    icon: STATUS_CONFIG.contacted.icon,
  },
  {
    value: "negotiating",
    label: STATUS_CONFIG.negotiating.label,
    icon: STATUS_CONFIG.negotiating.icon,
  },
  {
    value: "won",
    label: STATUS_CONFIG.won.label,
    icon: STATUS_CONFIG.won.icon,
  },
  {
    value: "dismissed",
    label: STATUS_CONFIG.dismissed.label,
    icon: STATUS_CONFIG.dismissed.icon,
  },
]

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
