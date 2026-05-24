import type {
  MentionIntent,
  MentionStatus,
} from "@/app/dashboard/community-mentions/reply-queue/_data"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardStoreHydrator } from "@/components/dashboard/dashboard-store-hydrator"
import type { MentionPlatform } from "@/consts/platform-config"
import { supabaseServer } from "@/lib/supabase/server"
import type { BacklinkNetworkMembership } from "@/stores/backlink-network-store"
import type { CommunityMention } from "@/stores/community-mention-store"
import type { DirectorySubmissionListItem } from "@/stores/directory-submission-store"
import type { DiscoverySettings } from "@/stores/discovery-settings-store"
import type { ProspectListItem } from "@/stores/prospect-store"
import type { Tables } from "@workspace/supabase/database-types"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { redirect } from "next/navigation"

const DEFAULT_DISCOVERY_SETTINGS: DiscoverySettings = {
  opportunityTypes: [
    "competitor_backlinks",
    "unlinked_mentions",
  ],
  drMin: 0,
  drMax: null,
}

type DiscoverySettingsRow = Pick<
  Tables<"product_backlink_discovery_settings">,
  "opportunity_types" | "dr_min" | "dr_max"
>

type ReplyQueueItemRow = Pick<
  Tables<"reply_queue_items">,
  | "id"
  | "platform"
  | "community"
  | "url"
  | "title"
  | "body"
  | "author"
  | "post_created_at"
  | "created_at"
  | "fit_category"
  | "fit_score"
  | "summary"
  | "suggested_reply"
  | "engagement"
  | "comment_count"
  | "user_status"
>

function mapDiscoverySettings(
  settings: DiscoverySettingsRow | null
): DiscoverySettings {
  if (!settings) return DEFAULT_DISCOVERY_SETTINGS

  return {
    opportunityTypes: settings.opportunity_types.map((type) => {
      if (type === "competitor_backlink") return "competitor_backlinks"
      if (type === "media_mention") return "media_mentions"
      return "unlinked_mentions"
    }),
    drMin: settings.dr_min,
    drMax: settings.dr_max,
  }
}

function mapMentionPlatform(platform: string): MentionPlatform {
  return platform === "bluesky" ? "bluesky" : "reddit"
}

function mapMentionIntent(fitCategory: string): MentionIntent {
  switch (fitCategory) {
    case "seeking_recommendation":
      return "asking_for_tool"
    case "comparing_alternatives":
    case "switching_tools":
      return "competitor_alternative"
    case "expressing_pain":
      return "pain_point"
    case "asking_how":
      return "how_to"
    default:
      return "discussion"
  }
}

function mapMentionStatus(status: string): MentionStatus {
  if (status === "saved" || status === "replied" || status === "dismissed") {
    return status
  }

  return "new"
}

function getNextAction(status: MentionStatus) {
  if (status === "replied") return "Monitor thread for response"
  if (status === "dismissed") return "No action needed"
  if (status === "saved") return "Review saved reply"
  return "Review reply and post today"
}

function mapCommunityMention(row: ReplyQueueItemRow): CommunityMention {
  const status = mapMentionStatus(row.user_status)
  const platform = mapMentionPlatform(row.platform)
  const postedAt = row.post_created_at ?? row.created_at
  const sourceName =
    row.community ?? (platform === "bluesky" ? "Bluesky" : "Reddit")

  return {
    id: row.id,
    platform,
    sourceName,
    postUrl: row.url,
    postTitle: row.title ?? row.summary ?? "Community mention",
    postExcerpt: row.body,
    authorName: row.author ?? "Unknown author",
    authorProfileUrl: null,
    postedAt,
    discoveredAt: row.created_at,
    intent: mapMentionIntent(row.fit_category),
    relevanceScore: Math.max(0, Math.min(100, Math.round(row.fit_score))),
    fitReason: row.summary ?? "Matched by the community monitoring run.",
    matchedSignals: [],
    productAngle: "",
    replyDraft: row.suggested_reply ?? "",
    safetyNotes: [],
    engagement: {
      comments: row.comment_count,
      reactions: row.engagement,
      views: null,
    },
    status,
    nextAction: getNextAction(status),
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  const [profileResult, productResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, email, name, onboarding_completed, tier, active_trial, billing_period_end_at"
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("products")
      .select(
        "id, user_id, website_url, product_name, product_description, competitors, created_at, updated_at"
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const profile = profileResult.data
  const product = productResult.data

  if (!profile?.onboarding_completed) {
    redirect("/onboarding")
  }

  const billingProfile = profile as Pick<
    Tables<"profiles">,
    "onboarding_completed" | "tier" | "active_trial"
  > | null

  if (
    billingProfile?.tier === "free" &&
    billingProfile.active_trial === false
  ) {
    redirect("/expired-trial")
  }

  let prospects: ProspectListItem[] = []
  let directorySubmissions: DirectorySubmissionListItem[] = []
  let communityMentions: CommunityMention[] = []
  let discoverySettings: DiscoverySettings | null = product
    ? DEFAULT_DISCOVERY_SETTINGS
    : null
  let backlinkNetworkMembership: BacklinkNetworkMembership | null = null
  let hasRunningCommunityRun = false

  if (product) {
    const [
      prospectsResult,
      directorySubmissionsResult,
      discoverySettingsResult,
      replyQueueConfigsResult,
      backlinkNetworkResult,
    ] = await Promise.all([
      supabase
        .from("backlink_prospects")
        .select(
          "id, product_id, domain, target_url, tier, action_type, status, discovered_at, contact_email, contact_name, notes"
        )
        .eq("product_id", product.id)
        .order("discovered_at", { ascending: false }),
      supabase
        .from("directory_submissions")
        .select(
          "id, product_id, domain, submit_url, listing_url, status, discovered_at, submitted_at, last_checked_at, last_indexed_at, directory:directories(is_free, domain_rating, backlinks, referring_domains, dofollow_backlinks, dofollow_referring_domains, seo_metrics_updated_at)"
        )
        .eq("product_id", product.id)
        .order("discovered_at", { ascending: false }),
      supabase
        .from("product_backlink_discovery_settings")
        .select("opportunity_types, dr_min, dr_max")
        .eq("product_id", product.id)
        .maybeSingle(),
      supabase
        .from("reply_queue_configs")
        .select("id, last_run_status")
        .eq("product_id", product.id)
        .eq("user_id", user.id),
      supabase
        .from("backlink_network_memberships")
        .select("is_enabled, contact_email, updated_at")
        .eq("product_id", product.id)
        .eq("user_id", user.id)
        .maybeSingle(),
    ])

    const { data: prospectRows, error: prospectsError } = prospectsResult

    if (prospectsError) {
      console.error("Error fetching backlink prospects:", prospectsError)
    }

    prospects = prospectRows ?? []

    if (directorySubmissionsResult.error) {
      console.error(
        "Error fetching directory submissions:",
        directorySubmissionsResult.error
      )
    } else {
      directorySubmissions = (directorySubmissionsResult.data ?? []).map(
        (row) => ({
          ...row,
          directory: Array.isArray(row.directory)
            ? (row.directory[0] ?? null)
            : row.directory,
        })
      )
    }

    if (discoverySettingsResult.error) {
      console.error(
        "Error fetching backlink discovery settings:",
        discoverySettingsResult.error
      )
    } else {
      discoverySettings = mapDiscoverySettings(discoverySettingsResult.data)
    }

    hasRunningCommunityRun =
      !replyQueueConfigsResult.error &&
      (replyQueueConfigsResult.data ?? []).some(
        (config) => config.last_run_status === "running"
      )

    if (replyQueueConfigsResult.error) {
      console.error(
        "Error fetching reply queue configs:",
        replyQueueConfigsResult.error
      )
    } else {
      const configIds = (replyQueueConfigsResult.data ?? []).map(
        (config) => config.id
      )

      if (configIds.length > 0) {
        const replyQueueItemsResult = await supabase
          .from("reply_queue_items")
          .select(
            "id, platform, community, url, title, body, author, post_created_at, created_at, fit_category, fit_score, summary, suggested_reply, engagement, comment_count, user_status"
          )
          .eq("user_id", user.id)
          .in("config_id", configIds)
          .order("created_at", { ascending: false })

        if (replyQueueItemsResult.error) {
          console.error(
            "Error fetching reply queue items:",
            replyQueueItemsResult.error
          )
        } else {
          communityMentions = (replyQueueItemsResult.data ?? []).map(
            mapCommunityMention
          )
        }
      }
    }

    if (backlinkNetworkResult.error) {
      console.error(
        "Error fetching backlink network membership:",
        backlinkNetworkResult.error
      )
    } else if (backlinkNetworkResult.data) {
      const row = backlinkNetworkResult.data
      backlinkNetworkMembership = {
        isEnabled: row.is_enabled,
        contactEmail: row.contact_email ?? "",
        updatedAt: row.updated_at,
      }
    }
  }

  const sidebarUser = {
    name:
      (user.user_metadata?.full_name as string | undefined) ??
      user.email ??
      "User",
    email: user.email ?? "",
    avatar: (user.user_metadata?.avatar_url as string | undefined) ?? "",
  }

  return (
    <DashboardStoreHydrator
      profile={profile}
      product={product}
      prospects={prospects}
      directorySubmissions={directorySubmissions}
      communityMentions={communityMentions}
      hasRunningCommunityRun={hasRunningCommunityRun}
      discoverySettings={discoverySettings}
      backlinkNetworkMembership={backlinkNetworkMembership}
    >
      <SidebarProvider>
        <AppSidebar user={sidebarUser} initialProduct={product} />
        <SidebarInset>
          <DashboardHeader />
          <div className="p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </DashboardStoreHydrator>
  )
}
