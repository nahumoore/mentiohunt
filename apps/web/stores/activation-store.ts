"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

import { captureEvent } from "@/lib/analytics"

/**
 * Steps that prove a new user understands the product. Deliberately persisted
 * rather than derived: the point is that a user who signs up, gets pulled away
 * for a week, and comes back still sees where they left off.
 *
 * Mailbox connection isn't here — it's derived live from the email account
 * store, since it can be revoked.
 */
export type ActivationStep =
  | "reviewed_competitors"
  | "reviewed_pages"
  | "opened_prospect"
  | "dismissed_prospect"

type ActivationStore = {
  hasHydrated: boolean
  completed: ActivationStep[]
  checklistDismissed: boolean
  setHasHydrated: (value: boolean) => void
  complete: (step: ActivationStep) => void
  dismissChecklist: () => void
}

export const useActivationStore = create<ActivationStore>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      completed: [],
      checklistDismissed: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      complete: (step) => {
        if (get().completed.includes(step)) return

        // Fired here rather than at the call sites so the "first time only"
        // guarantee lives in one place — call sites fire on every visit.
        captureEvent("activation_step_completed", { step })
        set((state) => ({ completed: [...state.completed, step] }))
      },
      dismissChecklist: () => {
        if (get().checklistDismissed) return

        captureEvent("activation_checklist_dismissed", {
          completed_count: get().completed.length,
        })
        set({ checklistDismissed: true })
      },
    }),
    {
      name: "mentiohunt-activation",
      partialize: (state) => ({
        completed: state.completed,
        checklistDismissed: state.checklistDismissed,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
