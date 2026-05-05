"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

import { INITIAL_ONBOARDING_DATA, type OnboardingData } from "@/consts/onboarding"

type OnboardingStore = {
  hasHydrated: boolean
  currentStep: number
  data: OnboardingData
  setHasHydrated: (value: boolean) => void
  setCurrentStep: (step: number) => void
  updateData: (updates: Partial<OnboardingData>) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      hasHydrated: false,
      currentStep: 0,
      data: INITIAL_ONBOARDING_DATA,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setCurrentStep: (step) => set({ currentStep: step }),
      updateData: (updates) =>
        set((state) => ({
          data: { ...state.data, ...updates },
        })),
      reset: () => set({ currentStep: 0, data: INITIAL_ONBOARDING_DATA }),
    }),
    {
      name: "mentions-onboarding-progress",
      partialize: (state) => ({
        currentStep: state.currentStep,
        data: state.data,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
