"use client"

import { create } from "zustand"

import type { DiscoveryStatus } from "@/hooks/use-discovery-progress"

type DiscoveryStatusStore = {
  status: DiscoveryStatus | null
  setStatus: (status: DiscoveryStatus | null) => void
}

export const useDiscoveryStatusStore = create<DiscoveryStatusStore>()((set) => ({
  status: null,
  setStatus: (status) => set({ status }),
}))
