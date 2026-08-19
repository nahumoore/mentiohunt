"use client"

import { IconArrowRight, IconSparkles } from "@tabler/icons-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"

import type { PlatformUpdateListItem } from "@/stores/notification-store"
import { Dialog, DialogContent, DialogTitle } from "@workspace/ui/components/dialog"

const MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => <p className="text-sm leading-6 text-muted-foreground">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-(--color-blaze-orange) underline underline-offset-2 transition-colors hover:text-(--color-crimson-carrot)"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal space-y-1 pl-5 text-sm leading-6 text-muted-foreground">{children}</ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  h1: ({ children }) => <p className="font-heading text-base font-semibold text-foreground">{children}</p>,
  h2: ({ children }) => <p className="font-heading text-base font-semibold text-foreground">{children}</p>,
  h3: ({ children }) => <p className="font-heading text-sm font-semibold text-foreground">{children}</p>,
  code: ({ children }) => (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">{children}</code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-border pl-3 text-muted-foreground italic">{children}</blockquote>
  ),
}

/**
 * Opens only when the bell popover's platform-update row is clicked — never
 * automatically. Detail view for an announcement the compact bell row is too
 * cramped to explain properly. Read-state is already marked by the click
 * that opens this (NotificationBell.handleItemClick) — this component is
 * display-only.
 */
export function PlatformUpdateModal({
  update,
  onClose,
}: {
  update: PlatformUpdateListItem | null
  onClose: () => void
}) {
  return (
    <Dialog open={!!update} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
        {update && (
          <>
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                <IconSparkles className="size-5" />
              </span>
              <span className="text-[0.7rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                What&apos;s new
              </span>
            </div>

            <DialogTitle className="mt-3 text-xl">{update.title}</DialogTitle>

            {update.body && (
              <div className="mt-2 space-y-3">
                <ReactMarkdown components={MARKDOWN_COMPONENTS}>{update.body}</ReactMarkdown>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="font-ui shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-all duration-150 ease-out hover:border-foreground/20 hover:bg-muted hover:text-foreground active:scale-[0.98]"
              >
                Dismiss
              </button>
              {update.link_href && (
                <Link
                  href={update.link_href}
                  onClick={onClose}
                  className="font-ui group inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-(--color-blaze-orange) px-4 py-2 text-sm font-semibold text-white transition-all duration-150 ease-out hover:bg-(--color-crimson-carrot) hover:shadow-md hover:shadow-(--color-blaze-orange)/20 active:scale-[0.98]"
                >
                  See it
                  <IconArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
