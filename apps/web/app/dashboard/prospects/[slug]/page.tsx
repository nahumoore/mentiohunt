import { supabaseServer } from "@/lib/supabase/server"
import type { ProspectDetail, ProspectSequence } from "@/stores/prospect-store"
import { notFound, redirect } from "next/navigation"

import { ProspectClientPage } from "./client-page"

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
      "id, product_id, domain, target_url, tier, status, enrichment_status, discovered_at, contact_email, contact_name, email_subject, email_body, created_at, found_url, contact_social_links, raw_metadata, domain_rating, site_relevance_score"
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
      .select("id, step, subject, body, status, scheduled_at, sent_at")
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

  if (sequencesResult.error) {
    console.error("Error fetching prospect sequences:", sequencesResult.error)
  }

  const sequences: ProspectSequence[] = sequencesResult.data ?? []
  const isFreeUser = profileResult.data == null ? true : profileResult.data.tier === "free"

  return (
    <ProspectClientPage
      prospect={prospect as ProspectDetail}
      product={{ productName: productResult.data.product_name, websiteUrl: productResult.data.website_url }}
      sequences={sequences}
      isFreeUser={isFreeUser}
    />
  )
}
