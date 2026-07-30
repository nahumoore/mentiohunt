"use client"

import { create } from "zustand"

import type {
  ConversationAccountSnapshot,
  SupportConversationRow,
  SupportMessageRow,
} from "@/lib/support-chat/types"

type SupportChatStore = {
  isOpen: boolean
  hasBootstrapped: boolean
  conversation: SupportConversationRow | null
  messages: SupportMessageRow[]
  identity: ConversationAccountSnapshot | null
  emailCaptureDismissed: boolean
  /** Id of the latest message the visitor has seen (panel was open when it arrived). */
  lastSeenMessageId: string | null
  setOpen: (open: boolean) => void
  toggleOpen: () => void
  setBootstrap: (data: {
    conversation: SupportConversationRow | null
    messages: SupportMessageRow[]
    identity: ConversationAccountSnapshot | null
  }) => void
  setConversation: (conversation: SupportConversationRow | null) => void
  appendMessages: (messages: SupportMessageRow[]) => void
  addOptimisticMessage: (message: SupportMessageRow) => void
  removeMessage: (id: string) => void
  dismissEmailCapture: () => void
  markSeen: (messageId: string | null) => void
}

export const useSupportChatStore = create<SupportChatStore>()((set) => ({
  isOpen: false,
  hasBootstrapped: false,
  conversation: null,
  messages: [],
  identity: null,
  emailCaptureDismissed: false,
  lastSeenMessageId: null,
  setOpen: (open) => set({ isOpen: open }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setBootstrap: ({ conversation, messages, identity }) =>
    set({ conversation, messages, identity, hasBootstrapped: true }),
  setConversation: (conversation) => set({ conversation }),
  appendMessages: (incoming) =>
    set((state) => {
      if (incoming.length === 0) return state
      const existingIds = new Set(state.messages.map((message) => message.id))
      const deduped = incoming.filter((message) => !existingIds.has(message.id))
      if (deduped.length === 0) return state
      return { messages: [...state.messages, ...deduped] }
    }),
  addOptimisticMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  removeMessage: (id) =>
    set((state) => ({ messages: state.messages.filter((m) => m.id !== id) })),
  dismissEmailCapture: () => set({ emailCaptureDismissed: true }),
  markSeen: (messageId) => set({ lastSeenMessageId: messageId }),
}))
