import { useEmailAccountStore } from "@/stores/email-account-store"
import { useProfileStore } from "@/stores/profile-store"
import { useProspectStore } from "@/stores/prospect-store"

export type OutreachState = "live" | "mailbox_paused" | "pool_paused"

/**
 * Derives whether automatic outreach is currently sending for this user.
 *
 * Free tier (including trial) sends from the shared mailbox pool and never
 * needs a personal connection, so it's paused only when that pool hits its
 * daily cap. Paid tiers need an active personal mailbox instead.
 *
 * Shared by the header "How it works" explainer and the first-login welcome
 * tour so both surfaces agree on the same status.
 */
export function useOutreachState(): OutreachState {
  const profile = useProfileStore((state) => state.profile)
  const hasActiveEmailAccount = useEmailAccountStore(
    (state) => state.hasActiveEmailAccount
  )
  const poolDelayedCount = useProspectStore((state) => state.poolDelayedCount)

  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"
  const poolAtCapacity = profile?.tier === "free" && poolDelayedCount > 0

  if (isPaid && hasActiveEmailAccount !== true) return "mailbox_paused"
  if (poolAtCapacity) return "pool_paused"
  return "live"
}
