import { supabaseServer } from "@/lib/supabase/server"

export type WonStats = {
  /** 1-based position of this prospect among all of the user's wins, ordered
   * by when each was won. */
  ordinal: number
  totalWonCount: number
  totalDrEarned: number
}

/** Computes the win card's stats for a prospect that has already been marked
 * "won". Ordered by `won_at`, falling back to `created_at` for rows won
 * before that column existed. */
export async function getWonStats(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  userId: string,
  currentProspectId: string
): Promise<WonStats> {
  const { data: products } = await supabase.from("products").select("id").eq("user_id", userId)

  const productIds = (products ?? []).map((p) => p.id)
  if (productIds.length === 0) {
    return { ordinal: 1, totalWonCount: 1, totalDrEarned: 0 }
  }

  const { data: won } = await supabase
    .from("backlink_prospects")
    .select("id, domain_rating, won_at, created_at")
    .eq("status", "won")
    .in("product_id", productIds)

  const rows = won ?? []
  const sorted = [...rows].sort(
    (a, b) =>
      new Date(a.won_at ?? a.created_at).getTime() - new Date(b.won_at ?? b.created_at).getTime()
  )

  const index = sorted.findIndex((r) => r.id === currentProspectId)
  const ordinal = index === -1 ? sorted.length : index + 1
  const totalDrEarned = sorted.reduce((sum, r) => sum + (r.domain_rating ?? 0), 0)

  return { ordinal, totalWonCount: sorted.length, totalDrEarned }
}
