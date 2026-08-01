import { supabaseServer } from "@/lib/supabase/server"
import { supabaseAdmin } from "@workspace/supabase/admin"
import type { ProspectDetail, ProspectMessage, ProspectSequence } from "@/stores/prospect-store"
import { notFound, redirect } from "next/navigation"

import { ProspectClientPage } from "./client-page"

/** Mirrors resolveEmailAccount's notion of "an account is available" (own
 * connected mailbox for paid tiers, else the shared public account) so the
 * manual-completion form can gate its submit button without a client-side
 * DB read. */
async function checkHasEmailAccount(userId: string, isPaid: boolean): Promise<boolean> {
  if (isPaid) {
    const { data: ownAccount } = await supabaseAdmin
      .from("email_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("is_public", false)
      .eq("status", "active")
      .limit(1)
      .maybeSingle()

    if (ownAccount) return true
  }

  const { data: publicAccount } = await supabaseAdmin
    .from("email_accounts")
    .select("id")
    .eq("is_public", true)
    .eq("status", "active")
    .limit(1)
    .maybeSingle()

  return !!publicAccount
}

export default async function ProspectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  const { data: prospect, error } = await supabase
    .from("backlink_prospects")
    .select(
      "id, product_id, product_page_id, domain, target_url, tier, status, enrichment_status, discovered_at, contact_email, contact_name, email_subject, email_body, created_at, found_url, contact_social_links, raw_metadata, domain_rating, site_relevance_score, outreach_stopped_at, outreach_stopped_reason, email_account_id"
    )
    .eq("id", slug)
    .maybeSingle()

  if (error) {
    console.error("Error fetching backlink prospect:", error)
  }

  if (!prospect) {
    notFound()
  }

  const [productResult, sequencesResult, profileResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, product_name, website_url")
      .eq("id", prospect.product_id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("prospect_sequences")
      .select("id, step, subject, body, status, scheduled_at, sent_at, bounced_at, bounce_reason")
      .eq("prospect_id", prospect.id)
      .order("step", { ascending: true }),
    supabase
      .from("profiles")
      .select("tier")
      .eq("id", user.id)
      .maybeSingle(),
  ])

  if (!productResult.data) {
    notFound()
  }

  let sourcePage: ProspectDetail["source_page"] = null
  if (prospect.product_page_id) {
    const { data: productPage, error: productPageError } = await supabase
      .from("product_pages")
      .select("id, url, title, page_type")
      .eq("id", prospect.product_page_id)
      .eq("product_id", prospect.product_id)
      .maybeSingle()

    if (productPageError) {
      console.error("Error fetching prospect source page:", productPageError)
    } else {
      sourcePage = productPage
    }
  }

  if (sequencesResult.error) {
    console.error("Error fetching prospect sequences:", sequencesResult.error)
  }

  const sequences: ProspectSequence[] = sequencesResult.data ?? []
  const isFreeUser = profileResult.data == null ? true : profileResult.data.tier === "free"
  const isPaid = profileResult.data?.tier === "pro" || profileResult.data?.tier === "agency"

  const { data: ownAccounts } = isPaid
    ? await supabaseAdmin
        .from("email_accounts")
        .select("id, email, name")
        .eq("user_id", user.id)
        .eq("is_public", false)
        .eq("status", "active")
        .order("created_at", { ascending: false })
    : { data: null }

  // Outreach always sends from the shared pool for now, but once the prospect
  // replies the founder takes over from their own connected mailbox — so this
  // reflects whether that mailbox is currently connected, not which account
  // sent the original outreach.
  const isPublicMailbox = !ownAccounts?.length

  const { data: messagesData, error: messagesError } = await supabaseAdmin
    .from("prospect_messages")
    .select("id, sequence_id, direction, classification, classification_reason, from_email, from_name, subject, text_body, received_at")
    .eq("prospect_id", prospect.id)
    .order("received_at", { ascending: true })

  if (messagesError) {
    console.error("Error fetching prospect messages:", messagesError)
  }

  const messages: ProspectMessage[] = messagesData ?? []

  const hasEmailAccount =
    prospect.status === "email_not_found" ? await checkHasEmailAccount(user.id, isPaid) : true

  return (
    <ProspectClientPage
      prospect={{ ...(prospect as ProspectDetail), source_page: sourcePage }}
      product={{ productName: productResult.data.product_name, websiteUrl: productResult.data.website_url }}
      sequences={sequences}
      messages={messages}
      isFreeUser={isFreeUser}
      hasEmailAccount={hasEmailAccount}
      isPublicMailbox={isPublicMailbox}
      ownEmailAccounts={ownAccounts ?? []}
    />
  )
}
