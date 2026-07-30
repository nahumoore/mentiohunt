"use client"

import { IconX } from "@tabler/icons-react"

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"

import type { useSupportChat } from "./use-support-chat"
import { Composer } from "./composer"
import { EmailCapture } from "./email-capture"
import { MessageList } from "./message-list"

export function ChatPanel({ chat }: { chat: ReturnType<typeof useSupportChat> }) {
  const {
    conversation,
    messages,
    identity,
    emailCaptureDismissed,
    dismissEmailCapture,
    sendMessage,
    submitEmail,
    setOpen,
  } = chat

  const showEmailCapture =
    messages.length > 0 &&
    !identity &&
    !conversation?.email &&
    !emailCaptureDismissed

  return (
    <div className="flex h-[min(600px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Avatar>
            <AvatarImage src="/founder.webp" alt="Nicolas" />
            <AvatarFallback>N</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-heading text-sm font-semibold">Chat with Nicolas</p>
            <p className="text-xs text-muted-foreground">Usually replies within a day</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close chat"
        >
          <IconX className="size-4" />
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-6 text-center">
          <p className="font-heading text-sm font-semibold">Say hello 👋</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Questions about a page, an opportunity, or your account — send a message and
            Nicolas will get back to you personally.
          </p>
        </div>
      ) : (
        <MessageList messages={messages} />
      )}

      {showEmailCapture && (
        <EmailCapture onSubmit={submitEmail} onDismiss={dismissEmailCapture} />
      )}

      <Composer onSend={sendMessage} />
    </div>
  )
}
