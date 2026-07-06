import { PROSPECT_RUN_COLUMNS, PROSPECT_RUN_FETCH_LIMIT } from "@/lib/prospect-runs"
import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const PROSPECT_LIST_COLUMNS =
  "id, product_id, domain, target_url, tier, status, discovered_at, contact_email, contact_name, domain_rating, site_relevance_score"

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return err("Unauthorized", 401)
  }

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!product) {
    return NextResponse.json({ runs: [], prospects: [] })
  }

  const since = new URL(request.url).searchParams.get("since")

  let prospectsQuery = supabase
    .from("backlink_prospects")
    .select(PROSPECT_LIST_COLUMNS)
    .eq("product_id", product.id)
    .order("discovered_at", { ascending: false })

  if (since) {
    prospectsQuery = prospectsQuery.gt("discovered_at", since)
  }

  const [runsResult, prospectsResult] = await Promise.all([
    supabase
      .from("backlink_prospect_runs")
      .select(PROSPECT_RUN_COLUMNS)
      .eq("product_id", product.id)
      .order("started_at", { ascending: false })
      .limit(PROSPECT_RUN_FETCH_LIMIT),
    prospectsQuery,
  ])

  if (runsResult.error) {
    console.error("Error fetching prospect runs:", runsResult.error)
    return err("Failed to fetch discovery status.", 500)
  }

  if (prospectsResult.error) {
    console.error("Error fetching prospects:", prospectsResult.error)
    return err("Failed to fetch discovery status.", 500)
  }

  return NextResponse.json({
    runs: runsResult.data ?? [],
    prospects: prospectsResult.data ?? [],
  })
}
