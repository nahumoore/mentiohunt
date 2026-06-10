import { supabaseServer } from "@/lib/supabase/server"
import type { Json, TablesInsert } from "@workspace/supabase/database-types"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const platformSchema = z.enum(["reddit", "quora"])

const communitySchema = z.object({
  platform: z.literal("reddit"),
  community: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .transform((value) => normalizeCommunityName(value)),
})

const monitoringConfigSchema = z.object({
  platforms: z.array(platformSchema).min(1, "Choose at least one platform."),
  communities: z.array(communitySchema).max(15, "Maximum 15 communities."),
  keywords: z
    .array(z.string().trim().min(1).max(120))
    .max(10, "Maximum 10 keywords."),
  customVoiceEnabled: z.boolean(),
  customVoiceInstructions: z.string().max(2000),
  emailAlertsEnabled: z.boolean(),
})

type MonitoringConfig = z.infer<typeof monitoringConfigSchema>

function normalizeCommunityName(value: string) {
  return value.trim().replace(/^\/?r\//i, "").replace(/^\/+/, "").trim()
}

function buildValidationError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function normalizeConfig(config: MonitoringConfig): MonitoringConfig {
  const communities = new Map<string, MonitoringConfig["communities"][number]>()
  const keywords = new Map<string, string>()

  for (const community of config.communities) {
    const normalized = normalizeCommunityName(community.community)
    if (!normalized) continue
    communities.set(`${community.platform}:${normalized.toLowerCase()}`, {
      platform: community.platform,
      community: normalized,
    })
  }

  for (const keyword of config.keywords) {
    const normalized = keyword.trim()
    if (!normalized) continue
    keywords.set(normalized.toLowerCase(), normalized)
  }

  return {
    ...config,
    communities: Array.from(communities.values()).slice(0, 15),
    keywords: Array.from(keywords.values()).slice(0, 10),
    customVoiceInstructions: config.customVoiceInstructions.trim(),
  }
}

function mapDbConfig(row: {
  platforms: string[]
  communities: unknown
  keywords: string[]
  email_alerts_enabled: boolean
  custom_voice_instructions: string | null
}): MonitoringConfig {
  const parsedCommunities = z.array(communitySchema).safeParse(row.communities)
  const parsedPlatforms = z.array(platformSchema).safeParse(row.platforms)

  return normalizeConfig({
    platforms: parsedPlatforms.success ? parsedPlatforms.data : ["reddit"],
    communities: parsedCommunities.success ? parsedCommunities.data : [],
    keywords: row.keywords,
    customVoiceEnabled: row.custom_voice_instructions !== null,
    customVoiceInstructions: row.custom_voice_instructions ?? "",
    emailAlertsEnabled: row.email_alerts_enabled,
  })
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
    console.error("Error fetching community setup product:", productError)
    return buildValidationError("Failed to load community settings.", 500)
  }

  if (!product) {
    return buildValidationError("Product not found.", 404)
  }

  const { data: config, error: configError } = await supabase
    .from("reply_queue_configs")
    .select(
      "id, platforms, communities, keywords, email_alerts_enabled, custom_voice_instructions"
    )
    .eq("product_id", product.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (configError) {
    console.error("Error fetching community settings:", configError)
    return buildValidationError("Failed to load community settings.", 500)
  }

  return NextResponse.json({
    config: config ? mapDbConfig(config) : null,
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
  const parsedRequest = monitoringConfigSchema.safeParse(body)

  if (!parsedRequest.success) {
    return buildValidationError(
      parsedRequest.error.issues[0]?.message ?? "Invalid request payload."
    )
  }

  const config = normalizeConfig(parsedRequest.data)
  const { data: product, error: productError } = await getCurrentProduct(
    supabase,
    user.id
  )

  if (productError) {
    console.error("Error fetching community setup product:", productError)
    return buildValidationError("Failed to update community settings.", 500)
  }

  if (!product) {
    return buildValidationError("Product not found.", 404)
  }

  const payload: TablesInsert<"reply_queue_configs"> = {
    user_id: user.id,
    product_id: product.id,
    platforms: config.platforms,
    communities: config.communities as unknown as Json,
    keywords: config.keywords,
    email_alerts_enabled: config.emailAlertsEnabled,
    custom_voice_instructions: config.customVoiceEnabled
      ? config.customVoiceInstructions
      : null,
    status: "active",
  }

  const { data: existingConfig, error: existingConfigError } = await supabase
    .from("reply_queue_configs")
    .select("id")
    .eq("product_id", product.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingConfigError) {
    console.error("Error fetching existing community settings:", existingConfigError)
    return buildValidationError("Failed to update community settings.", 500)
  }

  const saveQuery = existingConfig
    ? supabase
        .from("reply_queue_configs")
        .update(payload)
        .eq("id", existingConfig.id)
    : supabase.from("reply_queue_configs").insert(payload)

  const { error: saveError } = await saveQuery

  if (saveError) {
    console.error("Error updating community settings:", saveError)
    return buildValidationError("Failed to update community settings.", 500)
  }

  return NextResponse.json({ config })
}
