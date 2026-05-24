import { supabaseServer } from "@/lib/supabase/server"
import type { ProspectDetail } from "@/stores/prospect-store"
import { notFound, redirect } from "next/navigation"

import type { MediaMention } from "../_data"
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
      "id, product_id, domain, target_url, tier, action_type, status, discovered_at, contact_email, contact_name, email_subject, email_body, notes, created_at, source_media_mention_id"
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

  let mediaMention: MediaMention | null = null

  if (prospect.source_media_mention_id) {
    const { data, error: mmError } = await supabase
      .from("media_mentions")
      .select(
        "id, source, topic_summary, deadline, publication_domain, author_name, author_handle, url, raw_text, raw_body, created_at"
      )
      .eq("id", prospect.source_media_mention_id)
      .maybeSingle()

    if (mmError) {
      console.error("Error fetching media mention:", mmError)
    } else {
      mediaMention = data ?? null
    }
  }

  return (
    <ProspectClientPage
      prospect={prospect as ProspectDetail}
      product={{ productName: product.product_name, websiteUrl: product.website_url }}
      mediaMention={mediaMention}
    />
  )
}
