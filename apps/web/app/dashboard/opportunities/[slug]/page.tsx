import { supabaseServer } from "@/lib/supabase/server"
import type { ProspectDetail } from "@/stores/prospect-store"
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
      "id, product_id, domain, target_url, tier, status, discovered_at, contact_email, contact_name, email_subject, email_body, created_at, found_url, contact_social_links, raw_metadata, domain_rating, site_relevance_score"
    )
    .eq("id", slug)
    .maybeSingle()

  if (error) {
    console.error("Error fetching backlink prospect:", error)
  }

  if (!prospect) {
    notFound()
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, product_name, website_url")
    .eq("id", prospect.product_id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!product) {
    notFound()
  }

  return (
    <ProspectClientPage
      prospect={prospect as ProspectDetail}
      product={{ productName: product.product_name, websiteUrl: product.website_url }}
    />
  )
}
