"use client"

import Link from "next/link"

import { IconExternalLink } from "@tabler/icons-react"

import { captureEvent } from "@/lib/analytics"

import { CopyButton } from "./copy-button"

interface SocialReplyDraftProps {
  body: string | null
  prospectId: string
  postUrl: string | null | undefined
}

export function SocialReplyDraft({
  body,
  prospectId,
  postUrl,
}: SocialReplyDraftProps) {
  const hasDraft = !!body?.trim()

  if (!hasDraft) return null

  return (
    <div className="rounded-lg border border-border/60 bg-card">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <p className="text-[0.7rem] font-bold text-muted-foreground uppercase">
          Reply draft
        </p>
        {postUrl && (
          <Link
            href={postUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              captureEvent("outreach_open_post", { prospect_id: prospectId })
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <IconExternalLink className="size-3.5" />
            Open post
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-border/50 px-5 py-4">
        <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-6">
          {body}
        </pre>
        <div className="flex justify-end">
          <CopyButton
            text={body!}
            onCopy={() =>
              captureEvent("outreach_reply_copied", {
                prospect_id: prospectId,
              })
            }
          />
        </div>
      </div>
    </div>
  )
}
