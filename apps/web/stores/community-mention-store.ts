"use client"

import { create } from "zustand"

import type {
  CommunityMention,
  MentionStatus,
} from "@/app/dashboard/mentions/_data"

type CommunityMentionStore = {
  mentions: CommunityMention[]
  isLoading: boolean
  hasRunningRun: boolean
  hasCompletedRun: boolean
  hasReplyQueueConfig: boolean
  setMentions: (mentions: CommunityMention[]) => void
  setHasRunningRun: (value: boolean) => void
  setHasCompletedRun: (value: boolean) => void
  setHasReplyQueueConfig: (value: boolean) => void
  updateMentionStatus: (mentionId: string, status: MentionStatus) => void
  clearMentions: () => void
}

export const useCommunityMentionStore = create<CommunityMentionStore>()(
  (set) => ({
    mentions: [],
    isLoading: true,
    hasRunningRun: false,
    hasCompletedRun: false,
    hasReplyQueueConfig: false,
    setMentions: (mentions) => set({ mentions, isLoading: false }),
    setHasRunningRun: (value) => set({ hasRunningRun: value }),
    setHasCompletedRun: (value) => set({ hasCompletedRun: value }),
    setHasReplyQueueConfig: (value) => set({ hasReplyQueueConfig: value }),
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
