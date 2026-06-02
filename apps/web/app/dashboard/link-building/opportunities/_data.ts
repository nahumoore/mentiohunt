import {
  IconCircleX,
  IconListDetails,
  IconMailForward,
  IconMessageShare,
  IconSend,
  IconSparkles,
} from "@tabler/icons-react"
import type { Database } from "@workspace/supabase/database-types"
import type { ElementType } from "react"

import { PROSPECT_TIER_CONFIG } from "@/lib/opportunity-types"

export type ProspectStatus = Database["public"]["Enums"]["prospect_status"]
export type ProspectTier = Database["public"]["Enums"]["prospect_tier"]
export type ProspectActionType =
  Database["public"]["Enums"]["prospect_action_type"]

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

export interface ActionTypeConfig {
  label: string
  description: string
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
    color: "text-blue-600 bg-blue-500/10",
  },
  contacted: {
    label: "Contacted",
    icon: IconSend,
    color: "text-orange-600 bg-orange-500/10",
  },
  dismissed: {
    label: "Dismissed",
    icon: IconCircleX,
    color: "text-muted-foreground bg-muted",
  },
}

export const ACTION_TYPE_CONFIG: Record<ProspectActionType, ActionTypeConfig> =
  {
    email_outreach: {
      label: "Email outreach",
      description:
        "Use the prepared outreach draft when contact details are available.",
      icon: IconMailForward,
      color: "text-orange-600 bg-orange-500/10",
    },
    social_media: {
      label: "Social reply",
      description:
        "Reply to the post on the social platform where it was discovered.",
      icon: IconMessageShare,
      color: "text-neutral-700 bg-neutral-500/10",
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
