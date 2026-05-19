"use client"

import { create } from "zustand"

export type BacklinkNetworkMembership = {
  isEnabled: boolean
  contactEmail: string
  updatedAt: string | null
}

type BacklinkNetworkStore = {
  membership: BacklinkNetworkMembership | null
  setMembership: (membership: BacklinkNetworkMembership | null) => void
}

export const useBacklinkNetworkStore = create<BacklinkNetworkStore>()((set) => ({
  membership: null,
  setMembership: (membership) => set({ membership }),
}))
