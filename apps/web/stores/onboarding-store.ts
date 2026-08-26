"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

import { INITIAL_ONBOARDING_DATA, MAX_TARGET_KEYWORDS, type OnboardingData } from "@/consts/onboarding"

type OnboardingStore = {
  hasHydrated: boolean
  isCompleted: boolean
  currentStep: number
  data: OnboardingData
  setHasHydrated: (value: boolean) => void
  setIsCompleted: (value: boolean) => void
  setCurrentStep: (step: number) => void
  updateData: (updates: Partial<OnboardingData>) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      hasHydrated: false,
      isCompleted: false,
      currentStep: 0,
      data: INITIAL_ONBOARDING_DATA,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setIsCompleted: (value) => set({ isCompleted: value }),
      setCurrentStep: (step) => set({ currentStep: step }),
      updateData: (updates) =>
        set((state) => ({
          data: { ...state.data, ...updates },
        })),
      reset: () => set({ currentStep: 0, isCompleted: false, data: INITIAL_ONBOARDING_DATA }),
    }),
    {
      name: "mentions-onboarding-progress",
      // v4: added the optional paywall as an 8th step (index 7). No
      // OnboardingData shape change, so migrate just carries state forward.
      // Existing accounts clamp a stale paywall index back to Launch.
      version: 4,
      partialize: (state) => ({
        currentStep: state.currentStep,
        isCompleted: state.isCompleted,
        data: state.data,
      }),
      migrate: (persisted) => {
        const state = persisted as {
          currentStep?: number
          isCompleted?: boolean
          data?: Record<string, unknown>
        }
        const rest = { ...(state.data ?? {}) }
        delete rest.resourceMode
        delete rest.resourceUrls

        // The keyword cap dropped from 10 to 5 (array order is now
        // priority). Truncate instead of wiping, so anyone mid-onboarding
        // with more than 5 saved isn't dropped back to zero.
        const targetKeywords = Array.isArray(rest.targetKeywords)
          ? (rest.targetKeywords as string[]).slice(0, MAX_TARGET_KEYWORDS)
          : []

        return {
          currentStep: state.currentStep ?? 0,
          isCompleted: state.isCompleted ?? false,
          data: {
            ...INITIAL_ONBOARDING_DATA,
            ...rest,
            targetKeywords,
          },
        }
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
