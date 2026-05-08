import { onboardingSchema } from "@/consts/onboarding"
import { supabaseServer } from "@/lib/supabase/server"
import type {
  TablesInsert,
  TablesUpdate,
} from "@workspace/supabase/database-types"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

function buildValidationError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return buildValidationError("Unauthorized", 401)
  }

  const body = await request.json().catch(() => null)
  const parsedRequest = onboardingSchema.safeParse(body)

  if (!parsedRequest.success) {
    return buildValidationError(
      parsedRequest.error.issues[0]?.message ?? "Invalid request payload."
    )
  }

  const productPayload: TablesInsert<"products"> = {
    user_id: user.id,
    website_url: parsedRequest.data.websiteUrl,
    product_description: parsedRequest.data.productDescription,
    competitors: parsedRequest.data.competitors,
    opportunity_types: parsedRequest.data.opportunityTypes,
  }

  const { data: existingProducts, error: existingProductsError } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", user.id)
    .limit(2)

  if (existingProductsError) {
    console.error("Error fetching onboarding product:", existingProductsError)
    return buildValidationError("Failed to complete onboarding.", 500)
  }

  if (existingProducts.length > 1) {
    console.error("Multiple onboarding products found for user:", user.id)
    return buildValidationError("Failed to complete onboarding.", 409)
  }

  if (existingProducts[0]) {
    const productUpdate: TablesUpdate<"products"> = {
      website_url: productPayload.website_url,
      product_description: productPayload.product_description,
      competitors: productPayload.competitors,
      opportunity_types: productPayload.opportunity_types,
    }

    const { error: updateProductError } = await supabase
      .from("products")
      .update(productUpdate)
      .eq("id", existingProducts[0].id)

    if (updateProductError) {
      console.error("Error updating onboarding product:", updateProductError)
      return buildValidationError("Failed to complete onboarding.", 500)
    }
  } else {
    const { error: insertProductError } = await supabase
      .from("products")
      .insert(productPayload)

    if (insertProductError) {
      console.error("Error creating onboarding product:", insertProductError)
      return buildValidationError("Failed to complete onboarding.", 500)
    }
  }

  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id)

  if (updateProfileError) {
    console.error("Error marking onboarding complete:", updateProfileError)
    return buildValidationError("Failed to complete onboarding.", 500)
  }

  return NextResponse.json({ success: true })
}
