"use client"

import { create } from "zustand"

type OutreachActivityStore = {
  /** ISO timestamps of outreach sends (prospect_sequences.sent_at), most recent first. */
  sentAt: string[]
  setSentAt: (sentAt: string[]) => void
}

export const useOutreachActivityStore = create<OutreachActivityStore>()(
  (set) => ({
    sentAt: [],
    setSentAt: (sentAt) => set({ sentAt }),
  })
)
