"use client"

import Link from "next/link"

import { IconExternalLink } from "@tabler/icons-react"

import { IconBrandGmail } from "@/components/custom-icons/brand-gmail"
import { IconBrandOutlook } from "@/components/custom-icons/brand-outlook"
import { captureEvent } from "@/lib/analytics"

import { CopyButton } from "./copy-button"

interface OutreachDraftProps {
  subject: string
  body: string
  prospectId: string
  contactEmail: string | null
}

function buildMailtoUrl(to: string, subject: string, body: string) {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function buildGmailUrl(to: string, subject: string, body: string) {
  return `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function buildOutlookUrl(to: string, subject: string, body: string) {
  return `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function OutreachDraft({
  subject,
  body,
  prospectId,
  contactEmail,
}: OutreachDraftProps) {
  const hasDraft = subject.trim().length > 0 && body.trim().length > 0
  const hasRecipient = !!contactEmail?.trim()

  return (
    <div className="rounded-lg border border-border/60 bg-card">
      {/* card header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <p className="text-[0.7rem] font-bold tracking-[0.18em] text-muted-foreground uppercase">
          Email draft
        </p>
        {hasDraft && hasRecipient && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Open in</span>
            <Link
              href={buildGmailUrl(contactEmail!, subject, body)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                captureEvent("outreach_open_in_client", {
                  prospect_id: prospectId,
                  client: "gmail",
                })
              }
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <IconBrandGmail className="size-3.5" />
              Gmail
            </Link>
            <Link
              href={buildOutlookUrl(contactEmail!, subject, body)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                captureEvent("outreach_open_in_client", {
                  prospect_id: prospectId,
                  client: "outlook",
                })
              }
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <IconBrandOutlook className="size-3.5" />
              Outlook
            </Link>
            <Link
              href={buildMailtoUrl(contactEmail!, subject, body)}
              onClick={() =>
                captureEvent("outreach_open_in_client", {
                  prospect_id: prospectId,
                  client: "mailto",
                })
              }
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <IconExternalLink className="size-3.5 text-muted-foreground" />
              Default
            </Link>
          </div>
        )}
      </div>

      {!hasDraft ? (
        <div className="border-t border-border/50 px-5 py-4">
          <p className="text-sm text-muted-foreground">
            No email draft generated yet. Review the press request and prepare
            your pitch manually.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 border-t border-border/50 px-5 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                Subject
              </span>
              <span className="truncate text-sm font-medium">{subject}</span>
            </div>
            <CopyButton
              text={subject}
              onCopy={() =>
                captureEvent("outreach_email_copied", {
                  prospect_id: prospectId,
                  field: "subject",
                })
              }
            />
          </div>
          <div className="flex flex-col gap-3 border-t border-border/50 px-5 py-4">
            <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-6">
              {body}
            </pre>
            <div className="flex justify-end">
              <CopyButton
                text={body}
                onCopy={() =>
                  captureEvent("outreach_email_copied", {
                    prospect_id: prospectId,
                    field: "body",
                  })
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
