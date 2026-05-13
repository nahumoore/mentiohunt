"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  IconAlertCircle,
  IconArrowLeft,
  IconArrowUpRight,
  IconCheck,
  IconChevronRight,
  IconCircleCheck,
  IconCircleX,
  IconClipboardCheck,
  IconCopy,
  IconExternalLink,
  IconInfoCircle,
  IconMail,
  IconSearch,
  IconUser,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type { ProspectDetail } from "@/stores/prospect-store"
import { useProspectStore } from "@/stores/prospect-store"
import {
  ACTION_TYPE_CONFIG,
  STATUS_CONFIG,
  TYPE_CONFIG,
  formatDate,
  type ProspectActionType,
  type ProspectStatus,
  type ProspectTier,
} from "../_data"

const STATUS_ORDER: ProspectStatus[] = [
  "new",
  "submitted",
  "contacted",
  "replied",
  "won",
]

type ProspectProduct = {
  productName: string
  websiteUrl: string
}

function TypeBadge({ type }: { type: ProspectTier }) {
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

function ActionBadge({ actionType }: { actionType: ProspectActionType }) {
  const cfg = ACTION_TYPE_CONFIG[actionType]
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

function StatusPipeline({ status }: { status: ProspectStatus }) {
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
      {STATUS_ORDER.map((nextStatus, index) => {
        const cfg = STATUS_CONFIG[nextStatus]
        const Icon = cfg.icon
        const isActive = index === currentIdx
        const isPast = index < currentIdx

        return (
          <div key={nextStatus} className="flex items-center gap-0.5">
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
            {index < STATUS_ORDER.length - 1 && (
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
      type="button"
      onClick={copy}
      className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Copy text"
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
    <p className="mb-3 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
      {children}
    </p>
  )
}

function EmailDraft({ subject, body }: { subject: string; body: string }) {
  return (
    <div className="overflow-hidden rounded-3xl ring-1 ring-foreground/8">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/40 px-5 py-3">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <span className="shrink-0 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            Subject
          </span>
          <span className="truncate text-sm font-medium">{subject}</span>
        </div>
        <CopyButton text={subject} />
      </div>

      <div className="relative bg-card px-5 py-4">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
          {body}
        </pre>
        <div className="absolute top-3 right-3">
          <CopyButton text={body} />
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/50 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  )
}

function SelfServeActionLink({
  href,
  icon: Icon,
  title,
  description,
  primary = false,
}: {
  href: string
  icon: typeof IconInfoCircle
  title: string
  description: string
  primary?: boolean
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-start gap-3 rounded-2xl p-3.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
        primary
          ? "bg-foreground text-background hover:bg-foreground/90"
          : "border border-border/70 bg-background hover:border-orange/25 hover:bg-orange/5"
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          primary ? "bg-background/15" : "bg-orange/10 text-orange-700"
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <p
          className={cn(
            "mt-1 text-xs leading-5",
            primary ? "text-background/70" : "text-muted-foreground"
          )}
        >
          {description}
        </p>
      </div>
      <IconArrowUpRight
        className={cn(
          "mt-1 size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
          primary ? "text-background/70" : "text-muted-foreground"
        )}
      />
    </a>
  )
}

function CompactFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-l border-border/70 pl-3">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
    </div>
  )
}

function getTargetLabel(targetUrl: string) {
  try {
    const url = new URL(targetUrl)
    return `${url.hostname.replace(/^www\./, "")}${url.pathname === "/" ? "" : url.pathname}`
  } catch {
    return targetUrl
  }
}

function getHostname(rawUrl: string) {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "")
  } catch {
    return (
      rawUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ??
      rawUrl
    )
  }
}

function getSerpUrl(prospect: ProspectDetail, product: ProspectProduct) {
  const productHost = getHostname(product.websiteUrl)
  const query = [`site:${prospect.domain}`, `"${product.productName}"`]

  if (productHost) {
    query.push(`"${productHost}"`)
  }

  return `https://www.google.com/search?q=${encodeURIComponent(query.join(" "))}`
}

function getProspectReason(prospect: ProspectDetail) {
  if (prospect.notes?.trim()) return prospect.notes

  return TYPE_CONFIG[prospect.tier].description
}

function SelfServeDirectorySections({
  prospect,
  product,
}: {
  prospect: ProspectDetail
  product: ProspectProduct
}) {
  const serpUrl = getSerpUrl(prospect, product)
  const productHost = getHostname(product.websiteUrl)

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <SectionLabel>Submission brief</SectionLabel>
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                Submit once, then confirm indexing.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                This is a self-serve directory opportunity. Use the target page to
                add {product.productName}, then verify whether Google can find the
                listing for the product and domain.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-orange/10 px-3 py-1 text-xs font-semibold text-orange-700">
              <IconClipboardCheck className="size-3.5" />
              Self-serve
            </span>
          </div>

          <div className="grid gap-3 rounded-2xl bg-muted/35 p-4 sm:grid-cols-3">
            <CompactFact label="Product" value={product.productName} />
            <CompactFact label="Product domain" value={productHost} />
            <CompactFact label="Added" value={formatDate(prospect.created_at)} />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-sm font-semibold">Why it is queued</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Mentiohunt could not find an indexed listing for {product.productName}
                when checking this directory with your product name and domain.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="flex gap-3">
                <IconAlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold">Already submitted?</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Treat it as an indexing issue. The listing may need an owner
                    nudge or an extra internal backlink before Google sees it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside className="flex flex-col gap-4">
        <section className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm">
          <SectionLabel>Next moves</SectionLabel>
          <div className="flex flex-col gap-2.5">
            <SelfServeActionLink
              href={prospect.target_url}
              icon={IconClipboardCheck}
              title="Open submission page"
              description="Submit the product directly on the directory."
              primary
            />
            <SelfServeActionLink
              href={serpUrl}
              icon={IconSearch}
              title="Check Google result"
              description="Confirm whether the listing is indexed."
            />
          </div>
        </section>

        <section className="rounded-3xl border border-orange/15 bg-orange/5 p-4">
          <SectionLabel>Target page</SectionLabel>
          <a
            href={prospect.target_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-2 text-sm font-medium text-orange-700 transition-colors hover:text-orange-800"
          >
            <IconExternalLink className="size-4 shrink-0" />
            <span className="truncate">{getTargetLabel(prospect.target_url)}</span>
          </a>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            If it redirects, submit on the final directory page.
          </p>
        </section>
      </aside>
    </div>
  )
}

function EmailOutreachSections({
  prospect,
  hasEmailDraft,
  hasContact,
}: {
  prospect: ProspectDetail
  hasEmailDraft: boolean
  hasContact: boolean
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="flex flex-col gap-8">
        <section>
          <SectionLabel>Why this is in your queue</SectionLabel>
          <blockquote className="border-l-[3px] border-[var(--blaze-orange)] pl-5">
            <p className="leading-relaxed">{getProspectReason(prospect)}</p>
          </blockquote>
        </section>

        {hasEmailDraft ? (
          <section>
            <SectionLabel>Email draft</SectionLabel>
            <EmailDraft subject={prospect.email_subject} body={prospect.email_body} />
          </section>
        ) : (
          <section>
            <SectionLabel>Next action</SectionLabel>
            <div className="rounded-3xl border border-dashed border-orange/25 bg-orange/5 px-5 py-4">
              <p className="text-sm leading-6">
                Open the target page and complete the self-serve submission or
                review the page before preparing outreach.
              </p>
            </div>
          </section>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <div className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5">
          <SectionLabel>Queue data</SectionLabel>
          <div className="grid gap-3">
            <Metric label="Type" value={TYPE_CONFIG[prospect.tier].label} />
            <Metric
              label="Action"
              value={ACTION_TYPE_CONFIG[prospect.action_type].label}
            />
            <Metric label="Created" value={formatDate(prospect.created_at)} />
          </div>
        </div>

        <div className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5">
          <SectionLabel>Contact</SectionLabel>
          {hasContact ? (
            <div className="flex flex-col gap-3">
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                <IconAlertCircle className="size-3" />
                Unverified
              </span>
              <div className="flex flex-col divide-y divide-border/50 rounded-2xl bg-muted/50">
                {prospect.contact_name && (
                  <div className="flex items-center gap-2.5 px-3 py-2.5 text-sm">
                    <IconUser className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="font-medium">{prospect.contact_name}</span>
                  </div>
                )}
                {prospect.contact_email && (
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <IconMail className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-xs">
                        {prospect.contact_email}
                      </span>
                    </div>
                    <CopyButton text={prospect.contact_email} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No contact found yet. Use the target page to submit directly or
              check the site&apos;s about page before outreach.
            </p>
          )}
        </div>

        <div className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5">
          <SectionLabel>Actions</SectionLabel>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full justify-start gap-2">
              <a href={prospect.target_url} target="_blank" rel="noopener noreferrer">
                <IconExternalLink className="size-4" />
                Open target
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <IconCircleCheck className="size-4" />
              Mark as contacted
            </Button>
            <Button variant="destructive" className="w-full justify-start gap-2">
              <IconCircleX className="size-4" />
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProspectClientPage({
  prospect,
  product,
}: {
  prospect: ProspectDetail
  product: ProspectProduct
}) {
  const upsertProspectDetail = useProspectStore(
    (state) => state.upsertProspectDetail
  )
  const storedProspect = useProspectStore(
    (state) => state.prospectDetailsById[prospect.id]
  )
  const currentProspect = storedProspect ?? prospect
  const hasEmailDraft =
    currentProspect.email_subject.trim().length > 0 &&
    currentProspect.email_body.trim().length > 0
  const hasContact = Boolean(
    currentProspect.contact_name?.trim() || currentProspect.contact_email?.trim()
  )
  const isSelfServe = currentProspect.action_type === "self_service"

  useEffect(() => {
    upsertProspectDetail(prospect)
  }, [prospect, upsertProspectDetail])

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

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={currentProspect.tier} />
            <ActionBadge actionType={currentProspect.action_type} />
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              Discovered {formatDate(currentProspect.discovered_at)}
            </span>
          </div>

          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {currentProspect.domain}
            </h1>
            <p className="mt-1 max-w-prose text-sm text-muted-foreground">
              {isSelfServe
                ? "Self-serve directory opportunity. Submit the product, then verify whether the listing is indexed in Google."
                : ACTION_TYPE_CONFIG[currentProspect.action_type].description}
            </p>
          </div>

          <a
            href={currentProspect.target_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit max-w-full items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconExternalLink className="size-3.5 shrink-0" />
            <span className="truncate">
              {getTargetLabel(currentProspect.target_url)}
            </span>
          </a>

          {!isSelfServe && (
            <div className="mt-1">
              <StatusPipeline status={currentProspect.status} />
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-border" />

      {isSelfServe ? (
        <SelfServeDirectorySections prospect={currentProspect} product={product} />
      ) : (
        <EmailOutreachSections
          prospect={currentProspect}
          hasEmailDraft={hasEmailDraft}
          hasContact={hasContact}
        />
      )}
    </div>
  )
}
