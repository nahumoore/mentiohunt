import {
  IconBrandBluesky,
  IconBrandX,
  IconCircleX,
  IconClipboardCheck,
  IconHelpCircle,
  IconListDetails,
  IconLink,
  IconMail,
  IconMailForward,
  IconNews,
  IconQuote,
  IconSend,
  IconSparkles,
  IconStar,
  IconSwords,
} from "@tabler/icons-react"
import type { Database, Tables } from "@workspace/supabase/database-types"
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

export interface ProspectFilterConfig {
  value: ProspectStatus | "all"
  label: string
  icon: ElementType
}

export const ALL_FILTER_CONFIG = {
  label: "All",
  icon: IconListDetails,
}

export const TYPE_CONFIG: Record<ProspectTier, TierConfig> = {
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
  media_mention: {
    label: "Media mention",
    description:
      "A press or media reference to your product that surfaced via inbox or social monitoring.",
    icon: IconNews,
    color: "text-sky-600 bg-sky-500/10",
  },
}

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

export const STATUS_FILTERS: ProspectFilterConfig[] = [
  { value: "all", label: ALL_FILTER_CONFIG.label, icon: ALL_FILTER_CONFIG.icon },
  { value: "new", label: STATUS_CONFIG.new.label, icon: STATUS_CONFIG.new.icon },
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

// ─── Media mentions ───────────────────────────────────────────

export type MediaMentionSource =
  Database["public"]["Enums"]["media_mention_source"]

export type MediaMention = Pick<
  Tables<"media_mentions">,
  | "id"
  | "source"
  | "topic_summary"
  | "deadline"
  | "publication_domain"
  | "author_name"
  | "author_handle"
  | "url"
  | "raw_text"
  | "raw_body"
  | "created_at"
>

export interface SourceConfig {
  label: string
  icon: ElementType
  color: string
}

export const SOURCE_CONFIG: Record<MediaMentionSource, SourceConfig> = {
  email_inbox: {
    label: "Email inbox",
    icon: IconMail,
    color: "text-slate-600 bg-slate-500/10",
  },
  email: {
    label: "Email",
    icon: IconMail,
    color: "text-slate-600 bg-slate-500/10",
  },
  twitter: {
    label: "Twitter / X",
    icon: IconBrandX,
    color: "text-neutral-700 bg-neutral-500/10",
  },
  bluesky: {
    label: "Bluesky",
    icon: IconBrandBluesky,
    color: "text-blue-600 bg-blue-500/10",
  },
  journofinder: {
    label: "JournoFinder",
    icon: IconNews,
    color: "text-sky-600 bg-sky-500/10",
  },
  qwoted: {
    label: "Qwoted",
    icon: IconQuote,
    color: "text-purple-600 bg-purple-500/10",
  },
  featured: {
    label: "Featured",
    icon: IconStar,
    color: "text-amber-600 bg-amber-500/10",
  },
  unknown: {
    label: "Unknown",
    icon: IconHelpCircle,
    color: "text-muted-foreground bg-muted",
  },
}

export type DeadlineUrgency = "passed" | "urgent" | "soon" | "normal"

export interface DeadlineInfo {
  label: string
  urgency: DeadlineUrgency
}

export function getDeadlineInfo(deadline: string | null): DeadlineInfo | null {
  if (!deadline) return null
  const ms = new Date(deadline).getTime() - Date.now()
  const hours = ms / (1000 * 60 * 60)

  if (hours < 0) return { label: "Deadline passed", urgency: "passed" }
  if (hours < 24)
    return {
      label: `Due in ${Math.ceil(hours)}h`,
      urgency: "urgent",
    }
  if (hours < 72)
    return {
      label: `Due in ${Math.ceil(hours / 24)}d`,
      urgency: "soon",
    }

  return {
    label: `Due ${new Date(deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    urgency: "normal",
  }
}
