"use client"

import { create } from "zustand"

type EmailAccountEntry = { id: string; email: string }

type EmailAccountStore = {
  emailAccountDetailsById: Record<string, EmailAccountEntry>
  upsertEmailAccountDetail: (account: EmailAccountEntry) => void
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
}))
