"use client"

import {
  IconCircleCheck,
  IconExternalLink,
  IconMail,
  IconRefresh,
  IconUser,
} from "@tabler/icons-react"
import { format, formatDistanceToNow } from "date-fns"
import { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@workspace/ui/components/button"

import type {
  ConversationMetadata,
  SupportConversationRow,
  SupportMessageRow,
} from "@/lib/support-chat/types"

import { Composer } from "@/components/support-chat/composer"
import { MessageList } from "@/components/support-chat/message-list"

const LIST_POLL_MS = 5000

type StatusFilter = "open" | "closed" | "all"

function conversationLabel(conversation: SupportConversationRow) {
  if (conversation.name && conversation.email) {
    return `${conversation.name} (${conversation.email})`
  }
  if (conversation.email) return conversation.email
  if (conversation.user_id) return "Logged-in visitor"
  return "Anonymous visitor"
}

function isUnread(conversation: SupportConversationRow) {
  if (!conversation.last_visitor_message_at) return false
  if (!conversation.agent_read_at) return true
  return (
    new Date(conversation.last_visitor_message_at) > new Date(conversation.agent_read_at)
  )
}

export function SupportConsole({
  initialConversations,
}: {
  initialConversations: SupportConversationRow[]
}) {
  const [conversations, setConversations] = useState(initialConversations)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open")
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversations[0]?.id ?? null
  )
  const [messages, setMessages] = useState<SupportMessageRow[]>([])
  const [isLoadingThread, setIsLoadingThread] = useState(false)

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId]
  )

  const refreshList = useCallback(async (filter: StatusFilter) => {
    const res = await fetch(`/api/support-chat/admin/conversations?status=${filter}`)
    if (!res.ok) return
    const data: { conversations: SupportConversationRow[] } = await res.json()
    setConversations(data.conversations)
  }, [])

  useEffect(() => {
    refreshList(statusFilter)
    const id = setInterval(() => refreshList(statusFilter), LIST_POLL_MS)
    return () => clearInterval(id)
  }, [statusFilter, refreshList])

  const loadThread = useCallback(async (id: string) => {
    setIsLoadingThread(true)
    const res = await fetch(`/api/support-chat/admin/conversations/${id}`)
    if (res.ok) {
      const data: { conversation: SupportConversationRow; messages: SupportMessageRow[] } =
        await res.json()
      setMessages(data.messages)
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? data.conversation : c))
      )
    }
    setIsLoadingThread(false)
    await fetch(`/api/support-chat/admin/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markRead: true }),
    })
  }, [])

  useEffect(() => {
    if (selectedId) loadThread(selectedId)
  }, [selectedId, loadThread])

  // Poll the open thread for new messages while it's selected.
  useEffect(() => {
    if (!selectedId) return
    const id = setInterval(async () => {
      const res = await fetch(`/api/support-chat/admin/conversations/${selectedId}`)
      if (!res.ok) return
      const data: { conversation: SupportConversationRow; messages: SupportMessageRow[] } =
        await res.json()
      setMessages(data.messages)
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedId ? data.conversation : c))
      )
    }, LIST_POLL_MS)
    return () => clearInterval(id)
  }, [selectedId])

  async function handleReply(body: string) {
    if (!selectedId) return false
    const res = await fetch(`/api/support-chat/admin/conversations/${selectedId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    })
    if (!res.ok) return false
    const data: { message: SupportMessageRow } = await res.json()
    setMessages((prev) => [...prev, data.message])
    refreshList(statusFilter)
    return true
  }

  async function handleStatusChange(status: "open" | "closed") {
    if (!selected) return
    const res = await fetch(`/api/support-chat/admin/conversations/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) refreshList(statusFilter)
  }

  const metadata = (selected?.metadata ?? {}) as ConversationMetadata

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Conversation list */}
      <div className="flex w-72 shrink-0 flex-col border-r border-border/60">
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-3">
          <p className="font-heading text-sm font-semibold">Support chat</p>
          <button
            type="button"
            onClick={() => refreshList(statusFilter)}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            aria-label="Refresh"
          >
            <IconRefresh className="size-4" />
          </button>
        </div>
        <div className="flex gap-1 border-b border-border/60 px-3 py-2">
          {(["open", "closed", "all"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                statusFilter === filter
                  ? "bg-blaze-orange text-white"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              No conversations yet.
            </p>
          )}
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => setSelectedId(conversation.id)}
              className={`flex w-full flex-col gap-0.5 border-b border-border/40 px-3 py-2.5 text-left ${
                conversation.id === selectedId ? "bg-muted" : "hover:bg-muted/50"
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                {isUnread(conversation) && (
                  <span className="size-1.5 shrink-0 rounded-full bg-brand-error" />
                )}
                <span className="truncate">{conversationLabel(conversation)}</span>
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {conversation.current_path ?? "—"}
              </span>
              {conversation.last_message_at && (
                <span className="text-[0.65rem] text-muted-foreground">
                  {formatDistanceToNow(new Date(conversation.last_message_at), {
                    addSuffix: true,
                  })}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Thread */}
      <div className="flex flex-1 flex-col">
        {selected ? (
          <>
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{conversationLabel(selected)}</p>
                <p className="text-xs text-muted-foreground">
                  {selected.current_path ?? "No page recorded"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleStatusChange(selected.status === "open" ? "closed" : "open")
                }
              >
                <IconCircleCheck data-icon="inline-start" />
                {selected.status === "open" ? "Close" : "Reopen"}
              </Button>
            </div>
            {isLoadingThread && messages.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Loading…
              </div>
            ) : (
              <MessageList messages={messages} />
            )}
            <Composer onSend={handleReply} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Select a conversation
          </div>
        )}
      </div>

      {/* Context panel */}
      {selected && (
        <div className="w-72 shrink-0 overflow-y-auto border-l border-border/60 p-4">
          <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Visitor
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <IconUser className="size-4 text-muted-foreground" />
              <span>{metadata.account ? "Logged in" : "Anonymous"}</span>
            </div>
            {selected.email && (
              <div className="flex items-center gap-2">
                <IconMail className="size-4 text-muted-foreground" />
                <span className="truncate">{selected.email}</span>
              </div>
            )}
            {metadata.account && (
              <div className="rounded-xl border border-border/60 p-2.5 text-xs">
                <p>
                  Tier: <span className="font-medium">{metadata.account.tier}</span>
                </p>
                <p>Active trial: {metadata.account.active_trial ? "Yes" : "No"}</p>
                <p>
                  Onboarding: {metadata.account.onboarding_completed ? "Completed" : "In progress"}
                </p>
                {metadata.account.product_domain && (
                  <p className="truncate">Product: {metadata.account.product_domain}</p>
                )}
                <a
                  href={`/dashboard`}
                  className="mt-1 flex items-center gap-1 text-blaze-orange hover:underline"
                >
                  Open dashboard <IconExternalLink className="size-3" />
                </a>
              </div>
            )}
          </div>

          <p className="mt-5 mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Session
          </p>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            {metadata.entry_url && <p className="truncate">Entry: {metadata.entry_url}</p>}
            {metadata.referrer && <p className="truncate">Referrer: {metadata.referrer}</p>}
            {metadata.utm && Object.keys(metadata.utm).length > 0 && (
              <p className="truncate">
                UTM: {Object.entries(metadata.utm).map(([k, v]) => `${k}=${v}`).join(" ")}
              </p>
            )}
            {metadata.locale && <p>Locale: {metadata.locale}</p>}
            {metadata.timezone && <p>Timezone: {metadata.timezone}</p>}
            {metadata.viewport && <p>Viewport: {metadata.viewport}</p>}
            {metadata.user_agent && <p className="truncate">{metadata.user_agent}</p>}
            <p>First seen: {format(new Date(selected.created_at), "MMM d, h:mm a")}</p>
          </div>

          {metadata.pages && metadata.pages.length > 0 && (
            <>
              <p className="mt-5 mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Page trail
              </p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {metadata.pages
                  .slice()
                  .reverse()
                  .map((page, index) => (
                    <li key={`${page.path}-${index}`} className="truncate">
                      {page.path}
                    </li>
                  ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
