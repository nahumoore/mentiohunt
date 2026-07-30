import { format } from "date-fns"

import { cn } from "@workspace/ui/lib/utils"

import type { SupportMessageRow } from "@/lib/support-chat/types"

export function MessageBubble({ message }: { message: SupportMessageRow }) {
  const isVisitor = message.sender === "visitor"

  return (
    <div className={cn("flex flex-col gap-1", isVisitor ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words",
          isVisitor
            ? "rounded-br-sm bg-blaze-orange text-white"
            : "rounded-bl-sm bg-muted text-foreground"
        )}
      >
        {message.body}
      </div>
      <span className="px-1 text-[0.7rem] text-muted-foreground">
        {format(new Date(message.created_at), "h:mm a")}
      </span>
    </div>
  )
}
