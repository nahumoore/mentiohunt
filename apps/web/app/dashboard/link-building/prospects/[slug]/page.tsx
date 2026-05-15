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
      "id, product_id, domain, target_url, tier, action_type, status, discovered_at, email_subject, email_body, contact_name, contact_email, notes, created_at, directory_id, directory:directories(id, name, domain, submit_url, category, is_free, is_active, domain_rating, backlinks, referring_domains, dofollow_backlinks, dofollow_referring_domains, seo_metrics_updated_at, submit_url_ok, submit_url_verified_at)"
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

  const prospectDetail: ProspectDetail = {
    ...prospect,
    directory: Array.isArray(prospect.directory)
      ? (prospect.directory[0] ?? null)
      : prospect.directory,
  }

  return (
    <ProspectClientPage
      prospect={prospectDetail}
      product={{
        productName: product.product_name,
        websiteUrl: product.website_url,
      }}
    />
  )
}
