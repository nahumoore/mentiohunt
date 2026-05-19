"use client"

import { create } from "zustand"

import type { OpportunityType } from "@/lib/opportunity-types"

export type DiscoverySettings = {
  opportunityTypes: OpportunityType[]
  drMin: number
  drMax: number | null
}

type DiscoverySettingsStore = {
  settings: DiscoverySettings | null
  setSettings: (settings: DiscoverySettings | null) => void
  updateSettings: (settings: Partial<DiscoverySettings>) => void
  clearSettings: () => void
}

export const useDiscoverySettingsStore = create<DiscoverySettingsStore>()(
  (set) => ({
    settings: null,
    setSettings: (settings) => set({ settings }),
    updateSettings: (settings) =>
      set((state) => ({
        settings: state.settings ? { ...state.settings, ...settings } : null,
      })),
    clearSettings: () => set({ settings: null }),
  })
)
