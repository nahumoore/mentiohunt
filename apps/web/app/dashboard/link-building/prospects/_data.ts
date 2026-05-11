import {
  IconCircleX,
  IconClipboardCheck,
  IconLayoutGrid,
  IconLink,
  IconMailForward,
  IconMessage,
  IconSend,
  IconSparkles,
  IconSwords,
  IconTrophy,
} from "@tabler/icons-react"
import type { Database } from "@workspace/supabase/database-types"
import type { ElementType } from "react"

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

export const TYPE_CONFIG: Record<ProspectTier, TierConfig> = {
  directory: {
    label: "Directory",
    description:
      "A listing or submission opportunity where your product may fit the site category.",
    icon: IconLayoutGrid,
    color: "text-teal-600 bg-teal-500/10",
  },
  competitor_backlink: {
    label: "Competitor backlink",
    description:
      "A page that references competitors or similar products and may be a fit for outreach.",
    icon: IconSwords,
    color: "text-amber-600 bg-amber-500/10",
  },
  unlinked_mention: {
    label: "Unlinked mention",
    description:
      "A page that mentions your product or brand context but has not linked yet.",
    icon: IconLink,
    color: "text-violet-600 bg-violet-500/10",
  },
}

export const STATUS_CONFIG: Record<ProspectStatus, StatusConfig> = {
  new: {
    label: "New",
    icon: IconSparkles,
    color: "text-blue-600 bg-blue-500/10",
  },
  submitted: {
    label: "Submitted",
    icon: IconClipboardCheck,
    color: "text-indigo-600 bg-indigo-500/10",
  },
  contacted: {
    label: "Contacted",
    icon: IconSend,
    color: "text-orange-600 bg-orange-500/10",
  },
  replied: {
    label: "Replied",
    icon: IconMessage,
    color: "text-amber-600 bg-amber-500/10",
  },
  won: {
    label: "Won",
    icon: IconTrophy,
    color: "text-emerald-600 bg-emerald-500/10",
  },
  dismissed: {
    label: "Dismissed",
    icon: IconCircleX,
    color: "text-muted-foreground bg-muted",
  },
}

export const ACTION_TYPE_CONFIG: Record<ProspectActionType, ActionTypeConfig> = {
  self_service: {
    label: "Self-serve",
    description: "Open the target URL and submit or claim the listing yourself.",
    icon: IconClipboardCheck,
    color: "text-teal-600 bg-teal-500/10",
  },
  email_outreach: {
    label: "Email outreach",
    description: "Use the prepared outreach draft when contact details are available.",
    icon: IconMailForward,
    color: "text-orange-600 bg-orange-500/10",
  },
}

export const STATUS_FILTERS: { value: ProspectStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "submitted", label: "Submitted" },
  { value: "contacted", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "won", label: "Won" },
  { value: "dismissed", label: "Dismissed" },
]

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
