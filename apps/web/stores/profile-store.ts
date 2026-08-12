"use client"

import { create } from "zustand"

import type { Tables } from "@workspace/supabase/database-types"

export type DashboardProfile = Pick<
  Tables<"profiles">,
  | "id"
  | "email"
  | "name"
  | "onboarding_completed"
  | "tier"
  | "active_trial"
  | "billing_period_end_at"
  | "email_settings"
  | "walkthrough_seen_at"
>

type ProfileStore = {
  profile: DashboardProfile | null
  optimisticTier: DashboardProfile["tier"] | null
  setProfile: (profile: DashboardProfile | null) => void
  optimisticallySetTier: (tier: DashboardProfile["tier"]) => void
  /**
   * Marks the walkthrough as seen locally so it doesn't re-open on the next
   * client navigation, before the server profile is re-fetched.
   */
  markWalkthroughSeenLocally: (seenAt: string) => void
  clearProfile: () => void
}

export const useProfileStore = create<ProfileStore>()((set) => ({
  profile: null,
  optimisticTier: null,
  setProfile: (profile) =>
    set((state) => {
      if (!state.optimisticTier || !profile) {
        return { profile }
      }

      if (profile.tier === state.optimisticTier) {
        return { profile, optimisticTier: null }
      }

      return {
        profile: {
          ...profile,
          tier: state.optimisticTier,
          active_trial: false,
        },
      }
    }),
  optimisticallySetTier: (tier) =>
    set((state) => {
      if (state.profile?.tier === tier && state.optimisticTier === null) {
        return state
      }

      return {
        optimisticTier: tier,
        profile: state.profile
          ? { ...state.profile, tier, active_trial: false }
          : null,
      }
    }),
  markWalkthroughSeenLocally: (seenAt) =>
    set((state) =>
      state.profile && state.profile.walkthrough_seen_at === null
        ? { profile: { ...state.profile, walkthrough_seen_at: seenAt } }
        : state
    ),
  clearProfile: () => set({ profile: null, optimisticTier: null }),
}))
