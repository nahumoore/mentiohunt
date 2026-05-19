import { supabaseServer } from "@/lib/supabase/server"
import type { TablesInsert } from "@workspace/supabase/database-types"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const contactEmailSchema = z
  .string()
  .trim()
  .max(254, "Keep the contact email under 254 characters.")
  .email("Enter a valid contact email.")

const backlinkNetworkSchema = z
  .object({
    isEnabled: z.boolean(),
    contactEmail: z.string().trim().max(254).default(""),
  })
  .superRefine((value, ctx) => {
    if (!value.isEnabled && value.contactEmail.length === 0) return

    const parsedEmail = contactEmailSchema.safeParse(value.contactEmail)

    if (!parsedEmail.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contactEmail"],
        message:
          parsedEmail.error.issues[0]?.message ??
          "Enter a valid contact email.",
      })
    }
  })

function buildValidationError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

async function getCurrentProduct(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  userId: string
) {
  return supabase
    .from("products")
    .select("id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()
}

export async function GET() {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return buildValidationError("Unauthorized", 401)
  }

  const { data: product, error: productError } = await getCurrentProduct(
    supabase,
    user.id
  )

  if (productError) {
    console.error("Error fetching backlink network product:", productError)
    return buildValidationError(
      "Failed to load Backlink Network settings.",
      500
    )
  }

  if (!product) {
    return buildValidationError("Product not found.", 404)
  }

  const { data: membership, error: membershipError } = await supabase
    .from("backlink_network_memberships")
    .select("is_enabled, contact_email, updated_at")
    .eq("product_id", product.id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (membershipError) {
    console.error(
      "Error fetching backlink network membership:",
      membershipError
    )
    return buildValidationError(
      "Failed to load Backlink Network settings.",
      500
    )
  }

  return NextResponse.json({
    membership: {
      isEnabled: membership?.is_enabled ?? false,
      contactEmail: membership?.contact_email ?? user.email ?? "",
      updatedAt: membership?.updated_at ?? null,
    },
  })
}

export async function PUT(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return buildValidationError("Unauthorized", 401)
  }

  const body = await request.json().catch(() => null)
  const parsedRequest = backlinkNetworkSchema.safeParse(body)

  if (!parsedRequest.success) {
    return buildValidationError(
      parsedRequest.error.issues[0]?.message ?? "Invalid request payload."
    )
  }

  const { data: product, error: productError } = await getCurrentProduct(
    supabase,
    user.id
  )

  if (productError) {
    console.error("Error fetching backlink network product:", productError)
    return buildValidationError(
      "Failed to update Backlink Network settings.",
      500
    )
  }

  if (!product) {
    return buildValidationError("Product not found.", 404)
  }

  const isEnabled = parsedRequest.data.isEnabled
  const contactEmail = isEnabled ? parsedRequest.data.contactEmail.trim() : null
  const updatedAt = new Date().toISOString()
  const payload: TablesInsert<"backlink_network_memberships"> = {
    user_id: user.id,
    product_id: product.id,
    is_enabled: isEnabled,
    contact_email: contactEmail,
    updated_at: updatedAt,
  }

  const { error: upsertError } = await supabase
    .from("backlink_network_memberships")
    .upsert(payload, { onConflict: "product_id" })

  if (upsertError) {
    console.error("Error updating backlink network membership:", upsertError)
    return buildValidationError(
      "Failed to update Backlink Network settings.",
      500
    )
  }

  return NextResponse.json({
    membership: {
      isEnabled,
      contactEmail: contactEmail ?? user.email ?? "",
      updatedAt,
    },
  })
}
