import { supabaseServer } from "@/lib/supabase/server"
import { waitUntil } from "@vercel/functions"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001"

export async function POST() {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, target_keywords")
    .eq("user_id", user.id)
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: "No product found." }, { status: 404 })
  }

  if ((product.target_keywords ?? []).length === 0) {
    return NextResponse.json(
      { error: "Add your target keywords before scanning your site." },
      { status: 400 }
    )
  }

  waitUntil(
    fetch(`${SERVER_URL}/pages/reselect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": process.env.INTERNAL_API_KEY ?? "",
      },
      body: JSON.stringify({ productId: product.id }),
    }).catch((err) => {
      console.error("Failed to trigger page re-selection:", err)
    })
  )

  return NextResponse.json({ queued: true })
}
