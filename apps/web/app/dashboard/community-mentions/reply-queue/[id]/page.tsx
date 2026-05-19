"use client"

import { use, useState } from "react"
import Link from "next/link"
import {
  IconArrowLeft,
  IconBookmark,
  IconCheck,
  IconCircleX,
  IconCopy,
  IconExternalLink,
  IconEye,
  IconMessage2Share,
  IconSend,
  IconShieldCheck,
} from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import {
  INTENT_CONFIG,
  MOCK_COMMUNITY_MENTIONS,
  STATUS_CONFIG,
  formatCompactNumber,
  formatDate,
  formatShortDateTime,
  scoreColor,
  type CommunityMention,
  type MentionIntent,
  type MentionStatus,
} from "../_data"
import {
  PLATFORM_CONFIG,
  type MentionPlatform,
} from "@/consts/platform-config"

function PlatformBadge({ platform }: { platform: MentionPlatform }) {
  const cfg = PLATFORM_CONFIG[platform]
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        cfg.color
      )}
    >
      <Icon className="size-3.5" />
      {cfg.label}
    </span>
  )
}

function IntentBadge({ intent }: { intent: MentionIntent }) {
  const cfg = INTENT_CONFIG[intent]
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        cfg.color
      )}
    >
      <Icon className="size-3.5" />
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status }: { status: MentionStatus }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        cfg.color
      )}
    >
      <Icon className="size-3.5" />
      {cfg.label}
    </span>
  )
}

function ScoreDisplay({ score }: { score: number }) {
  const barColor =
    score >= 85
      ? "bg-emerald-500"
      : score >= 70
        ? "bg-amber-500"
        : "bg-orange-500"

  return (
    <div className={cn("flex flex-col gap-3 rounded-3xl px-8 py-5 ring-1", scoreColor(score))}>
      <div className="flex items-baseline gap-1.5">
        <span className="text-5xl font-black leading-none tabular-nums">
          {score}
        </span>
        <span className="text-sm font-medium text-muted-foreground">/100</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/8">
        <div
          className={cn("h-full rounded-full", barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Relevance score
      </p>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      onClick={copy}
      className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      title="Copy"
    >
      {copied ? (
        <IconCheck className="size-3.5 text-emerald-500" />
      ) : (
        <IconCopy className="size-3.5" />
      )}
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  )
}

function ReplyDraft({ mention }: { mention: CommunityMention }) {
  return (
    <div className="overflow-hidden rounded-3xl ring-1 ring-foreground/8">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/40 px-5 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <IconMessage2Share className="size-4 shrink-0 text-pumpkin-spice" />
          <span className="truncate text-sm font-medium">Prepared reply</span>
        </div>
        <CopyButton text={mention.replyDraft} />
      </div>
      <div className="relative bg-card px-5 py-4">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
          {mention.replyDraft}
        </pre>
      </div>
    </div>
  )
}

export default function CommunityMentionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const mention = MOCK_COMMUNITY_MENTIONS.find((item) => item.id === id)

  if (!mention) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium">Community mention not found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This post may have been removed or the link is invalid.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-6">
          <Link href="/dashboard/community-mentions/reply-queue">
            <IconArrowLeft className="size-3.5" />
            Back to reply queue
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard/community-mentions/reply-queue">
            <IconArrowLeft className="size-3.5" />
            Back to reply queue
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <PlatformBadge platform={mention.platform} />
            <IntentBadge intent={mention.intent} />
            <StatusBadge status={mention.status} />
          </div>

          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {mention.postTitle}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {mention.postExcerpt}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{mention.sourceName}</span>
            <span>·</span>
            <span>{mention.authorName}</span>
            <span>·</span>
            <span>Posted {formatShortDateTime(mention.postedAt)}</span>
            <span>·</span>
            <span>Discovered {formatDate(mention.discoveredAt)}</span>
          </div>

          <a
            href={mention.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconExternalLink className="size-3.5 shrink-0" />
            <span className="truncate">Open original post</span>
          </a>
        </div>

        <div className="shrink-0">
          <ScoreDisplay score={mention.relevanceScore} />
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-8">
          <section>
            <SectionLabel>Why this fits</SectionLabel>
            <blockquote className="border-l-[3px] border-[var(--blaze-orange)] pl-5">
              <p className="leading-relaxed">{mention.fitReason}</p>
            </blockquote>
          </section>

          <section>
            <SectionLabel>Product angle</SectionLabel>
            <div className="rounded-3xl border border-dashed border-orange/25 bg-orange/5 px-5 py-4">
              <p className="text-sm leading-6">{mention.productAngle}</p>
            </div>
          </section>

          <section>
            <SectionLabel>Generated reply</SectionLabel>
            <ReplyDraft mention={mention} />
          </section>

          <section>
            <SectionLabel>Safety notes</SectionLabel>
            <div className="grid gap-2 sm:grid-cols-2">
              {mention.safetyNotes.map((note) => (
                <div
                  key={note}
                  className="flex items-start gap-2 rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
                >
                  <IconShieldCheck className="mt-0.5 size-4 shrink-0 text-pumpkin-spice" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5">
            <SectionLabel>Matched signals</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {mention.matchedSignals.map((signal) => (
                <span
                  key={signal}
                  className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5">
            <SectionLabel>Engagement</SectionLabel>
            <div className="grid grid-cols-3 gap-3">
              <Metric label="Comments" value={mention.engagement.comments} />
              <Metric label="Reactions" value={mention.engagement.reactions} />
              <Metric label="Views" value={mention.engagement.views} />
            </div>
          </div>

          <div className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5">
            <SectionLabel>Actions</SectionLabel>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full justify-start gap-2">
                <a href={mention.postUrl} target="_blank" rel="noopener noreferrer">
                  <IconExternalLink className="size-4" />
                  Open post
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <IconSend className="size-4" />
                Mark as replied
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <IconBookmark className="size-4" />
                Save to queue
              </Button>
              <Button variant="destructive" className="w-full justify-start gap-2">
                <IconCircleX className="size-4" />
                Dismiss
              </Button>
            </div>
          </div>

          <div className="rounded-3xl bg-muted/40 p-5 ring-1 ring-foreground/5">
            <SectionLabel>Posting reminder</SectionLabel>
            <div className="flex gap-3 text-sm leading-6 text-muted-foreground">
              <IconEye className="mt-0.5 size-4 shrink-0 text-pumpkin-spice" />
              <p>
                Mentiohunt prepares the reply only. Review context and post it
                yourself from the original thread.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-2xl bg-muted/50 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums">
        {value === null ? "—" : formatCompactNumber(value)}
      </p>
    </div>
  )
}
