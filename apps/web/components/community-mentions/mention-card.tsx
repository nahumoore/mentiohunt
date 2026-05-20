"use client"

import { captureEvent } from "@/lib/analytics"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { cn } from "@workspace/ui/lib/utils"
import {
  IconAlertTriangleFilled,
  IconBan,
  IconCheck,
  IconCopy,
  IconCopyCheck,
  IconExternalLink,
  IconEye,
  IconMessageCircle,
  IconShieldCheck,
  IconSparkles,
  IconThumbUp,
} from "@tabler/icons-react"
import { motion } from "framer-motion"
import { useState } from "react"

import type {
  CommunityMention,
  MentionIntent,
} from "@/app/dashboard/community-mentions/reply-queue/_data"
import { INTENT_CONFIG } from "@/app/dashboard/community-mentions/reply-queue/_data"
import {
  PLATFORM_CONFIG,
  type MentionPlatform,
} from "@/consts/platform-config"

function PlatformBadge({ platform }: { platform: MentionPlatform }) {
  const cfg = PLATFORM_CONFIG[platform]
  const Icon = cfg.icon
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", cfg.color)}>
      <Icon className="size-3" />
      {cfg.label}
    </span>
  )
}

function IntentBadge({ intent }: { intent: MentionIntent }) {
  const cfg = INTENT_CONFIG[intent]
  const Icon = cfg.icon
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", cfg.color)}>
      <Icon className="size-3" />
      {cfg.label}
    </span>
  )
}

function ScoreBar({ score }: { score: number }) {
  const { color, text } =
    score >= 85
      ? { color: "#22c55e", text: "text-green-600" }
      : score >= 70
        ? { color: "#f59e0b", text: "text-amber-600" }
        : score >= 50
          ? { color: "#f97316", text: "text-orange-600" }
          : { color: "#ef4444", text: "text-red-600" }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5">
      <span className={cn("text-[10px] font-bold uppercase tracking-wider", text)}>
        Fit Score
      </span>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
        </div>
        <span className={cn("text-sm font-bold", text)}>{score}</span>
      </div>
    </div>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function getPreviewWords(text: string, count: number): { preview: string; hasMore: boolean } {
  const words = text.split(/\s+/)
  if (words.length <= count) return { preview: text, hasMore: false }
  return { preview: words.slice(0, count).join(" "), hasMore: true }
}

interface MentionCardProps {
  mention: CommunityMention
  exitDirection?: "left" | "right"
  onMarkReplied: (id: string) => void
  onMarkDismissed: (id: string) => void
}

export function MentionCard({ mention, exitDirection, onMarkReplied, onMarkDismissed }: MentionCardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [repliedModalOpen, setRepliedModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const isReplied = mention.status === "replied"
  const isDismissed = mention.status === "dismissed"
  const isActioned = isReplied || isDismissed

  const accentColor = PLATFORM_CONFIG[mention.platform].accentColor

  function copyReply(text: string, e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    captureEvent("reply_copied", { mention_id: mention.id })
    if (mention.postUrl) window.open(mention.postUrl, "_blank", "noopener,noreferrer")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    setTimeout(() => setRepliedModalOpen(true), 800)
  }

  const { preview, hasMore } = mention.postExcerpt
    ? getPreviewWords(mention.postExcerpt, 50)
    : { preview: "", hasMore: false }

  return (
    <>
      <motion.article
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, x: exitDirection === "left" ? -120 : 120 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className={cn(
          "group relative overflow-hidden rounded-xl border bg-card p-8 transition-all",
          isActioned
            ? "border-border/40 opacity-60"
            : "border-border hover:border-border/60 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
        )}
      >
        {/* Left accent border */}
        <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: accentColor }} />

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: accentColor }}
            >
              <span className="text-sm font-bold leading-none">
                {mention.authorName.replace(/^[@]/, "").slice(0, 1).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-sm font-bold text-foreground">{mention.authorName}</p>
                <PlatformBadge platform={mention.platform} />
                <IntentBadge intent={mention.intent} />
              </div>
              <p className="text-xs text-muted-foreground">
                {mention.sourceName} · {timeAgo(mention.postedAt)}
              </p>
            </div>
          </div>
          <ScoreBar score={mention.relevanceScore} />
        </div>

        {/* Title */}
        <h3 className="mb-4 flex items-start gap-2 text-lg font-bold leading-snug text-foreground">
          <span>{mention.postTitle}</span>
          {mention.postUrl && (
            <a
              href={mention.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 shrink-0 text-muted-foreground/50 transition-colors hover:text-primary"
            >
              <IconExternalLink className="size-4" />
            </a>
          )}
        </h3>

        {/* Excerpt preview */}
        {mention.postExcerpt && (
          <div className="relative mb-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{preview}</p>
            {hasMore && (
              <button
                onClick={() => {
                  captureEvent("mention_opened", {
                    mention_id: mention.id,
                    platform: mention.platform,
                    fit_score: mention.relevanceScore,
                  })
                  setModalOpen(true)
                }}
                className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground underline-offset-2 transition-colors hover:text-primary hover:underline"
              >
                <IconEye className="size-3.5" />
                Read more
              </button>
            )}
          </div>
        )}

        {/* Engagement */}
        <div className="mb-6 flex items-center gap-5 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <IconThumbUp className="size-3.5" />
            {mention.engagement.reactions.toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5">
            <IconMessageCircle className="size-3.5" />
            {mention.engagement.comments} comments
          </span>
        </div>

        {/* Reply draft */}
        <div className="mb-6 rounded-xl border border-border bg-muted/40 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex size-5 items-center justify-center rounded-md bg-primary/15">
                <IconMessageCircle className="size-3 text-primary" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Suggested Reply</span>
            </div>
            <button
              onClick={(e) => copyReply(mention.replyDraft, e)}
              disabled={isActioned}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              {copied ? <IconCopyCheck className="size-3.5" /> : <IconCopy className="size-3.5" />}
              {copied ? "Copied!" : "Copy & Open Post"}
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{mention.replyDraft}</p>
          <div className="mt-3 flex w-fit items-start gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs font-semibold text-foreground">
            <IconAlertTriangleFilled className="mt-0.5 size-3 shrink-0" />
            <span>Review before posting. You post it yourself from the original thread.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <div className="flex flex-wrap items-center gap-2">
            {isDismissed ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-rose-600/70">
                <IconBan className="size-3.5" />
                Dismissed
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  captureEvent("mention_dismissed", { mention_id: mention.id, source: "card" })
                  onMarkDismissed(mention.id)
                }}
                disabled={isReplied}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-muted-foreground transition-all hover:bg-rose-100 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 disabled:pointer-events-none disabled:opacity-40"
              >
                <IconBan className="size-3.5" />
                Dismiss
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {mention.postUrl && (
              <a
                href={isActioned ? undefined : mention.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => { if (isActioned) e.preventDefault(); e.stopPropagation() }}
                aria-disabled={isActioned}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all",
                  isActioned
                    ? "cursor-not-allowed text-muted-foreground/40"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <IconExternalLink className="size-3.5" />
                See post
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                captureEvent("mention_marked_replied", { mention_id: mention.id, source: "card" })
                onMarkReplied(mention.id)
              }}
              disabled={isActioned}
              className={cn(
                "rounded-lg px-5 py-2 text-xs font-bold shadow-sm transition-all",
                isActioned
                  ? "cursor-not-allowed bg-muted text-muted-foreground"
                  : "bg-primary text-white hover:opacity-90 hover:shadow-md"
              )}
            >
              {isReplied ? (
                <span className="flex items-center gap-1.5">
                  <IconCheck className="size-3.5" /> Replied
                </span>
              ) : isDismissed ? (
                <span className="flex items-center gap-1.5">
                  <IconBan className="size-3.5" /> Dismissed
                </span>
              ) : (
                "Mark Replied"
              )}
            </button>
          </div>
        </div>
      </motion.article>

      {/* Full detail modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="flex max-h-[85vh] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <div className="shrink-0 border-b border-border px-6 py-5">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <PlatformBadge platform={mention.platform} />
                <IntentBadge intent={mention.intent} />
              </div>
              <ScoreBar score={mention.relevanceScore} />
            </div>
            <DialogTitle className="text-base font-bold leading-snug text-foreground">
              {mention.postTitle}
            </DialogTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {mention.authorName} · {mention.sourceName} · {timeAgo(mention.postedAt)}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Excerpt</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{mention.postExcerpt}</p>
            </div>

            {mention.fitReason && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Why this fits</p>
                <blockquote className="border-l-[3px] border-primary pl-4 text-sm leading-relaxed">
                  {mention.fitReason}
                </blockquote>
              </div>
            )}

            {mention.safetyNotes.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Safety notes</p>
                <div className="space-y-2">
                  {mention.safetyNotes.map((note) => (
                    <div key={note} className="flex items-start gap-2 rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                      <IconShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <footer className="shrink-0 border-t border-border px-6 py-4 space-y-4">
            {mention.replyDraft && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex size-5 items-center justify-center rounded-md bg-primary/15">
                    <IconSparkles className="size-3 text-primary" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Prepared Reply</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{mention.replyDraft}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5 text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <IconThumbUp className="size-3.5" />
                  {mention.engagement.reactions.toLocaleString()}
                </span>
                <span className="flex items-center gap-1.5">
                  <IconMessageCircle className="size-3.5" />
                  {mention.engagement.comments} comments
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <a
                  href={isActioned ? undefined : mention.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled={isActioned}
                  onClick={(e) => { if (isActioned) e.preventDefault() }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-all",
                    isActioned
                      ? "cursor-not-allowed border-border/40 text-muted-foreground/40"
                      : "border-border text-primary hover:bg-primary/5"
                  )}
                >
                  <IconExternalLink className="size-3.5" />
                  Open Original
                </a>
                {!isDismissed && (
                  <button
                    type="button"
                    onClick={() => { captureEvent("mention_dismissed", { mention_id: mention.id, source: "modal" }); onMarkDismissed(mention.id); setModalOpen(false) }}
                    disabled={isReplied}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200/70 bg-rose-50/70 px-3.5 py-2 text-xs font-semibold text-rose-700 transition-all hover:border-rose-300 hover:bg-rose-100/80 disabled:pointer-events-none disabled:opacity-40"
                  >
                    <IconBan className="size-3.5" />
                    Dismiss
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { captureEvent("mention_marked_replied", { mention_id: mention.id, source: "modal" }); onMarkReplied(mention.id); setModalOpen(false) }}
                  disabled={isActioned}
                  className={cn(
                    "rounded-lg px-5 py-2 text-xs font-bold shadow-sm transition-all",
                    isActioned
                      ? "cursor-not-allowed bg-muted text-muted-foreground"
                      : "bg-primary text-white hover:opacity-90 hover:shadow-md"
                  )}
                >
                  {isReplied ? (
                    <span className="flex items-center gap-1.5"><IconCheck className="size-3.5" /> Replied</span>
                  ) : isDismissed ? (
                    <span className="flex items-center gap-1.5"><IconBan className="size-3.5" /> Dismissed</span>
                  ) : "Mark Replied"}
                </button>
              </div>
            </div>
          </footer>
        </DialogContent>
      </Dialog>

      {/* Replied confirmation modal */}
      <Dialog open={repliedModalOpen} onOpenChange={setRepliedModalOpen}>
        <DialogContent className="w-full max-w-sm gap-0 overflow-hidden p-0">
          <div className="px-6 pb-4 pt-6">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10">
              <IconMessageCircle className="size-5 text-primary" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">Did you reply to this post?</DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Mark it as replied to keep your queue clean and move to the next opportunity.
            </p>
          </div>
          <div className="flex flex-col gap-2 px-6 pb-6">
            <button
              onClick={() => { captureEvent("mention_marked_replied", { mention_id: mention.id, source: "reply_confirmation" }); onMarkReplied(mention.id); setRepliedModalOpen(false) }}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90"
            >
              Yes, mark as replied
            </button>
            <button
              onClick={() => setRepliedModalOpen(false)}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Not yet
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
