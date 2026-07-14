"use client"

import { create } from "zustand"

type EmailAccountEntry = { id: string; email: string }

type EmailAccountStore = {
  emailAccountDetailsById: Record<string, EmailAccountEntry>
  upsertEmailAccountDetail: (account: EmailAccountEntry) => void
  /**
   * Whether the current user has at least one active, personal (non-pool)
   * connected mailbox. `null` = not yet known / not applicable (e.g. free
   * tier, which sends from the shared pool and never needs this check).
   */
  hasActiveEmailAccount: boolean | null
  setHasActiveEmailAccount: (hasActiveEmailAccount: boolean | null) => void
}

export const useEmailAccountStore = create<EmailAccountStore>((set) => ({
  emailAccountDetailsById: {},
  upsertEmailAccountDetail: (account) =>
    set((state) => ({
      emailAccountDetailsById: {
        ...state.emailAccountDetailsById,
        [account.id]: account,
      },
    })),
  hasActiveEmailAccount: null,
  setHasActiveEmailAccount: (hasActiveEmailAccount) =>
    set({ hasActiveEmailAccount }),
}))
