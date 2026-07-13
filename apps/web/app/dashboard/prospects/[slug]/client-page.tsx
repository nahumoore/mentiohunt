"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandYoutube,
  IconCalendar,
  IconCheck,
  IconChevronRight,
  IconExternalLink,
  IconFileText,
  IconLoader2,
  IconMail,
  IconMailCheck,
  IconMailOff,
  IconMessage2,
  IconPlayerPause,
  IconQuestionMark,
  IconSparkles,
} from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"
import type { Json } from "@workspace/supabase/database-types"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Switch } from "@workspace/ui/components/switch"

import { captureEvent } from "@/lib/analytics"
import { formatRelative } from "@/lib/format-date"
import { PROSPECT_TIER_CONFIG } from "@/lib/opportunity-types"
import type { ProspectDetail, ProspectMessage, ProspectSequence } from "@/stores/prospect-store"
import { useProspectStore } from "@/stores/prospect-store"
import { usePagesStore } from "@/stores/pages-store"
import { STATUS_CONFIG, formatDate, type ProspectStatus } from "@/app/dashboard/prospects/_data"
import { EmailSequenceNav } from "@/components/prospects/email-sequence-nav"
import { ManualCompletionForm } from "@/components/link-building/prospects/manual-completion-form"

const PIPELINE_STEPS: ProspectStatus[] = ["new", "contacted", "negotiating", "won"]

function DetailStatusPipeline({ status }: { status: ProspectStatus }) {
  if (status === "dismissed" || status === "email_not_found") {
    const cfg = STATUS_CONFIG[status]
    const Icon = cfg.icon
    return (
      <div className="flex items-center gap-3">
        {PIPELINE_STEPS.map((s, index) => {
          const cfg = STATUS_CONFIG[s]
          const Icon = cfg.icon
          return (
            <div key={s} className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/20">
                <Icon className="size-3" />
                {cfg.label}
              </span>
              {index < PIPELINE_STEPS.length - 1 && (
                <IconChevronRight className="ml-1 size-3 shrink-0 text-muted-foreground/15" />
              )}
            </div>
          )
        })}
        <span className="ml-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground bg-muted">
          <Icon className="size-3.5" />
          {cfg.label}
        </span>
      </div>
    )
  }

  const currentIdx = PIPELINE_STEPS.indexOf(status)

  return (
    <div className="flex items-center gap-0.5">
      {PIPELINE_STEPS.map((s, index) => {
        const cfg = STATUS_CONFIG[s]
        const Icon = cfg.icon
        const isActive = index === currentIdx
        const isPast = index < currentIdx

        return (
          <div key={s} className="flex items-center gap-0.5">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                isActive
                  ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20"
                  : isPast
                    ? "text-primary/50"
                    : "text-muted-foreground/25"
              )}
            >
              {isPast ? <IconCheck className="size-3" /> : <Icon className="size-3" />}
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

function parseSocialLinks(raw: Json | null | undefined): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  return Object.fromEntries(
    Object.entries(raw as Record<string, Json>)
      .filter(([, v]) => typeof v === "string" && nullishString(v as string) !== null)
      .map(([k, v]) => [k, v as string])
  )
}

function parseRawMetadataBio(raw: Json | null | undefined): string | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const obj = raw as Record<string, Json>
  return typeof obj.bio === "string" ? nullishString(obj.bio) : null
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

function ScoreTile({
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
    <div className="rounded-md bg-muted/40 px-3 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-lg font-bold leading-none tabular-nums text-foreground">
        {value ?? "—"}
      </p>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", value != null ? barColor : "bg-muted")}
          style={{ width: `${value != null ? Math.min(value, 100) : 0}%` }}
        />
      </div>
      <p className="mt-1 text-[9px] leading-tight text-muted-foreground/70">{hint}</p>
    </div>
  )
}

function ConversationView({
  prospect,
  sequences,
  messages,
}: {
  prospect: ProspectDetail
  sequences: ProspectSequence[]
  messages: ProspectMessage[]
}) {
  const subject = prospect.email_subject ?? "Collaboration opportunity"
  const sentSteps = sequences.filter((s) => s.status === "sent")
  const storedOutboundSequenceIds = new Set(
    messages.filter((message) => message.direction === "outbound").map((message) => message.sequence_id)
  )
  const threadItems = [
    ...sentSteps.filter((seq) => !storedOutboundSequenceIds.has(seq.id)).map((seq) => ({
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
      direction: message.direction === "outbound" ? ("outbound" as const) : ("inbound" as const),
      date: message.received_at,
      body: message.text_body ?? "",
      classification: message.classification,
      classificationReason: message.classification_reason,
      fromName: message.from_name,
      fromEmail: message.from_email,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  return (
    <div className="flex flex-col">
      {/* Thread subject */}
      <div className="mb-4 flex items-center gap-2">
        <IconMail className="size-3.5 shrink-0 text-muted-foreground/50" />
        <p className="text-[11px] font-semibold text-muted-foreground/60 truncate">
          Re: {subject}
        </p>
      </div>

      {prospect.outreach_stopped_reason && (
        <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
          Sequence stopped: <span className="font-semibold text-foreground">{prospect.outreach_stopped_reason.replace(/_/g, " ")}</span>
          {prospect.outreach_stopped_at ? ` · ${formatRelative(new Date(prospect.outreach_stopped_at))}` : null}
        </div>
      )}

      {/* Thread messages */}
      <div className="space-y-4 mb-6">
        {threadItems.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 italic">No conversation yet.</p>
        ) : (
          threadItems.map((item) => {
            const isOutbound = item.direction === "outbound"
            const isBounce = item.classification === "bounce"
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
                  {isOutbound ? "Y" : (item.fromName?.[0] ?? prospect.contact_name?.[0] ?? "P")}
                </div>
                <div
                  className={cn(
                    "flex-1 min-w-0 rounded-xl border border-l-2 border-border bg-card px-4 py-3 transition-all",
                    isOutbound ? "border-l-primary" : isBounce ? "border-l-destructive" : "border-l-muted-foreground/30"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn("text-[11px] font-semibold", isOutbound ? "text-primary" : "text-foreground")}>
                        {isOutbound ? "You (via Mentiohunt)" : item.fromName || item.fromEmail || prospect.contact_name || "Prospect"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                          isOutbound
                            ? "bg-emerald-500/10 text-emerald-600"
                            : isBounce
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {isBounce ? <IconMailOff className="size-2.5" /> : isOutbound ? <IconMailCheck className="size-2.5" /> : <IconMessage2 className="size-2.5" />}
                        {label}
                      </span>
                      <span className="text-[10px] text-muted-foreground/40">
                        {formatRelative(new Date(item.date))}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {item.body || item.classificationReason || "No message body captured."}
                  </p>
                  {item.classificationReason && !isOutbound && (
                    <p className="mt-2 text-[10px] text-muted-foreground/60">
                      Classified as {label.toLowerCase()}: {item.classificationReason}
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <p className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        Reply from the connected mailbox to preserve the email thread.
      </p>
    </div>
  )
}

export function ProspectClientPage({
  prospect,
  sequences,
  messages,
  isFreeUser,
  hasEmailAccount,
}: {
  prospect: ProspectDetail
  product: ProspectProduct
  sequences: ProspectSequence[]
  messages: ProspectMessage[]
  isFreeUser: boolean
  hasEmailAccount: boolean
}) {
  const router = useRouter()
  const upsertProspectDetail = useProspectStore((s) => s.upsertProspectDetail)
  const storedProspect = useProspectStore((s) => s.prospectDetailsById[prospect.id])
  const updateProspectStatuses = useProspectStore((s) => s.updateProspectStatuses)
  const pages = usePagesStore((s) => s.pages)
  const current = storedProspect ?? prospect
  const sourcePage =
    current.source_page ??
    (current.product_page_id
      ? (pages.find((page) => page.id === current.product_page_id) ?? null)
      : null)
  const showTargetUrl = Boolean(
    current.target_url && current.target_url !== sourcePage?.url
  )

  const [statusLoading, setStatusLoading] = useState<"contacted" | "dismissed" | "pausing" | null>(null)
  const [pauseModalOpen, setPauseModalOpen] = useState(false)
  const [activeEmailIdx, setActiveEmailIdx] = useState(() => {
    const now = Date.now()
    const pending = sequences.findIndex((seq) => {
      const date = new Date(seq.sent_at ?? seq.scheduled_at ?? prospect.created_at)
      return seq.status !== "sent" && date.getTime() >= now
    })
    return pending === -1 ? 0 : pending
  })
  const [sameThread, setSameThread] = useState(true)

  useEffect(() => {
    upsertProspectDetail(prospect)
    captureEvent("opportunity_viewed", { prospect_id: prospect.id, tier: prospect.tier })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospect.id])

  const socialLinks = parseSocialLinks(current.contact_social_links)
  const bio = parseRawMetadataBio(current.raw_metadata)
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
  const isEnrichingContact =
    current.enrichment_status === "pending" || current.enrichment_status === "enriching"

  function stepLabel(step: number): string {
    if (step === 1) return "Initial outreach"
    if (step === 2) return "Follow-up"
    return "Last follow-up"
  }

  const emailSequence = sequences.map((seq) => {
    const date = new Date(seq.sent_at ?? seq.scheduled_at ?? current.created_at)
    return {
      number: seq.step,
      label: stepLabel(seq.step),
      subject: seq.subject ?? "",
      body: seq.body ?? "",
      status: seq.status === "sent" ? ("sent" as const) : ("scheduled" as const),
      date,
    }
  })

  const displayStatus = current.status

  const activeEmail = emailSequence[activeEmailIdx]!
  const isNegotiating = current.status === "negotiating"

  async function handlePause() {
    setStatusLoading("pausing")
    try {
      const res = await fetch(`/api/link-building/opportunities/${current.id}/pause`, {
        method: "POST",
      })
      if (res.ok) {
        updateProspectStatuses([current.id], "dismissed")
        setPauseModalOpen(false)
        router.push("/dashboard/prospects")
      }
    } finally {
      setStatusLoading(null)
    }
  }

  async function handleStatusUpdate(status: "contacted" | "dismissed") {
    setStatusLoading(status)
    try {
      const res = await fetch(`/api/link-building/opportunities/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        updateProspectStatuses([current.id], status)
        router.push("/dashboard/prospects")
      }
    } finally {
      setStatusLoading(null)
    }
  }

  return (
    <div
      className="-mx-6 -mt-6 -mb-6 flex flex-col"
      style={{ height: "calc(100svh - 3.5rem)" }}
    >
      {/* Pipeline status header */}
      <div className="flex shrink-0 items-center gap-4 border-b bg-background px-8 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
          Status
        </span>
        <DetailStatusPipeline status={displayStatus} />
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── Left sidebar ─── */}
        <aside className="w-[320px] shrink-0 overflow-y-auto border-r bg-background px-5 py-6">
          {/* Site identity */}
          <div className="flex items-start gap-2.5 mb-4">
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white border border-border">
              {favicon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={favicon} alt="" width={20} height={20} className="size-5" />
              ) : (
                <div className="size-5 rounded-sm bg-muted" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-heading text-base font-bold tracking-tight leading-tight break-all">
                {current.domain}
              </h2>
              {current.found_url && (
                <a
                  href={current.found_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary mt-0.5 transition-colors"
                >
                  Found article <IconExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>

          {/* Score tiles */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            <ScoreTile
              label="Domain Rating"
              hint="Backlink authority of this site"
              value={dr ?? null}
              barColor={dr != null ? drBarColor(dr) : "bg-muted"}
            />
            <ScoreTile
              label="Site Fit"
              hint="Topical match with your product"
              value={fitScore ?? null}
              barColor={fitScore != null ? fitBarColor(fitScore) : "bg-muted"}
            />
          </div>

          {/* Contact section */}
          <section className="mb-4">
            <p className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground mb-1.5">
              Contact
            </p>
            {isEnrichingContact ? (
              <div className="flex items-start gap-2.5">
                <Skeleton className="size-9 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/60">
                    <IconLoader2 className="size-3 shrink-0 animate-spin" />
                    {current.enrichment_status === "enriching" ? "Finding contact…" : "Queued…"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5">
                {contactName ? (
                  <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatarUrl} alt="" width={36} height={36} className="size-9" />
                  </div>
                ) : (
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted border border-border">
                    <IconQuestionMark className="size-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {contactName ?? "Unknown contact"}
                  </p>
                  {contactEmail ? (
                    <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-emerald-600">
                      <IconMailCheck className="size-3 shrink-0" />
                      <span className="truncate">{contactEmail}</span>
                    </span>
                  ) : (
                    <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground/60">
                      <IconMailOff className="size-3 shrink-0" />
                      No email found
                    </span>
                  )}
                </div>
              </div>
            )}
            {Object.keys(socialLinks).length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                {socialLinks.twitter && (
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <IconBrandTwitter className="size-3.5" />
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a
                    href={socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <IconBrandLinkedin className="size-3.5" />
                  </a>
                )}
                {socialLinks.youtube && (
                  <a
                    href={socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <IconBrandYoutube className="size-3.5" />
                  </a>
                )}
                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <IconBrandFacebook className="size-3.5" />
                  </a>
                )}
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <IconBrandInstagram className="size-3.5" />
                  </a>
                )}
              </div>
            )}
          </section>

          {/* Bio / about */}
          {bio && (
            <section className="mb-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <IconSparkles className="size-3 text-muted-foreground" />
                <p className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                  About
                </p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{bio}</p>
            </section>
          )}

          {/* Links section */}
          {(current.found_url || showTargetUrl || sourcePage) && (
            <section className="mb-4 space-y-2.5">
              <p className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                Links
              </p>
              {sourcePage && (
                <div>
                  <div className="mb-0.5 flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide">
                    <IconFileText className="size-3" />
                    <span>Found using your page</span>
                  </div>
                  <a
                    href={sourcePage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline break-all leading-relaxed"
                  >
                    {sourcePage.title || getUrlDisplay(sourcePage.url)}
                  </a>
                </div>
              )}
              {showTargetUrl && current.target_url && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
                    {current.tier === "competitor_backlink"
                      ? "Links to competitor"
                      : current.tier === "resource_page_inclusion"
                        ? "Suggested target page"
                        : "Target"}
                  </p>
                  <a
                    href={current.target_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline break-all leading-relaxed"
                  >
                    {getHostname(current.target_url)}
                  </a>
                </div>
              )}
              {current.found_url && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
                    Found on
                  </p>
                  <a
                    href={current.found_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary break-all leading-relaxed transition-colors"
                  >
                    {getUrlDisplay(current.found_url)}
                  </a>
                </div>
              )}
            </section>
          )}

          {/* Discovered date */}
          <div className="flex items-center gap-1.5 mb-3">
            <IconCalendar className="size-3 shrink-0 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">
              Discovered {formatDate(current.discovered_at)}
            </p>
          </div>

          {/* Tier badge */}
          {tierCfg && TierIcon && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium",
                tierCfg.color
              )}
            >
              <TierIcon className="size-3" />
              {tierCfg.label}
            </span>
          )}
        </aside>

        {/* ─── Main panel ─── */}
        <div className="flex-1 overflow-y-auto px-8 py-6">

          {isNegotiating ? (
            /* ── Conversation view ── */
            <ConversationView prospect={current} sequences={sequences} messages={messages} />
          ) : current.status === "email_not_found" && emailSequence.length === 0 ? (
            /* ── Manual completion form ── */
            <ManualCompletionForm
              prospectId={current.id}
              hasEmailAccount={hasEmailAccount}
              onSuccess={() => {
                updateProspectStatuses([current.id], "new")
                router.refresh()
              }}
              onDismiss={() => handleStatusUpdate("dismissed")}
            />
          ) : emailSequence.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm font-medium text-foreground">No outreach sequence yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Connect an email account to activate automated outreach for this prospect.
              </p>
            </div>
          ) : (
            /* ── Email sequence / draft view ── */
            <>
              {current.outreach_stopped_reason && (
                <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
                  Outreach stopped: <span className="font-semibold text-foreground">{current.outreach_stopped_reason.replace(/_/g, " ")}</span>
                  {current.outreach_stopped_at ? ` · ${formatRelative(new Date(current.outreach_stopped_at))}` : null}
                </div>
              )}

              <EmailSequenceNav
                steps={emailSequence}
                activeIdx={activeEmailIdx}
                onSelect={setActiveEmailIdx}
              />

              {/* Email draft label */}
              <p className="mb-3 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                {activeEmail.label}
              </p>

              {/* Subject row */}
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                  Subject
                </p>
                {activeEmailIdx > 0 && (
                  <label className={cn("flex items-center gap-2", isFreeUser ? "cursor-not-allowed opacity-40" : "cursor-pointer")}>
                    <span className="text-[10px] text-muted-foreground">Reply on same thread</span>
                    <Switch
                      checked={sameThread}
                      onCheckedChange={isFreeUser ? undefined : setSameThread}
                      disabled={isFreeUser}
                      aria-label="Reply on same thread"
                    />
                  </label>
                )}
              </div>
              {(!sameThread || activeEmailIdx === 0) && (
                <div className="mb-4">
                  <input
                    type="text"
                    readOnly={activeEmail.status === "sent" || isFreeUser}
                    defaultValue={activeEmailIdx > 0 ? emailSequence[0]!.subject : activeEmail.subject}
                    key={`subject-${activeEmailIdx}-${sameThread}`}
                    placeholder="Email subject…"
                    className={cn(
                      "w-full rounded-lg border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition",
                      activeEmail.status === "sent" || isFreeUser
                        ? "cursor-default select-text text-muted-foreground"
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
              <p className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground mb-1">
                Message
              </p>
              <div className="mb-5">
                {isFreeUser ? (
                  <div className="overflow-hidden rounded-lg border">
                    <textarea
                      rows={12}
                      readOnly
                      defaultValue={activeEmail.body}
                      key={`body-${activeEmailIdx}`}
                      placeholder="Email body…"
                      className="w-full rounded-none border-0 bg-card px-4 py-3 text-sm text-muted-foreground leading-relaxed resize-none font-sans cursor-default select-text"
                    />
                    <div className="border-t bg-muted/40 px-4 py-3">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Sent in our behalf, via our shared email accounts — editing is disabled on the free trial.{" "}
                        <a href="/pricing" className="font-medium text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity">
                          Upgrade your plan
                        </a>{" "}
                        to connect your own email and take full control of outreach.
                      </p>
                    </div>
                  </div>
                ) : (
                  <textarea
                    rows={12}
                    readOnly={activeEmail.status === "sent"}
                    defaultValue={activeEmail.body}
                    key={`body-${activeEmailIdx}`}
                    placeholder="Email body…"
                    className={cn(
                      "w-full rounded-lg border bg-card px-4 py-3 text-sm text-foreground leading-relaxed resize-none transition font-sans",
                      activeEmail.status === "sent"
                        ? "cursor-default select-text text-muted-foreground"
                        : "focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none"
                    )}
                  />
                )}
              </div>

              {/* Status actions */}
              {displayStatus !== "dismissed" && displayStatus !== "won" && (
                <button
                  type="button"
                  disabled={statusLoading !== null}
                  onClick={() => setPauseModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-40"
                >
                  <IconPlayerPause className="size-4" />
                  Pause sequence
                </button>
              )}
            </>
          )}

          <Dialog open={pauseModalOpen} onOpenChange={setPauseModalOpen}>
            <DialogContent>
              <div className="flex flex-col gap-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
                  <IconPlayerPause className="size-5 text-destructive" />
                </div>
                <div className="flex flex-col gap-1">
                  <DialogTitle>Pause sequence</DialogTitle>
                  <DialogDescription>
                    The outreach sequence for <span className="font-medium text-foreground">{current.domain}</span> will be paused. No further emails will be sent until you resume it.
                  </DialogDescription>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPauseModalOpen(false)}
                    className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={statusLoading === "pausing"}
                    onClick={handlePause}
                    className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-white hover:bg-destructive/90 transition-colors disabled:opacity-40"
                  >
                    <IconPlayerPause className="size-4" />
                    {statusLoading === "pausing" ? "Pausing…" : "Pause"}
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
