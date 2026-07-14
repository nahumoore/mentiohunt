"use client"

import { IconAlertTriangle, IconSparkles, IconUserQuestion, IconX } from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { useState } from "react"

import { captureEvent } from "@/lib/analytics"

interface ManualCompletionFormProps {
  prospectId: string
  hasEmailAccount: boolean
  foundContactName?: string | null
  domain?: string | null
  onSuccess: () => void
  onDismiss: () => Promise<void> | void
}

export function ManualCompletionForm({
  prospectId,
  hasEmailAccount,
  foundContactName,
  domain,
  onSuccess,
  onDismiss,
}: ManualCompletionFormProps) {
  const [contactName, setContactName] = useState(foundContactName?.trim() ?? "")
  const [contactEmail, setContactEmail] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = hasEmailAccount && contactName.trim() !== "" && contactEmail.trim() !== ""

  async function handleDismiss() {
    if (isSaving || isDismissing) return
    setIsDismissing(true)
    try {
      await onDismiss()
    } finally {
      setIsDismissing(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || isSaving) return

    setIsSaving(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/link-building/opportunities/${prospectId}/manual-complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contact_name: contactName.trim(),
            contact_email: contactEmail.trim(),
          }),
        }
      )

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error ?? "Failed to generate outreach. Please try again.")
        return
      }

      captureEvent("prospect_manual_outreach_generated", { prospect_id: prospectId })
      onSuccess()
    } catch {
      setError("Service unavailable. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="rounded-2xl border border-border bg-card px-6 py-7 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--color-blaze-orange)/10">
            <IconUserQuestion className="size-5 text-(--color-blaze-orange)" />
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-semibold text-foreground">Contact details not found</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {foundContactName ? (
                <>
                  We found <span className="font-medium text-foreground">{foundContactName}</span>{" "}
                  as a likely contact
                  {domain ? (
                    <>
                      {" "}
                      at <span className="font-medium text-foreground">{domain}</span>
                    </>
                  ) : null}
                  , but couldn&apos;t find a public email. Confirm the details below to generate
                  outreach.
                </>
              ) : (
                <>
                  We couldn&apos;t find a public contact for this site. Add the details below and
                  we&apos;ll generate the outreach sequence for you.
                </>
              )}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="manual-contact-name"
              className="mb-1.5 block text-[10px] font-semibold tracking-wider uppercase text-muted-foreground"
            >
              Contact name
            </label>
            <input
              id="manual-contact-name"
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground transition focus:border-(--color-blaze-orange) focus:ring-2 focus:ring-(--color-blaze-orange)/20 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="manual-contact-email"
              className="mb-1.5 block text-[10px] font-semibold tracking-wider uppercase text-muted-foreground"
            >
              Contact email
            </label>
            <input
              id="manual-contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground transition focus:border-(--color-blaze-orange) focus:ring-2 focus:ring-(--color-blaze-orange)/20 focus:outline-none"
            />
          </div>

          {!hasEmailAccount && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-700">
              <IconAlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Connect an email account before generating outreach.{" "}
                <Link href="/dashboard/email-accounts" className="font-semibold underline">
                  Connect now
                </Link>
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
              <IconAlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleDismiss}
              disabled={isSaving || isDismissing}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted",
                (isSaving || isDismissing) && "cursor-not-allowed opacity-40"
              )}
            >
              <IconX className="size-3.5" />
              {isDismissing ? "Dismissing…" : "Dismiss"}
            </button>

            <button
              type="submit"
              disabled={!canSubmit || isSaving || isDismissing}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-(--color-blaze-orange) px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-(--color-crimson-carrot)",
                (!canSubmit || isSaving || isDismissing) && "cursor-not-allowed opacity-40"
              )}
            >
              <IconSparkles className="size-3.5" />
              {isSaving ? "Generating outreach…" : "Save & generate outreach"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
