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
      // v5: removed the company/role/referral-source step (was index 1) —
      // that question now lives on its own page after checkout, see
      // app/onboarding/welcome. Steps at index >= 2 shift down by one.
      version: 5,
      partialize: (state) => ({
        currentStep: state.currentStep,
        isCompleted: state.isCompleted,
        data: state.data,
      }),
      migrate: (persisted, version) => {
        const state = persisted as {
          currentStep?: number
          isCompleted?: boolean
          data?: Record<string, unknown>
        }
        const rest = { ...(state.data ?? {}) }
        delete rest.resourceMode
        delete rest.resourceUrls
        delete rest.companySize
        delete rest.role
        delete rest.referralSource

        // The keyword cap dropped from 10 to 5 (array order is now
        // priority). Truncate instead of wiping, so anyone mid-onboarding
        // with more than 5 saved isn't dropped back to zero.
        const targetKeywords = Array.isArray(rest.targetKeywords)
          ? (rest.targetKeywords as string[]).slice(0, MAX_TARGET_KEYWORDS)
          : []

        const oldStep = state.currentStep ?? 0
        const currentStep = version < 5 && oldStep >= 2 ? oldStep - 1 : oldStep

        return {
          currentStep,
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
