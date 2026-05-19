"use client"

import { create } from "zustand"

import type {
  CommunityMention,
  MentionStatus,
} from "@/app/dashboard/community-mentions/reply-queue/_data"

type CommunityMentionStore = {
  mentions: CommunityMention[]
  isLoading: boolean
  hasRunningRun: boolean
  setMentions: (mentions: CommunityMention[]) => void
  setHasRunningRun: (value: boolean) => void
  updateMentionStatus: (mentionId: string, status: MentionStatus) => void
  clearMentions: () => void
}

export const useCommunityMentionStore = create<CommunityMentionStore>()(
  (set) => ({
    mentions: [],
    isLoading: true,
    hasRunningRun: false,
    setMentions: (mentions) => set({ mentions, isLoading: false }),
    setHasRunningRun: (value) => set({ hasRunningRun: value }),
    updateMentionStatus: (mentionId, status) =>
      set((state) => ({
        mentions: state.mentions.map((mention) =>
          mention.id === mentionId ? { ...mention, status } : mention
        ),
      })),
    clearMentions: () => set({ mentions: [], isLoading: false }),
  })
)

export type { CommunityMention }
