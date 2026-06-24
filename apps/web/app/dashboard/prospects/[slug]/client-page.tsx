"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandYoutube,
  IconCalendar,
  IconCircleCheck,
  IconCircleX,
  IconClipboard,
  IconExternalLink,
  IconLoader2,
  IconMail,
  IconSparkles,
  IconUser,
} from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"
import type { Json } from "@workspace/supabase/database-types"

import { IconBrandGmail } from "@/components/custom-icons/brand-gmail"
import { IconBrandOutlook } from "@/components/custom-icons/brand-outlook"
import { captureEvent } from "@/lib/analytics"
import { PROSPECT_TIER_CONFIG } from "@/lib/opportunity-types"
import type { ProspectDetail } from "@/stores/prospect-store"
import { useProspectStore } from "@/stores/prospect-store"
import { STATUS_CONFIG, formatDate } from "@/app/dashboard/prospects/_data"

type ProspectProduct = {
  productName: string
  websiteUrl: string
}

function getDiceBearUrl(seed: string): string {
  return `https://api.dicebear.com/10.x/micah/svg?mouthVariant=smirk&facialHairVariant=&hairVariant=dannyPhantom,fonze,full,pixie&hairProbability=100&baseColor=f9c9b6,ac6651,f5bd8a&backgroundColor=ffffff&seed=${encodeURIComponent(seed)}`
}

function parseSocialLinks(raw: Json | null | undefined): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  return Object.fromEntries(
    Object.entries(raw as Record<string, Json>)
      .filter(([, v]) => typeof v === "string")
      .map(([k, v]) => [k, v as string])
  )
}

function parseRawMetadataBio(raw: Json | null | undefined): string | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const obj = raw as Record<string, Json>
  return typeof obj.bio === "string" ? obj.bio : null
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

export function ProspectClientPage({
  prospect,
}: {
  prospect: ProspectDetail
  product: ProspectProduct
}) {
  const router = useRouter()
  const upsertProspectDetail = useProspectStore((s) => s.upsertProspectDetail)
  const storedProspect = useProspectStore((s) => s.prospectDetailsById[prospect.id])
  const updateProspectStatuses = useProspectStore((s) => s.updateProspectStatuses)
  const current = storedProspect ?? prospect

  const [subject, setSubject] = useState(current.email_subject ?? "")
  const [body, setBody] = useState(current.email_body ?? "")
  const [statusLoading, setStatusLoading] = useState<"contacted" | "dismissed" | null>(null)
  const [copied, setCopied] = useState<"subject" | "body" | null>(null)

  useEffect(() => {
    upsertProspectDetail(prospect)
    captureEvent("opportunity_viewed", { prospect_id: prospect.id, tier: prospect.tier })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospect.id])

  useEffect(() => {
    setSubject(current.email_subject ?? "")
    setBody(current.email_body ?? "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.id])

  const socialLinks = parseSocialLinks(current.contact_social_links)
  const bio = parseRawMetadataBio(current.raw_metadata)
  const tierCfg = PROSPECT_TIER_CONFIG[current.tier]
  const TierIcon = tierCfg?.icon
  const statusCfg = STATUS_CONFIG[current.status]
  const StatusIcon = statusCfg?.icon
  const avatarUrl = getDiceBearUrl(current.domain ?? current.id)
  const dr = current.domain_rating

  const hasRecipient = !!current.contact_email?.trim()
  const hasDraft = subject.trim().length > 0 || body.trim().length > 0

  const gmailUrl = hasRecipient
    ? `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(current.contact_email!)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null
  const outlookUrl = hasRecipient
    ? `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(current.contact_email!)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null
  const mailtoUrl = hasRecipient
    ? `mailto:${encodeURIComponent(current.contact_email!)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null

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

  function copyText(text: string, field: "subject" | "body") {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field)
      setTimeout(() => setCopied(null), 1500)
    })
    captureEvent("outreach_email_copied", { prospect_id: current.id, field })
  }

  return (
    <div className="-mx-6 -mt-6 -mb-6 flex flex-col">
      {/* Two-panel layout */}
      <div
        className="flex overflow-hidden"
        style={{ height: "calc(100svh - 3.5rem)" }}
      >
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
                  {statusCfg && StatusIcon && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        statusCfg.color
                      )}
                    >
                      <StatusIcon className="size-3" />
                      {statusCfg.label}
                    </span>
                  )}
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
          {(current.contact_name || current.contact_email) && (
            <section className="mb-4">
              <p className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground mb-1.5">
                Contact
              </p>
              {current.contact_name && (
                <div className="flex items-center gap-1.5 mb-1">
                  <IconUser className="size-3 shrink-0 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">
                    {current.contact_name}
                  </p>
                </div>
              )}
              {current.contact_email && (
                <div className="flex items-center gap-1.5">
                  <IconMail className="size-3 shrink-0 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground truncate">
                    {current.contact_email}
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
          {/* Email draft header row */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
              Email draft
            </p>
            {hasDraft && hasRecipient && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Open in</span>
                {gmailUrl && (
                  <a
                    href={gmailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      captureEvent("outreach_open_in_client", {
                        prospect_id: current.id,
                        client: "gmail",
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <IconBrandGmail className="size-3.5" />
                    Gmail
                  </a>
                )}
                {outlookUrl && (
                  <a
                    href={outlookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      captureEvent("outreach_open_in_client", {
                        prospect_id: current.id,
                        client: "outlook",
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <IconBrandOutlook className="size-3.5" />
                    Outlook
                  </a>
                )}
                {mailtoUrl && (
                  <a
                    href={mailtoUrl}
                    onClick={() =>
                      captureEvent("outreach_open_in_client", {
                        prospect_id: current.id,
                        client: "mailto",
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <IconExternalLink className="size-3.5 text-muted-foreground" />
                    Default
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Subject */}
          <p className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground mb-1">
            Subject
          </p>
          <div className="relative mb-4">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject…"
              className="w-full rounded-lg border bg-card px-4 pr-10 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none transition"
            />
            <button
              type="button"
              onClick={() => copyText(subject, "subject")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <IconClipboard
                className={cn("size-3.5 transition-colors", copied === "subject" && "text-primary")}
              />
            </button>
          </div>

          {/* Body */}
          <p className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground mb-1">
            Message
          </p>
          <div className="relative mb-6">
            <textarea
              rows={12}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Email body…"
              className="w-full rounded-lg border bg-card px-4 pb-8 py-3 text-sm text-foreground leading-relaxed focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none resize-none transition font-sans"
            />
            <button
              type="button"
              onClick={() => copyText(body, "body")}
              className="absolute right-2.5 bottom-2.5 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <IconClipboard
                className={cn("size-3.5 transition-colors", copied === "body" && "text-primary")}
              />
            </button>
          </div>

          {/* Status actions */}
          {current.status === "contacted" ? (
            <div className="inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5 text-sm font-medium text-emerald-700">
              <IconCircleCheck className="size-4" />
              Contacted
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={statusLoading !== null}
                onClick={() => handleStatusUpdate("dismissed")}
                className="inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
              >
                {statusLoading === "dismissed" ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : (
                  <IconCircleX className="size-4" />
                )}
                Dismiss
              </button>
              <button
                type="button"
                disabled={statusLoading !== null}
                onClick={() => handleStatusUpdate("contacted")}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-40"
              >
                {statusLoading === "contacted" ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : (
                  <IconCircleCheck className="size-4" />
                )}
                Mark as contacted
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
