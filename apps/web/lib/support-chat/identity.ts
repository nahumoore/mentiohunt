import { supabaseServer } from "@/lib/supabase/server"

import type { ConversationAccountSnapshot } from "./types"

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

/**
 * Reads the logged-in user's account context server-side, for both the
 * conversation metadata snapshot and pre-filling email/name — never trusted
 * from the client, since a visitor could otherwise claim any identity.
 * Returns null for anonymous visitors.
 */
export async function getViewerAccountSnapshot(): Promise<ConversationAccountSnapshot | null> {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: profile }, { data: product }] = await Promise.all([
    supabase
      .from("profiles")
      .select("email, name, tier, active_trial, onboarding_completed")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("products")
      .select("website_url")
      .eq("user_id", user.id)
      .maybeSingle(),
  ])

  return {
    user_id: user.id,
    email: profile?.email ?? user.email ?? "",
    name: profile?.name ?? null,
    tier: profile?.tier ?? "free",
    active_trial: profile?.active_trial ?? false,
    onboarding_completed: profile?.onboarding_completed ?? false,
    product_domain: product?.website_url
      ? hostnameFromUrl(product.website_url)
      : null,
  }
}
