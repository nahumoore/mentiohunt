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
  IconMail,
  IconMailCheck,
  IconMessage2,
  IconPlayerPause,
  IconSend,
  IconSparkles,
  IconUser,
} from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"
import type { Json } from "@workspace/supabase/database-types"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Switch } from "@workspace/ui/components/switch"

import { captureEvent } from "@/lib/analytics"
import { formatRelative } from "@/lib/format-date"
import { PROSPECT_TIER_CONFIG } from "@/lib/opportunity-types"
import type { ProspectDetail, ProspectSequence } from "@/stores/prospect-store"
import { useProspectStore } from "@/stores/prospect-store"
import { STATUS_CONFIG, formatDate, type ProspectStatus } from "@/app/dashboard/prospects/_data"
import { EmailSequenceNav } from "@/components/prospects/email-sequence-nav"

const PIPELINE_STEPS: ProspectStatus[] = ["new", "contacted", "negotiating", "won"]

function DetailStatusPipeline({ status }: { status: ProspectStatus }) {
  if (status === "dismissed") {
    const cfg = STATUS_CONFIG.dismissed
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

function ConversationView({
  prospect,
  sequences,
}: {
  prospect: ProspectDetail
  sequences: ProspectSequence[]
}) {
  const subject = prospect.email_subject ?? "Collaboration opportunity"
  const sentSteps = sequences.filter((s) => s.status === "sent")
  const [replyBody, setReplyBody] = useState("")
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  function handleSend() {
    if (!replyBody.trim()) return
    setIsSending(true)
    setTimeout(() => {
      setIsSending(false)
      setReplyBody("")
    }, 1200)
  }

  function handleAiDraft() {
    setReplyBody(
      `Hi ${prospect.contact_name?.split(" ")[0] ?? "there"},\n\nThanks for getting back to me — really appreciate it.\n\nWe're building [your product description]. The article I had in mind was [article URL], where a mention of our tool in the context of [topic] would feel like a natural fit for your readers.\n\nHappy to share more context or even draft the exact paragraph you could use. Would that be helpful?\n\nBest,\n[Your name]`
    )
  }

  return (
    <div className="flex flex-col">
      {/* Thread subject */}
      <div className="mb-4 flex items-center gap-2">
        <IconMail className="size-3.5 shrink-0 text-muted-foreground/50" />
        <p className="text-[11px] font-semibold text-muted-foreground/60 truncate">
          Re: {subject}
        </p>
      </div>

      {/* Sent messages */}
      <div className="space-y-4 mb-6">
        {sentSteps.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 italic">No emails sent yet.</p>
        ) : (
          sentSteps.map((seq) => (
            <div key={seq.id} className="flex gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-1 bg-primary/10 text-primary ring-primary/20">
                Y
              </div>
              <div className="flex-1 min-w-0 rounded-xl border border-l-2 border-l-primary border-border bg-card px-4 py-3 transition-all">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-semibold text-primary">
                      You (via Mentiohunt)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                      <IconMailCheck className="size-2.5" />
                      Sent
                    </span>
                    {seq.sent_at && (
                      <span className="text-[10px] text-muted-foreground/40">
                        {formatRelative(new Date(seq.sent_at))}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {seq.body ?? ""}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose reply */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Compose header */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-4 py-2">
          <IconMessage2 className="size-3.5 text-muted-foreground/50" />
          <span className="text-[11px] font-semibold text-muted-foreground/60">Reply</span>
          <span className="mx-1 text-muted-foreground/20">·</span>
          <span className="text-[11px] text-muted-foreground/50 truncate">Re: {subject}</span>
        </div>

        {/* To row */}
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">To</span>
          <span className="text-[11px] text-muted-foreground font-medium">
            {prospect.contact_name ?? "Lead"}{" "}
            <span className="text-muted-foreground/50">&lt;{prospect.contact_email ?? `hello@${prospect.domain ?? "example.com"}`}&gt;</span>
          </span>
        </div>

        {/* Textarea */}
        <textarea
          rows={10}
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          placeholder={`Reply to ${prospect.contact_name?.split(" ")[0] ?? "them"}…`}
          className="w-full resize-none bg-transparent px-4 py-3 text-sm text-foreground leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none"
        />

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5">
          <button
            type="button"
            onClick={handleAiDraft}
            className="inline-flex items-center gap-1.5 rounded-full border border-(--color-princeton-orange)/30 bg-(--color-princeton-orange)/8 px-3 py-1.5 text-[11px] font-semibold text-(--color-blaze-orange) transition-colors hover:bg-(--color-princeton-orange)/15"
          >
            <IconSparkles className="size-3" />
            AI Draft
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!replyBody.trim() || isSending}
            className="inline-flex items-center gap-1.5 rounded-full bg-(--color-blaze-orange) px-4 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-(--color-crimson-carrot) disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <IconSend className="size-3" />
            {isSending ? "Sending…" : "Send Reply"}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ProspectClientPage({
  prospect,
  sequences,
  isFreeUser,
}: {
  prospect: ProspectDetail
  product: ProspectProduct
  sequences: ProspectSequence[]
  isFreeUser: boolean
}) {
  const router = useRouter()
  const upsertProspectDetail = useProspectStore((s) => s.upsertProspectDetail)
  const storedProspect = useProspectStore((s) => s.prospectDetailsById[prospect.id])
  const updateProspectStatuses = useProspectStore((s) => s.updateProspectStatuses)
  const current = storedProspect ?? prospect

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
  const dr = current.domain_rating

  function stepLabel(step: number): string {
    if (step === 1) return "Initial outreach"
    if (step === 2) return "Follow-up"
    return "Last follow-up"
  }

  const now = Date.now()
  const emailSequence = sequences.map((seq) => {
    const date = new Date(seq.sent_at ?? seq.scheduled_at ?? current.created_at)
    const isPastScheduled = seq.status !== "sent" && date.getTime() < now
    return {
      number: seq.step,
      label: stepLabel(seq.step),
      subject: seq.subject ?? "",
      body: seq.body ?? "",
      status: (seq.status === "sent" || isPastScheduled) ? ("sent" as const) : ("scheduled" as const),
      date,
    }
  })

  const firstSeq = sequences[0]
  const firstEmailPast =
    firstSeq != null &&
    new Date(firstSeq.sent_at ?? firstSeq.scheduled_at ?? current.created_at).getTime() < now
  const displayStatus =
    current.status === "new" && firstEmailPast ? ("contacted" as const) : current.status

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
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-2.5">
              <div className="size-9 shrink-0 overflow-hidden rounded-lg bg-white border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl}
                  alt=""
                  width={36}
                  height={36}
                  className="size-9"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-heading text-base font-bold tracking-tight leading-tight break-all">
                    {current.domain}
                  </h2>
                </div>
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
            {dr !== null && dr !== undefined && (
              <div className="text-right shrink-0">
                <p className="font-mono text-2xl font-bold text-foreground leading-none tabular-nums">
                  {dr}
                </p>
                <p className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                  DR
                </p>
              </div>
            )}
          </div>

          {/* DR progress bar */}
          {dr !== null && dr !== undefined && (
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-5">
              <div
                className={cn("h-full rounded-full transition-all", drBarColor(dr))}
                style={{ width: `${Math.min(dr, 100)}%` }}
              />
            </div>
          )}

          {/* Contact section */}
          {(contactName || contactEmail) && (
            <section className="mb-4">
              <p className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground mb-1.5">
                Contact
              </p>
              {contactName && (
                <div className="flex items-center gap-1.5 mb-1">
                  <IconUser className="size-3 shrink-0 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">
                    {contactName}
                  </p>
                </div>
              )}
              {contactEmail && (
                <div className="flex items-center gap-1.5">
                  <IconMail className="size-3 shrink-0 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground truncate">
                    {contactEmail}
                  </p>
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
          )}

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
          {(current.found_url || current.target_url) && (
            <section className="mb-4 space-y-2.5">
              <p className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                Links
              </p>
              {current.target_url && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
                    {current.tier === "competitor_backlink" ? "Links to competitor" : "Target"}
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
            <ConversationView prospect={current} sequences={sequences} />
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
