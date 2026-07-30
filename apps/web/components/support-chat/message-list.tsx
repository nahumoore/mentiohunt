import { format, isSameDay } from "date-fns"
import { useEffect, useRef } from "react"

import type { SupportMessageRow } from "@/lib/support-chat/types"

import { MessageBubble } from "./message-bubble"

export function MessageList({ messages }: { messages: SupportMessageRow[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [messages.length])

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
      {messages.map((message, index) => {
        const previous = messages[index - 1]
        const showDaySeparator =
          !previous || !isSameDay(new Date(previous.created_at), new Date(message.created_at))

        return (
          <div key={message.id} className="flex flex-col gap-3">
            {showDaySeparator && (
              <div className="flex items-center justify-center">
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
                  {format(new Date(message.created_at), "MMM d")}
                </span>
              </div>
            )}
            <MessageBubble message={message} />
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
