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
  setProfile: (profile: DashboardProfile | null) => void
  /**
   * Marks the walkthrough as seen locally so it doesn't re-open on the next
   * client navigation, before the server profile is re-fetched.
   */
  markWalkthroughSeenLocally: (seenAt: string) => void
  clearProfile: () => void
}

export const useProfileStore = create<ProfileStore>()((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  markWalkthroughSeenLocally: (seenAt) =>
    set((state) =>
      state.profile && state.profile.walkthrough_seen_at === null
        ? { profile: { ...state.profile, walkthrough_seen_at: seenAt } }
        : state
    ),
  clearProfile: () => set({ profile: null }),
}))
