"use client"

import { IconArrowUp } from "@tabler/icons-react"
import { useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"

export function Composer({
  onSend,
}: {
  onSend: (body: string) => Promise<boolean>
}) {
  const [value, setValue] = useState("")
  const [isSending, setIsSending] = useState(false)

  async function handleSend() {
    const body = value.trim()
    if (!body || isSending) return
    setIsSending(true)
    setValue("")
    const ok = await onSend(body)
    if (!ok) setValue(body)
    setIsSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-border/60 p-3">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write a message…"
        rows={1}
        className="min-h-9 max-h-32 py-2 text-sm"
      />
      <Button
        type="button"
        size="icon"
        className="shrink-0 rounded-full"
        disabled={!value.trim() || isSending}
        onClick={handleSend}
        aria-label="Send message"
      >
        <IconArrowUp />
      </Button>
    </div>
  )
}
