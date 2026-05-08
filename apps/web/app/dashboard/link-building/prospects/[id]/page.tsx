"use client"

import { use, useState } from "react"
import Link from "next/link"
import {
  IconArrowLeft,
  IconExternalLink,
  IconMail,
  IconUser,
  IconBriefcase,
  IconCopy,
  IconAlertCircle,
  IconCircleCheck,
  IconCircleX,
  IconChevronRight,
  IconCheck,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  MOCK_OPPORTUNITIES,
  TYPE_CONFIG,
  STATUS_CONFIG,
  formatTraffic,
  formatDate,
  type Opportunity,
  type OpportunityType,
  type OpportunityStatus,
} from "../_data"

const STATUS_ORDER: OpportunityStatus[] = [
  "new",
  "contacted",
  "replied",
  "won",
]

function ScoreDisplay({ score }: { score: number }) {
  const c =
    score >= 80
      ? {
          text: "text-emerald-500",
          bg: "bg-emerald-500/8",
          ring: "ring-emerald-500/20",
          bar: "bg-emerald-500",
        }
      : score >= 60
        ? {
            text: "text-amber-500",
            bg: "bg-amber-500/8",
            ring: "ring-amber-500/20",
            bar: "bg-amber-500",
          }
        : {
            text: "text-orange-500",
            bg: "bg-orange-500/8",
            ring: "ring-orange-500/20",
            bar: "bg-orange-500",
          }

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-3xl px-8 py-5 ring-1",
        c.bg,
        c.ring
      )}
    >
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn("text-5xl font-black tabular-nums leading-none", c.text)}
        >
          {score}
        </span>
        <span className="text-sm font-medium text-muted-foreground">/100</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/8">
        <div
          className={cn("h-full rounded-full", c.bar)}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Fit Score
      </p>
    </div>
  )
}

function TypeBadge({ type }: { type: OpportunityType }) {
  const cfg = TYPE_CONFIG[type]
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

function StatusPipeline({ status }: { status: OpportunityStatus }) {
  if (status === "dismissed") {
    const cfg = STATUS_CONFIG.dismissed
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

  const currentIdx = STATUS_ORDER.indexOf(status)

  return (
    <div className="flex flex-wrap items-center gap-0.5">
      {STATUS_ORDER.map((s, i) => {
        const cfg = STATUS_CONFIG[s]
        const Icon = cfg.icon
        const isActive = i === currentIdx
        const isPast = i < currentIdx

        return (
          <div key={s} className="flex items-center gap-0.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors",
                isActive
                  ? cfg.color
                  : isPast
                    ? "text-muted-foreground/50 line-through"
                    : "text-muted-foreground/30"
              )}
            >
              <Icon className="size-3" />
              {cfg.label}
            </span>
            {i < STATUS_ORDER.length - 1 && (
              <IconChevronRight className="size-3 shrink-0 text-muted-foreground/25" />
            )}
          </div>
        )
      })}
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

function EmailDraft({
  subject,
  body,
}: {
  subject: Opportunity["emailSubject"]
  body: Opportunity["emailBody"]
}) {
  return (
    <div className="overflow-hidden rounded-3xl ring-1 ring-foreground/8">
      {/* Subject row */}
      <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/40 px-5 py-3">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Subject
          </span>
          <span className="truncate text-sm font-medium">{subject}</span>
        </div>
        <CopyButton text={subject} />
      </div>

      {/* Body */}
      <div className="relative bg-card px-5 py-4">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
          {body}
        </pre>
        <div className="absolute right-3 top-3">
          <CopyButton text={body} />
        </div>
      </div>
    </div>
  )
}

export default function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const opportunity = MOCK_OPPORTUNITIES.find((o) => o.id === id)

  if (!opportunity) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium">Prospect not found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This prospect may have been removed or the link is invalid.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-6">
          <Link href="/dashboard/link-building/prospects">
            <IconArrowLeft className="size-3.5" />
            Back to prospects
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard/link-building/prospects">
            <IconArrowLeft className="size-3.5" />
            Back to prospects
          </Link>
        </Button>
      </div>

      {/* Hero */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={opportunity.type} />
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              Discovered {formatDate(opportunity.discoveredAt)}
            </span>
          </div>

          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {opportunity.domain}
            </h1>
            <p className="mt-1 max-w-prose text-sm text-muted-foreground">
              {opportunity.pageTitle}
            </p>
          </div>

          <a
            href={opportunity.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconExternalLink className="size-3.5 shrink-0" />
            <span className="truncate">{opportunity.pageUrl}</span>
          </a>

          <div className="mt-1">
            <StatusPipeline status={opportunity.status} />
          </div>
        </div>

        <div className="shrink-0">
          <ScoreDisplay score={opportunity.fitScore} />
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Main grid */}
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* Left: briefing content */}
        <div className="flex flex-col gap-8">
          <section>
            <SectionLabel>Why this fits</SectionLabel>
            <blockquote className="border-l-[3px] border-[var(--blaze-orange)] pl-5">
              <p className="leading-relaxed">{opportunity.fitReason}</p>
            </blockquote>
          </section>

          <section>
            <SectionLabel>Email draft</SectionLabel>
            <EmailDraft
              subject={opportunity.emailSubject}
              body={opportunity.emailBody}
            />
          </section>

        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-5">
          {/* Site data */}
          <div className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5">
            <SectionLabel>Site data</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Domain Rating</p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums">
                  {opportunity.domainRating}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Monthly Traffic</p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums">
                  {formatTraffic(opportunity.monthlyTraffic)}
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5">
            <SectionLabel>Contact</SectionLabel>
            {opportunity.contact ? (
              <div className="flex flex-col gap-3">
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                  <IconAlertCircle className="size-3" />
                  Unverified
                </span>
                <div className="flex flex-col divide-y divide-border/50 rounded-2xl bg-muted/50">
                  <div className="flex items-center gap-2.5 px-3 py-2.5 text-sm">
                    <IconUser className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="font-medium">{opportunity.contact.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2.5 text-sm">
                    <IconBriefcase className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {opportunity.contact.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <IconMail className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-xs">
                        {opportunity.contact.email}
                      </span>
                    </div>
                    <CopyButton text={opportunity.contact.email} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No contact found yet. Try LinkedIn or the site&apos;s about page.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5">
            <SectionLabel>Actions</SectionLabel>
            <div className="flex flex-col gap-2">
              <Button className="w-full justify-start gap-2">
                <IconCircleCheck className="size-4" />
                Mark as contacted
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-start gap-2"
              >
                <IconCircleX className="size-4" />
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
