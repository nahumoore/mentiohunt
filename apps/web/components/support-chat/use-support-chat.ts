"use client"

import { useCallback, useEffect, useRef } from "react"

import {
  getDeviceSnapshot,
  getEntrySnapshot,
  hasActiveThreadCookie,
} from "@/lib/support-chat/client-context"
import type {
  ConversationAccountSnapshot,
  SupportConversationRow,
  SupportMessageRow,
} from "@/lib/support-chat/types"
import { useSupportChatStore } from "@/stores/support-chat-store"

const OPEN_POLL_MS = 3000
const BACKGROUND_POLL_MS = 30000

function buildContextPayload(path: string) {
  const entry = getEntrySnapshot()
  const device = getDeviceSnapshot()
  return {
    path,
    title: typeof document !== "undefined" ? document.title : undefined,
    entryUrl: entry?.entryUrl,
    referrer: entry?.referrer,
    utm: entry?.utm,
    ...device,
  }
}

type BootstrapResponse = {
  conversation: SupportConversationRow | null
  messages: SupportMessageRow[]
  identity: ConversationAccountSnapshot | null
}

/**
 * Drives the widget: bootstraps a conversation lazily (only when the
 * launcher opens, or when a thread already exists per the visitor cookie),
 * polls for founder replies instead of using Supabase realtime (which would
 * require permissive RLS for anonymous visitors), and sends messages
 * optimistically.
 */
export function useSupportChat(currentPath: string) {
  const isOpen = useSupportChatStore((s) => s.isOpen)
  const hasBootstrapped = useSupportChatStore((s) => s.hasBootstrapped)
  const conversation = useSupportChatStore((s) => s.conversation)
  const messages = useSupportChatStore((s) => s.messages)
  const identity = useSupportChatStore((s) => s.identity)
  const emailCaptureDismissed = useSupportChatStore((s) => s.emailCaptureDismissed)
  const lastSeenMessageId = useSupportChatStore((s) => s.lastSeenMessageId)
  const setOpen = useSupportChatStore((s) => s.setOpen)
  const toggleOpen = useSupportChatStore((s) => s.toggleOpen)
  const setBootstrap = useSupportChatStore((s) => s.setBootstrap)
  const setConversation = useSupportChatStore((s) => s.setConversation)
  const appendMessages = useSupportChatStore((s) => s.appendMessages)
  const addOptimisticMessage = useSupportChatStore((s) => s.addOptimisticMessage)
  const removeMessage = useSupportChatStore((s) => s.removeMessage)
  const dismissEmailCapture = useSupportChatStore((s) => s.dismissEmailCapture)
  const markSeen = useSupportChatStore((s) => s.markSeen)

  const sinceRef = useRef<string | null>(null)
  const latestPathRef = useRef(currentPath)
  useEffect(() => {
    latestPathRef.current = currentPath
  }, [currentPath])

  const bootstrap = useCallback(async () => {
    try {
      const res = await fetch("/api/support-chat", { credentials: "include" })
      if (!res.ok) return
      const data: BootstrapResponse = await res.json()
      setBootstrap(data)
      const last = data.messages[data.messages.length - 1]
      if (last) sinceRef.current = last.created_at
    } catch {
      // Chat is a non-critical surface — fail silently, the next poll/open retries.
    }
  }, [setBootstrap])

  useEffect(() => {
    if (hasBootstrapped) return
    if (isOpen || hasActiveThreadCookie()) {
      bootstrap()
    }
  }, [isOpen, hasBootstrapped, bootstrap])

  const poll = useCallback(async () => {
    if (document.hidden) return
    try {
      const query = sinceRef.current
        ? `?since=${encodeURIComponent(sinceRef.current)}`
        : ""
      const res = await fetch(`/api/support-chat/messages${query}`, {
        credentials: "include",
      })
      if (!res.ok) return
      const data: { conversation: SupportConversationRow | null; messages: SupportMessageRow[] } =
        await res.json()
      if (data.conversation) setConversation(data.conversation)
      const last = data.messages.at(-1)
      if (last) {
        appendMessages(data.messages)
        sinceRef.current = last.created_at
      }
    } catch {
      // Silent — the next interval tick retries.
    }
  }, [appendMessages, setConversation])

  useEffect(() => {
    if (!hasBootstrapped || !conversation) return

    const intervalMs = isOpen ? OPEN_POLL_MS : BACKGROUND_POLL_MS
    const id = setInterval(poll, intervalMs)
    return () => clearInterval(id)
  }, [hasBootstrapped, conversation, isOpen, poll])

  // Mark messages as seen while the panel is open, so the unread dot
  // reflects only replies that arrived while the visitor wasn't looking.
  useEffect(() => {
    const last = messages.at(-1)
    if (!isOpen || !last) return
    markSeen(last.id)
  }, [isOpen, messages, markSeen])

  const sendMessage = useCallback(
    async (body: string) => {
      const tempId = `temp-${Math.random().toString(36).slice(2)}`
      const optimisticMessage: SupportMessageRow = {
        id: tempId,
        conversation_id: conversation?.id ?? "",
        sender: "visitor",
        body,
        page_url: latestPathRef.current,
        created_at: new Date().toISOString(),
      }
      addOptimisticMessage(optimisticMessage)

      try {
        const res = await fetch("/api/support-chat/messages", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body,
            context: buildContextPayload(latestPathRef.current),
          }),
        })

        if (!res.ok) {
          removeMessage(tempId)
          return false
        }

        const data: { conversation: SupportConversationRow; message: SupportMessageRow } =
          await res.json()
        removeMessage(tempId)
        setConversation(data.conversation)
        appendMessages([data.message])
        sinceRef.current = data.message.created_at
        return true
      } catch {
        removeMessage(tempId)
        return false
      }
    },
    [conversation?.id, addOptimisticMessage, removeMessage, setConversation, appendMessages]
  )

  const submitEmail = useCallback(
    async (email: string, name?: string) => {
      try {
        const res = await fetch("/api/support-chat/identify", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name }),
        })
        if (!res.ok) return false
        setConversation(
          conversation ? { ...conversation, email, name: name ?? null } : conversation
        )
        return true
      } catch {
        return false
      }
    },
    [conversation, setConversation]
  )

  const latestMessage = messages[messages.length - 1]
  const hasUnread =
    !isOpen &&
    !!latestMessage &&
    latestMessage.sender === "agent" &&
    latestMessage.id !== lastSeenMessageId

  return {
    isOpen,
    setOpen,
    toggleOpen,
    conversation,
    messages,
    identity,
    emailCaptureDismissed,
    dismissEmailCapture,
    sendMessage,
    submitEmail,
    hasUnread,
  }
}
