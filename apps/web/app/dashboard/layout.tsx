import { ActivationTracker } from "@/components/dashboard/activation-tracker"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardStoreHydrator } from "@/components/dashboard/dashboard-store-hydrator"
import { FirstLoginWalkthrough } from "@/components/dashboard/first-login-walkthrough"
import { GettingStartedChecklist } from "@/components/dashboard/getting-started-checklist"
import { supabaseServer } from "@/lib/supabase/server"
import type { BacklinkNetworkMembership } from "@/stores/backlink-network-store"
import type { DirectoryListItem } from "@/stores/directory-store"
import type { DiscoverySettings } from "@/stores/discovery-settings-store"
import type { OutreachSettings } from "@/stores/outreach-settings-store"
import type { ProspectListItem } from "@/stores/prospect-store"
import type { ProductPageListItem } from "@/stores/pages-store"
import type { Tables } from "@workspace/supabase/database-types"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { redirect } from "next/navigation"

const DEFAULT_DISCOVERY_SETTINGS: DiscoverySettings = {
  opportunityTypes: [
    "competitor_backlinks",
    "unlinked_mentions",
    "listicle_roundups",
    "resource_page_inclusions",
  ],
  drMin: 0,
  drMax: null,
}

const DEFAULT_VOICE_TONE =
  "Write in a casual, direct founder-to-founder tone. Keep it short — 3 to 4 sentences max. No corporate language, no buzzwords. Imagine tapping a fellow builder on the shoulder, not sending a formal pitch to a procurement team. Be genuine, not salesy."

const DEFAULT_OFFERING = `To make it worth their time, mention we're open to one of the following:
- A genuine Trustpilot or G2 review of their product
- A written testimonial they can use on their website or landing page
- A content collaboration or guest post swap
- A shoutout on our social channels or newsletter`

type DiscoverySettingsRow = Pick<
  Tables<"backlink_prospects_settings">,
  "opportunity_types" | "dr_min" | "dr_max" | "voice_tone" | "offering"
>

function mapDiscoverySettings(
  settings: DiscoverySettingsRow | null
): DiscoverySettings {
  if (!settings) return DEFAULT_DISCOVERY_SETTINGS

  return {
    opportunityTypes: settings.opportunity_types.map((type) => {
      if (type === "competitor_backlink") return "competitor_backlinks"
      if (type === "unlinked_mention") return "unlinked_mentions"
      if (type === "listicle_roundup") return "listicle_roundups"
      return "resource_page_inclusions"
    }),
    drMin: settings.dr_min,
    drMax: settings.dr_max,
  }
}

function mapOutreachSettings(
  settings: DiscoverySettingsRow | null
): OutreachSettings {
  return {
    voiceTone: settings?.voice_tone ?? DEFAULT_VOICE_TONE,
    offering: settings?.offering ?? DEFAULT_OFFERING,
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
        "id, email, name, onboarding_completed, tier, active_trial, billing_period_end_at, email_settings, walkthrough_seen_at"
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
  let hasCompletedProspectRun = false
  let directories: DirectoryListItem[] = []
  let discoverySettings: DiscoverySettings | null = product
    ? DEFAULT_DISCOVERY_SETTINGS
    : null
  let outreachSettings: OutreachSettings | null = product
    ? mapOutreachSettings(null)
    : null
  let backlinkNetworkMembership: BacklinkNetworkMembership | null = null
  let pages: ProductPageListItem[] = []
  let hasActiveEmailAccount = false
  let poolDelayedCount = 0
  let sentAt: string[] = []

  if (product) {
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString()
    const ninetyDaysAgo = new Date(
      Date.now() - 90 * 24 * 60 * 60 * 1000
    ).toISOString()

    const [
      prospectsResult,
      directoriesResult,
      discoverySettingsResult,
      backlinkNetworkResult,
      lastProspectRunResult,
      pagesResult,
      emailAccountResult,
      poolDelayedResult,
      sentSequencesResult,
    ] = await Promise.all([
      supabase
        .from("backlink_prospects")
        .select(
          "id, product_id, product_page_id, domain, target_url, tier, status, enrichment_status, discovered_at, contact_email, contact_name, domain_rating, site_relevance_score"
        )
        .eq("product_id", product.id)
        .order("discovered_at", { ascending: false }),
      supabase
        .from("directories")
        .select(
          "id, name, domain, domain_rating, backlinks, is_free, submit_url, referring_domains, dofollow_backlinks, dofollow_referring_domains, seo_metrics_updated_at"
        )
        .eq("is_active", true)
        .order("domain_rating", { ascending: false }),
      supabase
        .from("backlink_prospects_settings")
        .select("opportunity_types, dr_min, dr_max, voice_tone, offering")
        .eq("product_id", product.id)
        .maybeSingle(),
      supabase
        .from("backlink_network_memberships")
        .select("is_enabled, contact_email, updated_at")
        .eq("product_id", product.id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("backlink_prospect_runs")
        .select("id, status")
        .eq("product_id", product.id)
        .eq("status", "completed")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("product_pages")
        .select("id, url, title, description, page_type, priority")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("email_accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_public", false)
        .eq("status", "active")
        .limit(1)
        .maybeSingle(),
      // Only free-tier users send through the shared email pool, so only they
      // can have sequences deferred by pool capacity.
      billingProfile?.tier === "free"
        ? supabase
            .from("prospect_sequences")
            .select("id, backlink_prospects!inner(product_id)", {
              count: "exact",
              head: true,
            })
            .eq("backlink_prospects.product_id", product.id)
            .eq("status", "pending")
            .gte("last_deferred_at", twentyFourHoursAgo)
        : Promise.resolve(null),
      supabase
        .from("prospect_sequences")
        .select("sent_at, backlink_prospects!inner(product_id)")
        .eq("backlink_prospects.product_id", product.id)
        .eq("status", "sent")
        .gte("sent_at", ninetyDaysAgo)
        .order("sent_at", { ascending: false }),
    ])

    hasActiveEmailAccount = emailAccountResult.data !== null
    poolDelayedCount = poolDelayedResult?.count ?? 0

    if (sentSequencesResult.error) {
      console.error(
        "Error fetching sent outreach sequences:",
        sentSequencesResult.error
      )
    } else {
      sentAt = (sentSequencesResult.data ?? [])
        .map((row) => row.sent_at)
        .filter((value): value is string => value !== null)
    }

    const { data: prospectRows, error: prospectsError } = prospectsResult

    if (prospectsError) {
      console.error("Error fetching backlink prospects:", prospectsError)
    }

    hasCompletedProspectRun = !lastProspectRunResult.error && lastProspectRunResult.data !== null

    if (directoriesResult.error) {
      console.error("Error fetching directories:", directoriesResult.error)
    } else {
      directories = directoriesResult.data ?? []
    }

    if (discoverySettingsResult.error) {
      console.error(
        "Error fetching backlink discovery settings:",
        discoverySettingsResult.error
      )
    } else {
      discoverySettings = mapDiscoverySettings(discoverySettingsResult.data)
      outreachSettings = mapOutreachSettings(discoverySettingsResult.data)
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

    if (pagesResult.error) {
      console.error("Error fetching product pages:", pagesResult.error)
    } else {
      pages = pagesResult.data ?? []
    }

    const pageById = new Map(pages.map((page) => [page.id, page]))
    prospects = (prospectRows ?? []).map((prospect) => ({
      ...prospect,
      source_page: prospect.product_page_id
        ? (pageById.get(prospect.product_page_id) ?? null)
        : null,
    }))
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
      hasCompletedProspectRun={hasCompletedProspectRun}
      directories={directories}
      discoverySettings={discoverySettings}
      outreachSettings={outreachSettings}
      backlinkNetworkMembership={backlinkNetworkMembership}
      pages={pages}
      hasActiveEmailAccount={hasActiveEmailAccount}
      poolDelayedCount={poolDelayedCount}
      sentAt={sentAt}
    >
      <SidebarProvider>
        <AppSidebar user={sidebarUser} initialProduct={product} />
        <SidebarInset>
          <DashboardHeader />
          <div className="p-4 sm:p-6">{children}</div>
        </SidebarInset>
        <GettingStartedChecklist />
        <ActivationTracker />
        <FirstLoginWalkthrough />
      </SidebarProvider>
    </DashboardStoreHydrator>
  )
}
