"use client"

import { IconAlertTriangle } from "@tabler/icons-react"
import type { ReactNode } from "react"

import { Switch } from "@workspace/ui/components/switch"
import { Textarea } from "@workspace/ui/components/textarea"

import { SignatureBlockPreview } from "@/components/link-building/sources/signature-block-preview"
import type { OutreachSettings } from "@/stores/outreach-settings-store"

const LINK_LINE_PATTERN = /^(https?:\/\/|www\.)/i

function hasLink(text: string): boolean {
  return text.split("\n").some((line) => LINK_LINE_PATTERN.test(line.trim()))
}

function FieldBlock({
  label,
  description,
  value,
  onChange,
  rows,
  placeholder,
}: {
  label: string
  description: string
  value: string
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
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
        placeholder={placeholder}
        className="resize-none text-sm leading-6"
      />
    </div>
  )
}

export function OutreachSettingsSection({
  settings,
  onUpdate,
  footer,
  productName,
  productWebsite,
}: {
  settings: OutreachSettings
  onUpdate: (patch: Partial<OutreachSettings>) => void
  footer: ReactNode
  productName?: string
  productWebsite?: string
}) {
  function handleSignatureToggle(enabled: boolean) {
    const patch: Partial<OutreachSettings> = { signatureEnabled: enabled }
    // Prefill from the connected product on first enable, not on every
    // render, so a user who clears the field doesn't have it silently refilled.
    if (enabled && !settings.signatureText.trim()) {
      const defaultText = [productName, productWebsite].filter(Boolean).join("\n")
      if (defaultText) patch.signatureText = defaultText
    }
    onUpdate(patch)
  }

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

      <div className="flex flex-col gap-4 border-b border-border/70 px-5 py-5 last:border-b-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Signature</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              Add a branded signature to every outreach email, below the
              sign-off. Applies to emails already drafted too, not just new
              ones.
            </p>
          </div>
          <Switch
            checked={settings.signatureEnabled}
            onCheckedChange={handleSignatureToggle}
            className="shrink-0"
          />
        </div>

        {settings.signatureEnabled && (
          <div className="flex flex-col gap-3">
            <Textarea
              value={settings.signatureText}
              onChange={(e) => onUpdate({ signatureText: e.target.value })}
              placeholder={"Acme Inc.\nFounder, Acme Inc.\nacme.com"}
              rows={4}
              className="resize-none text-sm leading-6"
            />
            <p className="text-xs leading-5 text-muted-foreground">
              One line per row. Any line starting with http(s):// or www. is
              turned into a clickable link when sent.
            </p>

            {hasLink(settings.signatureText) && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                <IconAlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                <p className="text-xs leading-5 text-amber-700">
                  Links in signatures can lower email deliverability. Use at
                  your own risk.
                </p>
              </div>
            )}

            <div className="mt-1 rounded-2xl bg-muted/30 px-4 py-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Preview
              </p>
              {settings.signatureText.trim() ? (
                <SignatureBlockPreview text={settings.signatureText} />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Type a signature above to see a preview.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {footer}
    </div>
  )
}
