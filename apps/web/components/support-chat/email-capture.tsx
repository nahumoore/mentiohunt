"use client"

import { IconX } from "@tabler/icons-react"
import { useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

export function EmailCapture({
  onSubmit,
  onDismiss,
}: {
  onSubmit: (email: string) => Promise<boolean>
  onDismiss: () => void
}) {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (submitted) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setIsSubmitting(true)
    const ok = await onSubmit(email.trim())
    setIsSubmitting(false)
    if (ok) setSubmitted(true)
  }

  return (
    <div className="mx-4 mb-3 rounded-2xl border border-border/60 bg-muted/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Leave your email so we can get back to you if you step away.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <IconX className="size-3.5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="mt-2 flex gap-1.5">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="h-8 text-xs"
          required
        />
        <Button type="submit" size="sm" disabled={isSubmitting}>
          Save
        </Button>
      </form>
    </div>
  )
}
