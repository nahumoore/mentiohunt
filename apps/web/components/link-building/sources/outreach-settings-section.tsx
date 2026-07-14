"use client"

import type { ReactNode } from "react"

import { Textarea } from "@workspace/ui/components/textarea"

import type { OutreachSettings } from "@/stores/outreach-settings-store"

function FieldBlock({
  label,
  description,
  value,
  onChange,
  rows,
}: {
  label: string
  description: string
  value: string
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-border/70 px-5 py-5 last:border-b-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows ?? 5}
        className="resize-none bg-muted/30 text-sm leading-6"
      />
    </div>
  )
}

export function OutreachSettingsSection({
  settings,
  onUpdate,
  footer,
}: {
  settings: OutreachSettings
  onUpdate: (patch: Partial<OutreachSettings>) => void
  footer: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
      <div className="border-b border-border/70 px-5 py-4">
        <p className="text-sm font-medium">Email generation settings</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          These instructions guide how outreach emails are written for each
          opportunity.
        </p>
      </div>

      <FieldBlock
        label="Voice & tone"
        description="Describe how the email should sound. The AI uses this to match your writing style."
        value={settings.voiceTone}
        onChange={(v) => onUpdate({ voiceTone: v })}
        rows={5}
      />

      <FieldBlock
        label="What you're offering"
        description="List what you're willing to give in exchange for the backlink. The AI will weave this naturally into the outreach."
        value={settings.offering}
        onChange={(v) => onUpdate({ offering: v })}
        rows={6}
      />

      {footer}
    </div>
  )
}
