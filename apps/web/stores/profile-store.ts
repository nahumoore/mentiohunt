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
>

type ProfileStore = {
  profile: DashboardProfile | null
  setProfile: (profile: DashboardProfile | null) => void
  clearProfile: () => void
}

export const useProfileStore = create<ProfileStore>()((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  clearProfile: () => set({ profile: null }),
}))
