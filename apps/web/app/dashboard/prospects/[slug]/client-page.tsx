"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import {
  IconArrowRight,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandX,
  IconBrandYoutube,
  IconCheck,
  IconChevronRight,
  IconCircleX,
  IconClockPause,
  IconCopy,
  IconDots,
  IconDownload,
  IconExternalLink,
  IconFlag,
  IconLoader2,
  IconMail,
  IconMailCheck,
  IconMailOff,
  IconMailX,
  IconMessage2,
  IconPlayerPause,
  IconQuestionMark,
  IconRadar2,
  IconSparkles,
  IconTrophy,
} from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"
import { Confetti, type ConfettiRef } from "@workspace/ui/components/confetti"
import type { Json } from "@workspace/supabase/database-types"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Switch } from "@workspace/ui/components/switch"

import { captureEvent } from "@/lib/analytics"
import { formatRelative } from "@/lib/format-date"
import { PROSPECT_TIER_CONFIG } from "@/lib/opportunity-types"
import { useActivationStore } from "@/stores/activation-store"
import type {
  ProspectDetail,
  ProspectMessage,
  ProspectSequence,
} from "@/stores/prospect-store"
import { useProspectStore } from "@/stores/prospect-store"
import { usePagesStore } from "@/stores/pages-store"
import {
  formatDate,
  STATUS_CONFIG,
  type ProspectStatus,
} from "@/app/dashboard/prospects/_data"
import type { WonStats } from "./_won-stats"
import {
  copyWonCardPng,
  downloadWonCardPng,
  type WonCardMeta,
} from "./_win-card-export"
import { EmailSequenceNav } from "@/components/prospects/email-sequence-nav"
import { SequenceStoppedNotice } from "@/components/prospects/sequence-stopped-notice"
import { ReplyViaMailboxNotice } from "@/components/prospects/reply-via-mailbox-notice"
import { ReplyComposer } from "@/components/prospects/reply-composer"
import { ManualCompletionForm } from "@/components/link-building/prospects/manual-completion-form"
import { OpportunityReportIssueDialog } from "@/components/link-building/prospects/prospect-report-issue-dialog"
import { SignatureBlockPreview } from "@/components/link-building/sources/signature-block-preview"
import { useOutreachSettingsStore } from "@/stores/outreach-settings-store"

const PIPELINE_STEPS: ProspectStatus[] = [
  "new",
  "contacted",
  "negotiating",
  "won",
]

function DetailStatusPipeline({ status }: { status: ProspectStatus }) {
  if (
    status === "dismissed" ||
    status === "email_not_found" ||
    status === "bounced"
  ) {
    const cfg = STATUS_CONFIG[status]
    const Icon = cfg.icon
    return (
      <div className="flex items-center gap-3 overflow-x-auto">
        {PIPELINE_STEPS.map((s, index) => {
          const cfg = STATUS_CONFIG[s]
          const Icon = cfg.icon
          return (
            <div key={s} className="flex shrink-0 items-center gap-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium whitespace-nowrap text-muted-foreground/20">
                <Icon className="size-3" />
                {cfg.label}
              </span>
              {index < PIPELINE_STEPS.length - 1 && (
                <IconChevronRight className="ml-1 size-3 shrink-0 text-muted-foreground/15" />
              )}
            </div>
          )
        })}
        <span className="ml-2 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium whitespace-nowrap text-muted-foreground">
          <Icon className="size-3.5" />
          {cfg.label}
        </span>
      </div>
    )
  }

  const currentIdx = PIPELINE_STEPS.indexOf(status)

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto">
      {PIPELINE_STEPS.map((s, index) => {
        const cfg = STATUS_CONFIG[s]
        const Icon = cfg.icon
        const isActive = index === currentIdx
        const isPast = index < currentIdx

        return (
          <div key={s} className="flex shrink-0 items-center gap-0.5">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors",
                isActive
                  ? "bg-primary/10 text-primary ring-1 ring-primary/20 ring-inset"
                  : isPast
                    ? "text-primary/50"
                    : "text-muted-foreground/25"
              )}
            >
              {isPast ? (
                <IconCheck className="size-3" />
              ) : (
                <Icon className="size-3" />
              )}
              {cfg.label}
            </span>
            {index < PIPELINE_STEPS.length - 1 && (
              <IconChevronRight
                className={cn(
                  "size-3 shrink-0",
                  isPast ? "text-primary/30" : "text-muted-foreground/20"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function WonBadge({
  domain,
  domainRating,
  wonAt,
  wonStats,
}: {
  domain: string | null
  domainRating: number | null
  wonAt: string | null
  wonStats: WonStats
}) {
  const confettiRef = useRef<ConfettiRef>(null)
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle")

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void confettiRef.current?.fire({
        particleCount: 150,
        spread: 78,
        startVelocity: 32,
        scalar: 0.95,
        origin: { y: 0.5 },
        colors: ["#ff5a1f", "#ff8a5a", "#2dbe60", "#f4c84a", "#ffffff"],
      })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [])

  const isFirst = wonStats.ordinal <= 1
  const cardMeta: WonCardMeta = {
    domain: domain ?? "This prospect",
    domainRating,
    ordinal: wonStats.ordinal,
    totalWonCount: wonStats.totalWonCount,
    totalDrEarned: wonStats.totalDrEarned,
    dateLabel: wonAt ? formatDate(wonAt) : null,
  }

  async function handleCopyImage() {
    try {
      await copyWonCardPng(cardMeta)
      setCopyState("copied")
      toast.success("Card image copied — paste it anywhere")
      window.setTimeout(() => setCopyState("idle"), 1800)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not copy the card image"
      )
    }
  }

  async function handleDownloadImage() {
    try {
      await downloadWonCardPng(cardMeta)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not download the card image"
      )
    }
  }

  const postText = domainRating !== null
    ? `Just landed a backlink from ${cardMeta.domain} (DR ${domainRating}).`
    : `Just landed a backlink from ${cardMeta.domain}.`

  return (
    <div className="flex flex-col items-center py-14">
      <Confetti
        ref={confettiRef}
        manualstart
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[60] size-full"
      />
      <div className="flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] text-green-600 uppercase dark:text-brand-success">
          <span className="block size-1.5 rounded-full bg-green-600 dark:bg-brand-success" />
          {isFirst ? "Your first backlink" : "Backlink won"}
        </span>

        <p className="mt-2 text-[6.5rem] leading-none font-semibold tracking-tight text-primary">
          #{wonStats.ordinal}
        </p>

        <p className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
          {cardMeta.domain}
        </p>
        {(domainRating !== null || wonAt) && (
          <p className="mt-1.5 text-sm text-muted-foreground">
            {[domainRating !== null ? `DR ${domainRating}` : null, wonAt ? formatDate(wonAt) : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        {!isFirst && (
          <>
            <span className="mt-6 block h-px w-44 bg-border" />
            <p className="mt-6 text-[13px] text-muted-foreground">
              {wonStats.totalDrEarned} DR earned across {wonStats.totalWonCount} links
            </p>
          </>
        )}

        <div className="mt-7 flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyImage}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-4xl bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            {copyState === "copied" ? (
              <IconCheck className="size-4" />
            ) : (
              <IconCopy className="size-4" />
            )}
            Copy image
          </button>
          <a
            href={`https://x.com/intent/tweet?text=${encodeURIComponent(postText)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Post on X"
            className="inline-flex size-9 items-center justify-center rounded-4xl border border-border bg-background text-foreground transition-colors hover:bg-muted"
          >
            <IconBrandX className="size-4" />
          </a>
          <button
            type="button"
            onClick={handleDownloadImage}
            aria-label="Download image"
            className="inline-flex size-9 items-center justify-center rounded-4xl border border-border bg-background text-foreground transition-colors hover:bg-muted"
          >
            <IconDownload className="size-4" />
          </button>
        </div>
      </div>

      <Link
        href="/dashboard/link-tracker"
        className="mt-7 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <IconRadar2 className="size-3.5" />
        Track this backlink so you know if it ever goes down
        <IconArrowRight className="size-3.5" />
      </Link>
    </div>
  )
}

type ProspectProduct = {
  productName: string
  websiteUrl: string
}

function getDiceBearUrl(seed: string): string {
  return `https://api.dicebear.com/10.x/micah/svg?mouthVariant=smirk&facialHairVariant=&hairVariant=dannyPhantom,fonze,full,pixie&hairProbability=100&baseColor=f9c9b6,ac6651,f5bd8a&backgroundColor=ffffff&seed=${encodeURIComponent(seed)}`
}

function getFaviconUrl(domain: string | null): string | null {
  if (!domain) return null
  const host = domain.startsWith("http") ? new URL(domain).hostname : domain
  return `https://www.google.com/s2/favicons?domain=${host}&sz=32`
}

function nullishString(v: string | null | undefined): string | null {
  if (!v || v === "null" || v === "undefined" || v.trim() === "") return null
  return v
}

function parseSocialLinks(
  raw: Json | null | undefined
): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  return Object.fromEntries(
    Object.entries(raw as Record<string, Json>)
      .filter(
        ([, v]) => typeof v === "string" && nullishString(v as string) !== null
      )
      .map(([k, v]) => [k, v as string])
  )
}

function parseRawMetadataBio(raw: Json | null | undefined): string | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const obj = raw as Record<string, Json>
  return typeof obj.bio === "string" ? nullishString(obj.bio) : null
}

/** Surfaces why the AI picked this page for a user-submitted article, so the
 * user can judge the auto-pick before the first email sends 45–180 min later. */
function parseUserSubmittedFitReason(
  raw: Json | null | undefined
): string | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const obj = raw as Record<string, Json>
  const userSubmitted = obj.user_submitted
  if (
    !userSubmitted ||
    typeof userSubmitted !== "object" ||
    Array.isArray(userSubmitted)
  )
    return null
  const reason = (userSubmitted as Record<string, Json>).fitReason
  return typeof reason === "string" ? nullishString(reason) : null
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

function getUrlDisplay(url: string): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, "")
    return parsed.pathname !== "/" ? host + parsed.pathname : host
  } catch {
    return url
  }
}

function drBarColor(dr: number): string {
  if (dr >= 60) return "bg-emerald-500"
  if (dr >= 30) return "bg-amber-500"
  return "bg-primary"
}

function fitBarColor(score: number): string {
  if (score >= 70) return "bg-emerald-500"
  if (score >= 40) return "bg-amber-500"
  return "bg-red-400"
}

function ScoreRow({
  label,
  hint,
  value,
  barColor,
}: {
  label: string
  hint: string
  value: number | null
  barColor: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
      <p
        className="font-mono text-lg leading-none font-bold text-foreground tabular-nums"
        title={hint}
      >
        {value ?? "—"}
      </p>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {label}
        </p>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full",
              value != null ? barColor : "bg-muted"
            )}
            style={{ width: `${value != null ? Math.min(value, 100) : 0}%` }}
          />
        </div>
      </div>
    </div>
  )
}

type OwnEmailAccount = { id: string; email: string; name: string }

function ConversationView({
  prospect,
  sequences,
  messages,
  isPublicMailbox,
  ownEmailAccounts,
}: {
  prospect: ProspectDetail
  sequences: ProspectSequence[]
  messages: ProspectMessage[]
  isPublicMailbox: boolean
  ownEmailAccounts: OwnEmailAccount[]
}) {
  const subject = prospect.email_subject ?? "Collaboration opportunity"
  const sentSteps = sequences.filter((s) => s.status === "sent")
  const storedOutboundSequenceIds = new Set(
    messages
      .filter((message) => message.direction === "outbound")
      .map((message) => message.sequence_id)
  )
  const threadItems = [
    ...sentSteps
      .filter((seq) => !storedOutboundSequenceIds.has(seq.id))
      .map((seq) => ({
        id: seq.id,
        direction: "outbound" as const,
        date: seq.sent_at ?? seq.scheduled_at,
        body: seq.body ?? "",
        classification: null as string | null,
        classificationReason: null as string | null,
        fromName: null as string | null,
        fromEmail: null as string | null,
      })),
    ...messages.map((message) => ({
      id: message.id,
      direction:
        message.direction === "outbound"
          ? ("outbound" as const)
          : ("inbound" as const),
      date: message.received_at,
      body: message.text_body ?? "",
      classification: message.classification,
      classificationReason: message.classification_reason,
      fromName: message.from_name,
      fromEmail: message.from_email,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const lastInboundId = [...threadItems]
    .reverse()
    .find((item) => item.direction === "inbound")?.id
  const defaultExpandedId = lastInboundId ?? threadItems.at(-1)?.id ?? null
  const [expandedItemId, setExpandedItemId] = useState<string | null>(
    defaultExpandedId
  )

  // Reply to whoever last actually wrote in — they often answer from a
  // different personal address than the one outreach was originally sent to.
  const lastInboundEmail = [...threadItems]
    .reverse()
    .find((item) => item.direction === "inbound")?.fromEmail
  const replyToEmail = lastInboundEmail ?? prospect.contact_email
  const ownEmails = new Set(ownEmailAccounts.map((a) => a.email.toLowerCase()))
  useEffect(() => {
    setExpandedItemId(defaultExpandedId)
  }, [defaultExpandedId, prospect.id])

  return (
    <div className="flex flex-col">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-foreground">
          Conversation
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <IconMail className="size-3.5 shrink-0 text-muted-foreground/60" />
          Re: {subject}
        </p>
      </div>

      {prospect.outreach_stopped_reason &&
        prospect.outreach_stopped_reason !== "reply" && (
          <SequenceStoppedNotice
            className="mb-5"
            reason={prospect.outreach_stopped_reason}
            stoppedAt={prospect.outreach_stopped_at}
          />
        )}

      {/* Thread messages */}
      <div className="mb-6 space-y-3">
        {threadItems.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 italic">
            No conversation yet.
          </p>
        ) : (
          threadItems.map((item) => {
            const isOutbound = item.direction === "outbound"
            const isBounce = item.classification === "bounce"
            const isOwnAccount =
              isOutbound &&
              !!item.fromEmail &&
              ownEmails.has(item.fromEmail.toLowerCase())
            const outboundTitle = isOwnAccount
              ? `You${item.fromEmail ? ` (${item.fromEmail})` : ""}`
              : "You (via Mentiohunt)"
            const label = isOutbound
              ? "Sent"
              : item.classification === "human_reply"
                ? "Reply"
                : item.classification === "auto_reply"
                  ? "Auto reply"
                  : item.classification === "unsubscribe"
                    ? "Stop request"
                    : item.classification === "negative_reply"
                      ? "Declined"
                      : item.classification === "wrong_person"
                        ? "Wrong person"
                        : item.classification === "challenge"
                          ? "Challenge"
                          : item.classification === "bounce"
                            ? "Bounce"
                            : "Needs review"

            const isExpanded = expandedItemId === item.id
            const snippet = item.body.replace(/\s+/g, " ").trim()

            return (
              <div key={item.id} className="flex gap-3">
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-1",
                    isOutbound
                      ? "bg-primary/10 text-primary ring-primary/20"
                      : isBounce
                        ? "bg-destructive/10 text-destructive ring-destructive/20"
                        : "bg-muted text-foreground ring-border"
                  )}
                >
                  {isOutbound
                    ? "Y"
                    : (item.fromName?.[0] ?? prospect.contact_name?.[0] ?? "P")}
                </div>
                {isExpanded ? (
                  <div
                    className={cn(
                      "min-w-0 flex-1 rounded-xl border border-l-2 border-border bg-card px-4 py-3 transition-all",
                      isOutbound
                        ? "border-l-primary"
                        : isBounce
                          ? "border-l-destructive"
                          : "border-l-muted-foreground/30"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={cn(
                            "truncate text-[11px] font-semibold",
                            isOutbound ? "text-primary" : "text-foreground"
                          )}
                        >
                          {isOutbound
                            ? outboundTitle
                            : item.fromName ||
                              item.fromEmail ||
                              prospect.contact_name ||
                              "Prospect"}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase",
                            isOutbound
                              ? "bg-emerald-500/10 text-emerald-600"
                              : isBounce
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground"
                          )}
                        >
                          {isBounce ? (
                            <IconMailOff className="size-2.5" />
                          ) : isOutbound ? (
                            <IconMailCheck className="size-2.5" />
                          ) : (
                            <IconMessage2 className="size-2.5" />
                          )}
                          {label}
                        </span>
                        <span className="text-[10px] text-muted-foreground/40">
                          {formatRelative(new Date(item.date))}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                      {item.body ||
                        item.classificationReason ||
                        "No message body captured."}
                    </p>
                    {item.classificationReason && !isOutbound && (
                      <p className="mt-2 text-[10px] text-muted-foreground/60">
                        Classified as {label.toLowerCase()}:{" "}
                        {item.classificationReason}
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setExpandedItemId(item.id)}
                    className={cn(
                      "flex min-w-0 flex-1 items-center justify-between gap-4 rounded-xl border border-l-2 border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/30",
                      isOutbound
                        ? "border-l-primary"
                        : isBounce
                          ? "border-l-destructive"
                          : "border-l-muted-foreground/30"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-[11px] font-semibold",
                          isOutbound ? "text-primary" : "text-foreground"
                        )}
                      >
                        {isOutbound
                          ? outboundTitle
                          : item.fromName ||
                            item.fromEmail ||
                            prospect.contact_name ||
                            "Prospect"}
                      </span>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {snippet ||
                          item.classificationReason ||
                          "No message body captured."}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-[10px] text-muted-foreground/40">
                        {formatRelative(new Date(item.date))}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        Expand
                      </span>
                      <IconChevronRight className="size-3.5 text-muted-foreground/60" />
                    </div>
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {isPublicMailbox ? (
        <ReplyViaMailboxNotice />
      ) : (
        <ReplyComposer
          prospectId={prospect.id}
          contactEmail={replyToEmail}
          emailAccounts={ownEmailAccounts}
        />
      )}
    </div>
  )
}

export function ProspectClientPage({
  prospect,
  sequences,
  messages,
  isFreeUser,
  hasEmailAccount,
  isPublicMailbox,
  ownEmailAccounts,
  wonStats,
}: {
  prospect: ProspectDetail
  product: ProspectProduct
  sequences: ProspectSequence[]
  messages: ProspectMessage[]
  isFreeUser: boolean
  hasEmailAccount: boolean
  isPublicMailbox: boolean
  ownEmailAccounts: OwnEmailAccount[]
  wonStats: WonStats | null
}) {
  const router = useRouter()
  const upsertProspectDetail = useProspectStore((s) => s.upsertProspectDetail)
  const storedProspect = useProspectStore(
    (s) => s.prospectDetailsById[prospect.id]
  )
  const updateProspectStatuses = useProspectStore(
    (s) => s.updateProspectStatuses
  )
  const completeActivationStep = useActivationStore((s) => s.complete)
  const activationHydrated = useActivationStore((s) => s.hasHydrated)
  const pages = usePagesStore((s) => s.pages)
  const outreachSettings = useOutreachSettingsStore((s) => s.settings)
  const current = storedProspect ?? prospect
  const sourcePage =
    current.source_page ??
    (current.product_page_id
      ? (pages.find((page) => page.id === current.product_page_id) ?? null)
      : null)
  const showTargetUrl = Boolean(
    current.target_url && current.target_url !== sourcePage?.url
  )

  const [statusLoading, setStatusLoading] = useState<
    "contacted" | "won" | "dismissed" | "pausing" | null
  >(null)
  const [isApprovingSend, setIsApprovingSend] = useState(false)
  const [pauseModalOpen, setPauseModalOpen] = useState(false)
  const [reportIssueOpen, setReportIssueOpen] = useState(false)
  const [activeEmailIdx, setActiveEmailIdx] = useState(() => {
    const now = Date.now()
    const pending = sequences.findIndex((seq) => {
      const date = new Date(
        seq.sent_at ?? seq.scheduled_at ?? prospect.created_at
      )
      return seq.status !== "sent" && date.getTime() >= now
    })
    return pending === -1 ? 0 : pending
  })
  const [sameThread, setSameThread] = useState(true)

  useEffect(() => {
    upsertProspectDetail(prospect)
    captureEvent("opportunity_viewed", {
      prospect_id: prospect.id,
      tier: prospect.tier,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospect.id])

  // Separate from the view effect: the activation store persists to
  // localStorage, so writing before rehydration would be overwritten.
  useEffect(() => {
    if (!activationHydrated) return
    completeActivationStep("opened_prospect")
  }, [activationHydrated, completeActivationStep])

  const socialLinks = parseSocialLinks(current.contact_social_links)
  const bio = parseRawMetadataBio(current.raw_metadata)
  const fitReason =
    current.tier === "user_submitted"
      ? parseUserSubmittedFitReason(current.raw_metadata)
      : null
  const contactName = nullishString(current.contact_name)
  const contactEmail = nullishString(current.contact_email)
  const tierCfg = PROSPECT_TIER_CONFIG[current.tier]
  const TierIcon = tierCfg?.icon
  const statusCfg = STATUS_CONFIG[current.status]
  const StatusIcon = statusCfg?.icon
  const avatarUrl = getDiceBearUrl(current.domain ?? current.id)
  const favicon = getFaviconUrl(current.domain)
  const dr = current.domain_rating
  const fitScore = current.site_relevance_score
  const hasInboundMessage = messages.some(
    (message) => message.direction !== "outbound"
  )
  const isEnrichingContact =
    current.enrichment_status === "pending" ||
    current.enrichment_status === "enriching"

  function stepLabel(step: number): string {
    if (step === 1) return "Initial outreach"
    if (step === 2) return "Follow-up"
    return "Last follow-up"
  }

  const emailSequence = sequences.map((seq) => {
    const date = new Date(seq.sent_at ?? seq.scheduled_at ?? current.created_at)
    return {
      id: seq.id,
      number: seq.step,
      label: stepLabel(seq.step),
      subject: seq.subject ?? "",
      body: seq.body ?? "",
      status:
        seq.status === "sent"
          ? ("sent" as const)
          : seq.status === "trial_expired"
            ? ("trial_expired" as const)
            : seq.status === "awaiting_approval"
              ? ("awaiting_approval" as const)
              : ("scheduled" as const),
      date,
    }
  })

  const displayStatus = current.status

  const activeEmailUnsafe = emailSequence[activeEmailIdx]
  const activeEmail = activeEmailUnsafe!
  const isNegotiating = current.status === "negotiating"

  const subjectSourceEmail =
    sameThread && activeEmailIdx > 0 ? emailSequence[0] : activeEmailUnsafe
  const [subjectDraft, setSubjectDraft] = useState(
    subjectSourceEmail?.subject ?? ""
  )
  const [bodyDraft, setBodyDraft] = useState(activeEmailUnsafe?.body ?? "")
  const [subjectSaveState, setSubjectSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle")
  const [bodySaveState, setBodySaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle")

  useEffect(() => {
    setSubjectDraft(subjectSourceEmail?.subject ?? "")
    setSubjectSaveState("idle")
    setBodyDraft(activeEmailUnsafe?.body ?? "")
    setBodySaveState("idle")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEmailIdx, sameThread])

  async function saveSequenceField(
    sequenceId: string,
    field: "subject" | "body",
    value: string,
    originalValue: string,
    setSaveState: (state: "idle" | "saving" | "saved" | "error") => void
  ) {
    if (value === originalValue) return
    setSaveState("saving")
    try {
      const res = await fetch(
        `/api/link-building/prospect-sequences/${sequenceId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        }
      )
      if (res.ok) {
        setSaveState("saved")
        router.refresh()
      } else {
        setSaveState("error")
      }
    } catch {
      setSaveState("error")
    }
  }

  function saveIndicator(state: "idle" | "saving" | "saved" | "error") {
    if (state === "saving")
      return <span className="text-[10px] text-muted-foreground">Saving…</span>
    if (state === "saved")
      return <span className="text-[10px] text-emerald-600">Saved</span>
    if (state === "error")
      return (
        <span className="text-[10px] text-destructive">Failed to save</span>
      )
    return null
  }

  async function handleApproveSend() {
    setIsApprovingSend(true)
    try {
      const res = await fetch(
        `/api/link-building/opportunities/${current.id}/approve-send`,
        { method: "POST" }
      )
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setIsApprovingSend(false)
    }
  }

  async function handlePause() {
    setStatusLoading("pausing")
    try {
      const res = await fetch(
        `/api/link-building/opportunities/${current.id}/pause`,
        {
          method: "POST",
        }
      )
      if (res.ok) {
        updateProspectStatuses([current.id], "dismissed")
        setPauseModalOpen(false)
        router.push("/dashboard/prospects")
      }
    } finally {
      setStatusLoading(null)
    }
  }

  async function handleStatusUpdate(status: "contacted" | "won" | "dismissed") {
    setStatusLoading(status)
    try {
      const res = await fetch(
        `/api/link-building/opportunities/${current.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      )
      if (res.ok) {
        updateProspectStatuses([current.id], status)
        if (status === "won") {
          router.refresh()
        } else {
          router.push("/dashboard/prospects")
        }
      }
    } finally {
      setStatusLoading(null)
    }
  }

  return (
    <div
      className="-mx-4 -mt-4 -mb-4 flex flex-col sm:-mx-6 sm:-mt-6 sm:-mb-6"
      style={{ height: "calc(100svh - 3.5rem)" }}
    >
      {/* Prospect identity and actions */}
      <div className="shrink-0 border-b bg-background px-4 py-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
              {favicon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={favicon}
                  alt=""
                  width={20}
                  height={20}
                  className="size-5"
                />
              ) : (
                <div className="size-5 rounded-sm bg-muted" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl leading-tight font-bold tracking-tight break-all">
                {current.domain}
              </h1>
            </div>
            {statusCfg && StatusIcon && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                  statusCfg.color
                )}
              >
                <StatusIcon className="size-3.5" />
                {statusCfg.label}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {displayStatus !== "won" && displayStatus !== "dismissed" && (
              <button
                type="button"
                disabled={statusLoading !== null}
                onClick={() => handleStatusUpdate("won")}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/5 disabled:opacity-40"
              >
                {statusLoading === "won" ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : (
                  <IconTrophy className="size-4" />
                )}
                Mark as won
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="More prospect actions"
                  className="inline-flex size-11 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <IconDots className="size-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {displayStatus !== "dismissed" && (
                  <DropdownMenuItem
                    disabled={statusLoading !== null}
                    onSelect={() => handleStatusUpdate("dismissed")}
                  >
                    <IconCircleX className="size-4" />
                    Mark as dismissed
                  </DropdownMenuItem>
                )}
                {displayStatus !== "dismissed" &&
                  displayStatus !== "won" &&
                  emailSequence.length > 0 && (
                    <DropdownMenuItem
                      disabled={statusLoading !== null}
                      onSelect={() => setPauseModalOpen(true)}
                    >
                      <IconPlayerPause className="size-4" />
                      Pause sequence
                    </DropdownMenuItem>
                  )}
                <DropdownMenuItem onSelect={() => setReportIssueOpen(true)}>
                  <IconFlag className="size-4" />
                  Report issue
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-4 overflow-x-auto">
          <span className="shrink-0 text-xs font-semibold text-muted-foreground">
            Status
          </span>
          <DetailStatusPipeline status={displayStatus} />
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:overflow-hidden">
        {/* ─── Conversation panel ─── */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:order-1 lg:overflow-y-auto">
          {isNegotiating ? (
            /* ── Conversation view ── */
            <ConversationView
              prospect={current}
              sequences={sequences}
              messages={messages}
              isPublicMailbox={isPublicMailbox}
              ownEmailAccounts={ownEmailAccounts}
            />
          ) : displayStatus === "won" ? (
            /* ── Won badge ──
             * wonStats comes from the server and reflects the just-refreshed
             * page; right after clicking "Mark as won" the store flips
             * displayStatus before that refresh lands, so fall back to a
             * single-win placeholder for that brief gap. */
            <WonBadge
              domain={current.domain}
              domainRating={dr}
              wonAt={current.won_at}
              wonStats={wonStats ?? { ordinal: 1, totalWonCount: 1, totalDrEarned: dr ?? 0 }}
            />
          ) : current.status === "email_not_found" &&
            emailSequence.length === 0 ? (
            /* ── Manual completion form ── */
            <ManualCompletionForm
              prospectId={current.id}
              hasEmailAccount={hasEmailAccount}
              foundContactName={contactName}
              domain={current.domain}
              onSuccess={() => {
                updateProspectStatuses([current.id], "new")
                router.refresh()
              }}
              onDismiss={() => handleStatusUpdate("dismissed")}
            />
          ) : current.status === "bounced" ? (
            /* ── Bounced notice ── */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <IconMailX className="size-8 text-red-500/60" />
              <p className="mt-3 text-sm font-medium text-foreground">
                Email bounced
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                The message couldn&apos;t be delivered because the address was
                undeliverable. Outreach for this prospect has stopped.
              </p>
            </div>
          ) : emailSequence.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm font-medium text-foreground">
                No outreach sequence yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Connect an email account to activate automated outreach for this
                prospect.
              </p>
            </div>
          ) : (
            /* ── Email sequence / draft view ── */
            <>
              {current.outreach_stopped_reason && (
                <SequenceStoppedNotice
                  className="mb-5"
                  reason={current.outreach_stopped_reason}
                  stoppedAt={current.outreach_stopped_at}
                />
              )}

              <EmailSequenceNav
                steps={emailSequence}
                activeIdx={activeEmailIdx}
                onSelect={setActiveEmailIdx}
              />

              {activeEmail.status === "awaiting_approval" && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3.5 py-2.5">
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    You're reviewing each email before it sends — this draft
                    is ready and waiting on you.
                  </p>
                  <button
                    type="button"
                    onClick={handleApproveSend}
                    disabled={isApprovingSend}
                    className="shrink-0 rounded-full bg-amber-600 px-3.5 py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {isApprovingSend ? "Sending…" : "Send now"}
                  </button>
                </div>
              )}

              {isFreeUser &&
                isPublicMailbox &&
                emailSequence.some((e) => e.status === "scheduled") && (
                  <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-(--color-blaze-orange)/25 bg-(--color-blaze-orange)/5 px-3.5 py-2.5">
                    <IconClockPause className="size-4 shrink-0 text-(--color-blaze-orange)" />
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Free plan mailboxes send fewer emails per day than paid
                      plans, so this can be delayed.{" "}
                      <a
                        href="/dashboard/settings?tab=billing"
                        className="font-medium text-foreground underline underline-offset-2 transition-opacity hover:opacity-70"
                      >
                        Upgrade
                      </a>{" "}
                      for faster, more reliable sends.
                    </p>
                  </div>
                )}

              {/* Email draft label */}
              <p className="mb-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                {activeEmail.label}
              </p>

              {/* Subject row */}
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Subject
                </p>
                <div className="flex items-center gap-2">
                  {saveIndicator(subjectSaveState)}
                  {activeEmailIdx > 0 && (
                    <label
                      className={cn(
                        "flex items-center gap-2",
                        isFreeUser
                          ? "cursor-not-allowed opacity-40"
                          : "cursor-pointer"
                      )}
                    >
                      <span className="text-[10px] text-muted-foreground">
                        Reply on same thread
                      </span>
                      <Switch
                        checked={sameThread}
                        onCheckedChange={isFreeUser ? undefined : setSameThread}
                        disabled={isFreeUser}
                        aria-label="Reply on same thread"
                      />
                    </label>
                  )}
                </div>
              </div>
              {(!sameThread || activeEmailIdx === 0) && (
                <div className="mb-4">
                  <input
                    type="text"
                    readOnly={activeEmail.status === "sent" || isFreeUser}
                    value={subjectDraft}
                    onChange={(e) => setSubjectDraft(e.target.value)}
                    onBlur={() =>
                      subjectSourceEmail &&
                      saveSequenceField(
                        subjectSourceEmail.id,
                        "subject",
                        subjectDraft,
                        subjectSourceEmail.subject,
                        setSubjectSaveState
                      )
                    }
                    placeholder="Email subject…"
                    className={cn(
                      "w-full rounded-lg border border-border/50 bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition",
                      activeEmail.status === "sent" || isFreeUser
                        ? "cursor-default text-muted-foreground select-text"
                        : "focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none"
                    )}
                  />
                </div>
              )}
              {sameThread && activeEmailIdx > 0 && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-2.5">
                  <span className="text-[11px] text-muted-foreground/60 italic">
                    Re: {emailSequence[0]!.subject || "—"}
                  </span>
                </div>
              )}

              {/* Body */}
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Message
                </p>
                {!isFreeUser && saveIndicator(bodySaveState)}
              </div>
              <div className="mb-5">
                {isFreeUser ? (
                  <div className="overflow-hidden rounded-lg border">
                    <textarea
                      rows={12}
                      readOnly
                      defaultValue={activeEmail.body}
                      key={`body-${activeEmailIdx}`}
                      placeholder="Email body…"
                      className="w-full cursor-default resize-none rounded-none border-0 bg-white px-4 py-3 font-sans text-sm leading-relaxed text-muted-foreground shadow-sm select-text"
                    />
                    <div className="border-t bg-muted/40 px-4 py-3">
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Sent in our behalf, via our shared email accounts —
                        editing is disabled on the free trial.{" "}
                        <a
                          href="/pricing"
                          className="font-medium text-foreground underline underline-offset-2 transition-opacity hover:opacity-70"
                        >
                          Upgrade your plan
                        </a>{" "}
                        to connect your own email and take full control of
                        outreach.
                      </p>
                    </div>
                  </div>
                ) : (
                  <textarea
                    rows={12}
                    readOnly={activeEmail.status === "sent"}
                    value={bodyDraft}
                    onChange={(e) => setBodyDraft(e.target.value)}
                    onBlur={() =>
                      saveSequenceField(
                        activeEmail.id,
                        "body",
                        bodyDraft,
                        activeEmail.body,
                        setBodySaveState
                      )
                    }
                    placeholder="Email body…"
                    className={cn(
                      "w-full resize-none rounded-lg border border-border/50 bg-white px-4 py-3 font-sans text-sm leading-relaxed text-foreground shadow-sm transition",
                      activeEmail.status === "sent"
                        ? "cursor-default text-muted-foreground select-text"
                        : "focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none"
                    )}
                  />
                )}
              </div>

              {outreachSettings?.signatureEnabled &&
                outreachSettings.signatureText.trim() && (
                  <div className="mb-5 rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-3">
                    <p className="mb-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                      Signature — added automatically when sent
                    </p>
                    <SignatureBlockPreview
                      text={outreachSettings.signatureText}
                    />
                  </div>
                )}
            </>
          )}

          <OpportunityReportIssueDialog
            prospectId={current.id}
            domain={current.domain}
            open={reportIssueOpen}
            onOpenChange={setReportIssueOpen}
          />

          <Dialog open={pauseModalOpen} onOpenChange={setPauseModalOpen}>
            <DialogContent>
              <div className="flex flex-col gap-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
                  <IconPlayerPause className="size-5 text-destructive" />
                </div>
                <div className="flex flex-col gap-1">
                  <DialogTitle>Pause sequence</DialogTitle>
                  <DialogDescription>
                    The outreach sequence for{" "}
                    <span className="font-medium text-foreground">
                      {current.domain}
                    </span>{" "}
                    will be paused. No further emails will be sent until you
                    resume it.
                  </DialogDescription>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPauseModalOpen(false)}
                    className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={statusLoading === "pausing"}
                    onClick={handlePause}
                    className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-destructive/90 disabled:opacity-40"
                  >
                    <IconPlayerPause className="size-4" />
                    {statusLoading === "pausing" ? "Pausing…" : "Pause"}
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>

        {/* ─── Opportunity details panel ─── */}
        <aside className="w-full max-w-full min-w-0 overflow-x-hidden border-t bg-background px-4 py-6 sm:px-8 lg:order-2 lg:border-t-0 lg:border-l lg:overflow-y-auto lg:px-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-foreground">
              Opportunity details
            </h2>
            {tierCfg && TierIcon && (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium",
                  tierCfg.color
                )}
              >
                <TierIcon className="size-3" />
                {tierCfg.label}
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <ScoreRow
              label="Domain rating"
              hint="Backlink authority"
              value={dr ?? null}
              barColor={dr != null ? drBarColor(dr) : "bg-muted"}
            />
            <ScoreRow
              label="Site fit"
              hint="Topical match"
              value={fitScore ?? null}
              barColor={fitScore != null ? fitBarColor(fitScore) : "bg-muted"}
            />
          </div>

          {(sourcePage || showTargetUrl || current.found_url) && (
            <section className="mt-4 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
              {sourcePage && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Source article
                  </p>
                  <p className="mt-1 text-sm leading-snug font-semibold text-foreground">
                    {sourcePage.title || getUrlDisplay(sourcePage.url)}
                  </p>
                  <a
                    href={sourcePage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-(--color-blaze-orange) hover:underline"
                  >
                    View article <IconExternalLink className="size-3" />
                  </a>
                </div>
              )}
              {showTargetUrl && current.target_url && (
                <div
                  className={cn(
                    sourcePage && "mt-4 border-t border-border pt-4"
                  )}
                >
                  <p className="text-sm text-muted-foreground">
                    {current.tier === "competitor_backlink"
                      ? "Links to competitor"
                      : current.tier === "resource_page_inclusion"
                        ? "Suggested target page"
                        : current.tier === "user_submitted"
                          ? "Page we're pitching"
                          : "Target"}
                  </p>
                  <a
                    href={current.target_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-(--color-blaze-orange) hover:underline"
                  >
                    {getHostname(current.target_url)}{" "}
                    <IconExternalLink className="size-3" />
                  </a>
                  {fitReason && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {fitReason}
                    </p>
                  )}
                </div>
              )}
              {current.found_url && (
                <div
                  className={cn(
                    (sourcePage || showTargetUrl) &&
                      "mt-4 border-t border-border pt-4"
                  )}
                >
                  <p className="text-sm text-muted-foreground">Found on</p>
                  <a
                    href={current.found_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs break-all text-muted-foreground hover:text-primary"
                  >
                    {getUrlDisplay(current.found_url)}{" "}
                    <IconExternalLink className="size-3 shrink-0" />
                  </a>
                </div>
              )}
            </section>
          )}

          <section className="mt-4 border-b border-border pb-4">
            <p className="text-sm font-medium text-muted-foreground">
              Contact found
            </p>
            <div className="mt-3 flex items-start gap-3">
              {isEnrichingContact ? (
                <>
                  <Skeleton className="size-10 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
                    <Skeleton className="h-3.5 w-24 rounded" />
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/60">
                      <IconLoader2 className="size-3 animate-spin" />
                      {current.enrichment_status === "enriching"
                        ? "Finding contact…"
                        : "Queued…"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  {contactName ? (
                    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="size-10"
                      />
                    </div>
                  ) : (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted">
                      <IconQuestionMark className="size-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {contactName ?? "Unknown contact"}
                    </p>
                    {contactEmail ? (
                      <span className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-emerald-600">
                        <IconMailCheck className="size-3 shrink-0" />
                        <span className="truncate">{contactEmail}</span>
                      </span>
                    ) : (
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground/60">
                        <IconMailOff className="size-3" />
                        No email found
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
            {Object.keys(socialLinks).length > 0 && (
              <div className="mt-3 flex items-center gap-3">
                {socialLinks.twitter && (
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <IconBrandTwitter className="size-4" />
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a
                    href={socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <IconBrandLinkedin className="size-4" />
                  </a>
                )}
                {socialLinks.youtube && (
                  <a
                    href={socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <IconBrandYoutube className="size-4" />
                  </a>
                )}
                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <IconBrandFacebook className="size-4" />
                  </a>
                )}
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <IconBrandInstagram className="size-4" />
                  </a>
                )}
              </div>
            )}
            {hasInboundMessage && (
              <p className="mt-3 text-xs text-muted-foreground/70 italic">
                Reply received from {contactName ?? "this contact"}
              </p>
            )}
          </section>

          {bio && (
            <section className="py-4">
              <div className="flex items-center gap-1.5">
                <IconSparkles className="size-3.5 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  About
                </p>
              </div>
              <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-muted-foreground">
                {bio}
              </p>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
