import { supabaseServer } from "@/lib/supabase/server"
import type { DirectorySubmissionDetail } from "@/stores/directory-submission-store"
import { notFound, redirect } from "next/navigation"

import { DirectoryDetailClientPage } from "./client-page"

export default async function DirectoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  const { data: submission, error } = await supabase
    .from("directory_submissions")
    .select(
      "id, product_id, domain, listing_url, status, discovered_at, submitted_at, last_checked_at, last_indexed_at, directory_id, notes, created_at, directory:directories(id, name, domain, submit_url, category, is_free, is_active, domain_rating, backlinks, referring_domains, dofollow_backlinks, dofollow_referring_domains, seo_metrics_updated_at, submit_url_ok, submit_url_verified_at)"
    )
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("Error fetching directory submission:", error)
  }

  if (!submission) {
    notFound()
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, product_name, website_url, product_description")
    .eq("id", submission.product_id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!product) {
    notFound()
  }

  const detail: DirectorySubmissionDetail = {
    ...submission,
    directory: Array.isArray(submission.directory)
      ? (submission.directory[0] ?? null)
      : submission.directory,
  }

  return (
    <DirectoryDetailClientPage
      submission={detail}
      product={{
        productName: product.product_name,
        websiteUrl: product.website_url,
        productDescription: product.product_description,
      }}
    />
  )
}
