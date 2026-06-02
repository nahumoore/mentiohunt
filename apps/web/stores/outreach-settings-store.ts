"use client"

import { create } from "zustand"

export type OutreachSettings = {
  voiceTone: string
  offering: string
}

type OutreachSettingsStore = {
  settings: OutreachSettings | null
  setSettings: (settings: OutreachSettings | null) => void
  updateSettings: (patch: Partial<OutreachSettings>) => void
  clearSettings: () => void
}

export const useOutreachSettingsStore = create<OutreachSettingsStore>()(
  (set) => ({
    settings: null,
    setSettings: (settings) => set({ settings }),
    updateSettings: (patch) =>
      set((state) => ({
        settings: state.settings ? { ...state.settings, ...patch } : null,
      })),
    clearSettings: () => set({ settings: null }),
  })
)
