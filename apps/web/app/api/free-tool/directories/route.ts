import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  const supabase = await supabaseServer()

  const { data, error } = await supabase
    .from("directories")
    .select(
      "id, name, domain, submit_url, category, is_free, is_active, submit_url_ok, submit_url_verified_at, check_method, slug_pattern, domain_rating, backlinks, referring_domains, dofollow_backlinks, dofollow_referring_domains, seo_metrics_updated_at, created_at"
    )
    .eq("is_active", true)
    .order("domain_rating", { ascending: false, nullsFirst: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
