import {
  IconArrowBackUp,
  IconCheck,
  IconDatabase,
  IconMailForward,
  IconMailOpened,
  IconSend,
  IconX,
} from "@tabler/icons-react"
import { type ComponentType } from "react"

type Benefit = {
  eyebrow: string
  title: string
  description: string
  Illustration: ComponentType
}

// ─── Illustrations ────────────────────────────────────────────────────────────

const TOOLS = [
  { name: "Ahrefs", domain: "ahrefs.com", price: "$129/mo" },
  { name: "Instantly", domain: "instantly.ai", price: "$47/mo" },
  { name: "Hunter.io", domain: "hunter.io", price: "$49/mo" },
]

function ToolStackIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-[0_18px_60px_-32px_rgba(0,0,0,0.45)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/60 to-transparent" />
      <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-[var(--color-princeton-orange)]/12 blur-3xl" />

      <div className="relative space-y-2">
        <p className="mb-3 text-[0.62rem] font-bold text-muted-foreground uppercase">
          Tools you&apos;d need otherwise
        </p>
        {TOOLS.map((tool) => (
          <div
            key={tool.name}
            className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3.5 py-2.5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://www.google.com/s2/favicons?domain=${tool.domain}&sz=32`}
              alt=""
              width={16}
              height={16}
              className="h-4 w-4 shrink-0"
            />
            <span className="flex-1 text-sm font-medium text-foreground/70">
              {tool.name}
            </span>
            <span className="text-sm font-semibold text-muted-foreground/60">
              {tool.price}
            </span>
          </div>
        ))}

        <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3.5 py-2.5">
          <div className="flex h-4 w-4 shrink-0 items-center justify-center">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              className="h-4 w-4 text-muted-foreground/50"
            >
              <circle
                cx="8"
                cy="8"
                r="6.5"
                stroke="currentColor"
                strokeWidth="1.25"
              />
              <path
                d="M8 4.5v3.75l2.5 1.5"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="flex-1 text-sm font-medium text-foreground/70">
            Your time
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/40">~10h/mo</span>
            <span className="text-sm font-semibold text-muted-foreground/60">
              ≈$500/mo
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-3.5 py-2">
          <span className="text-xs text-muted-foreground/50">Real total</span>
          <span className="text-sm font-bold text-muted-foreground/50">
            ~$725/mo
          </span>
        </div>

        <div className="!mt-4 flex items-center gap-3 rounded-xl border border-[var(--color-blaze-orange)]/30 bg-[var(--color-blaze-orange)]/8 px-3.5 py-3 ring-1 ring-[var(--color-blaze-orange)]/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.google.com/s2/favicons?domain=mentiohunt.com&sz=32"
            alt=""
            width={16}
            height={16}
            className="h-4 w-4 shrink-0"
          />
          <span className="flex-1 text-sm font-semibold text-foreground">
            Mentiohunt
          </span>
          <span className="font-heading text-2xl font-bold text-[var(--color-blaze-orange)]">
            $49/mo
          </span>
        </div>
      </div>
    </div>
  )
}

function AgencyIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-[0_18px_60px_-32px_rgba(0,0,0,0.45)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-glow)]/70 to-transparent" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-[var(--color-amber-flame)]/12 blur-3xl" />

      <div className="relative space-y-2">
        <p className="mb-3 text-[0.62rem] font-bold text-muted-foreground uppercase">
          What actually happens
        </p>

        {/* Agency → Site */}
        <div className="flex items-start gap-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[0.55rem] font-bold text-blue-500 dark:bg-blue-900/40 dark:text-blue-400">
            A
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-border bg-background/70 px-3.5 py-2.5">
            <p className="text-[0.6rem] font-bold text-blue-400/80">Agency</p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/70">
              Hi, we&apos;d like to feature a client on your blog. What&apos;s
              your placement rate?
            </p>
          </div>
        </div>

        {/* Site → Agency */}
        <div className="flex items-start justify-end gap-2.5">
          <div className="max-w-[80%] rounded-2xl rounded-tr-sm border border-border bg-background/70 px-3.5 py-2.5 text-right">
            <p className="text-[0.6rem] font-bold text-emerald-500/80">
              Site Owner
            </p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/70">
              Sure! Our sponsored post fee is{" "}
              <span className="font-bold text-foreground">$100.</span>
            </p>
          </div>
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[0.55rem] font-bold text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
            S
          </div>
        </div>

        {/* Dotted separator */}
        <div className="flex items-center gap-2 py-1">
          <div className="flex-1 border-t border-dashed border-border/60" />
          <span className="text-[0.58rem] text-muted-foreground/40">
            agency reports back
          </span>
          <div className="flex-1 border-t border-dashed border-border/60" />
        </div>

        {/* Agency → You */}
        <div className="flex items-start gap-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[0.55rem] font-bold text-blue-500 dark:bg-blue-900/40 dark:text-blue-400">
            A
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-red-200/60 bg-red-50/40 px-3.5 py-2.5 dark:border-red-900/30 dark:bg-red-950/20">
            <p className="text-[0.6rem] font-bold text-red-400/80">Agency</p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/70">
              Great news! We secured the placement. That&apos;ll be{" "}
              <span className="font-bold text-red-500">$250.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const INBOX_STEPS = [
  {
    Icon: IconSend,
    title: "Sent from pool inbox #14",
    subtitle: "warmed account, not your domain",
  },
  {
    Icon: IconMailOpened,
    title: "Prospect opens & reads",
    subtitle: "your sender reputation untouched",
  },
  {
    Icon: IconArrowBackUp,
    title: "Prospect replies",
    subtitle: "automation stops here",
  },
  {
    Icon: IconMailForward,
    title: "Forwarded to your inbox",
    subtitle: "you take it from there",
    final: true,
  },
]

function InboxSafetyIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-[0_18px_60px_-32px_rgba(0,0,0,0.45)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/60 to-transparent" />
      <div className="pointer-events-none absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-[var(--color-princeton-orange)]/10 blur-3xl" />

      <div className="relative">
        <p className="mb-4 text-[0.62rem] font-bold text-muted-foreground uppercase">
          What happens to a reply
        </p>

        <div className="space-y-0">
          {INBOX_STEPS.map((step, i) => (
            <div key={step.title} className="flex gap-3.5">
              <div className="flex flex-col items-center">
                <div
                  className={
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full " +
                    (step.final
                      ? "bg-[var(--color-blaze-orange)] text-white"
                      : "bg-[var(--color-blaze-orange)]/10 text-[var(--color-blaze-orange)]")
                  }
                >
                  <step.Icon className="h-4 w-4" />
                </div>
                {i < INBOX_STEPS.length - 1 && (
                  <div className="my-1 w-px flex-1 bg-border" />
                )}
              </div>
              <div className={i < INBOX_STEPS.length - 1 ? "pb-5" : ""}>
                <p
                  className={
                    "pt-1 text-sm font-semibold " +
                    (step.final
                      ? "text-[var(--color-blaze-orange)]"
                      : "text-foreground")
                  }
                >
                  {step.title}
                </p>
                <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
                  {step.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const CRAWL_PATHS = [
  { path: "/about", result: "founder name found" },
  { path: "/contact", result: "email verified" },
  { path: "/blog/growth-guide", result: "fit angle scored" },
  { path: "/pricing", result: "scanning…", pending: true },
]

function LiveScrapingIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-[0_18px_60px_-32px_rgba(0,0,0,0.45)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/60 to-transparent" />
      <div className="pointer-events-none absolute -top-12 -left-12 h-36 w-36 rounded-full bg-[var(--color-princeton-orange)]/10 blur-3xl" />

      <div className="relative space-y-4">
        {/* Stale-database comparison strip */}
        <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-border bg-muted/40 px-3.5 py-2.5">
          <IconDatabase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="text-[0.68rem] text-muted-foreground">
            Old B2B database record:{" "}
            <span className="font-semibold text-foreground/70 line-through decoration-muted-foreground/50">
              synced 9 months ago
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase">
            vs. Mentiohunt
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Header: site + live badge */}
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.google.com/s2/favicons?domain=saastr.com&sz=32"
            alt=""
            width={18}
            height={18}
            className="h-[18px] w-[18px] shrink-0 rounded-sm"
          />
          <span className="flex-1 truncate text-sm font-semibold text-foreground">
            saastr.com
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-[var(--color-blaze-orange)]/10 px-2.5 py-1 text-[0.58rem] font-bold text-[var(--color-blaze-orange)] uppercase">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-blaze-orange)] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-blaze-orange)]" />
            </span>
            Live · just now
          </span>
        </div>

        {/* Terminal-style crawl log */}
        <div className="rounded-xl border border-border/70 bg-background/60 p-3.5 font-mono">
          {CRAWL_PATHS.map((crawl) => (
            <div
              key={crawl.path}
              className="flex items-center gap-2.5 py-1 first:pt-0 last:pb-0"
            >
              {crawl.pending ? (
                <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
                  <span className="absolute inline-flex h-1.5 w-1.5 animate-ping rounded-full bg-[var(--color-blaze-orange)]/70" />
                  <span className="relative inline-flex h-1 w-1 rounded-full bg-[var(--color-blaze-orange)]" />
                </span>
              ) : (
                <IconCheck className="h-2.5 w-2.5 shrink-0 text-[var(--color-blaze-orange)]" />
              )}
              <span className="text-[0.68rem] font-medium text-foreground/80">
                {crawl.path}
              </span>
              <span
                className={
                  "ml-auto text-[0.62rem] " +
                  (crawl.pending
                    ? "text-muted-foreground/50 italic"
                    : "text-muted-foreground")
                }
              >
                {crawl.result}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const BLOCKED = [
  { domain: "backlinkshop.shop", tag: "PBN" },
  { domain: "high-quality-backlinks.site", tag: "link farm" },
  { domain: "seorankoo.site", tag: "ghost site" },
]

const APPROVED = [
  { domain: "saastr.com", dr: "DR 75", traffic: "2.1M/mo" },
  { domain: "hackernoon.com", dr: "DR 89", traffic: "3.4M/mo" },
]

function RealSitesIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-[0_18px_60px_-32px_rgba(0,0,0,0.45)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/60 to-transparent" />
      <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-[var(--color-princeton-orange)]/10 blur-3xl" />

      <div className="relative space-y-3">
        <p className="text-[0.62rem] font-bold text-muted-foreground uppercase">
          Filtered out
        </p>
        <div className="space-y-2">
          {BLOCKED.map((site) => (
            <div
              key={site.domain}
              className="flex items-center gap-3 rounded-xl border border-border bg-background/50 px-3.5 py-2.5 opacity-50"
            >
              <IconX className="h-3.5 w-3.5 shrink-0 text-red-400" />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground/50 line-through">
                {site.domain}
              </span>
              <span className="shrink-0 rounded-full bg-red-100/60 px-2 py-0.5 text-[0.58rem] font-semibold text-red-400/80 dark:bg-red-900/30">
                {site.tag}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-[0.6rem] text-muted-foreground/40">
            passed through
          </span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        <p className="text-[0.62rem] font-bold text-[var(--color-blaze-orange)] uppercase">
          Approved
        </p>
        <div className="space-y-2">
          {APPROVED.map((site) => (
            <div
              key={site.domain}
              className="flex items-start gap-3 rounded-xl border border-[var(--color-blaze-orange)]/20 bg-[var(--color-blaze-orange)]/6 px-3.5 py-3"
            >
              <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-blaze-orange)]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://www.google.com/s2/favicons?domain=${site.domain}&sz=32`}
                alt=""
                width={14}
                height={14}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-semibold text-foreground">
                    {site.domain}
                  </span>
                  <span className="shrink-0 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[0.55rem] font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    relevant
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[0.6rem] font-semibold text-[var(--color-blaze-orange)]">
                    {site.dr}
                  </span>
                  <span className="text-[0.6rem] text-muted-foreground/40">
                    ·
                  </span>
                  <span className="text-[0.6rem] font-semibold text-muted-foreground">
                    {site.traffic} traffic
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const FEED = [
  {
    source: "Niche Discovery",
    time: "2h ago",
    text: "4 new SaaS roundups found in your niche — added to your opportunity queue",
  },
  {
    source: "Fit Learning",
    time: "5h ago",
    text: "How-to angles earning +18% acceptance in your category — scoring updated",
  },
  {
    source: "Competitor Scan",
    time: "8h ago",
    text: "2 competitor placements detected — same sites now prioritized in your queue",
  },
]

function LearningAgentIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-[0_18px_60px_-32px_rgba(0,0,0,0.45)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-glow)]/70 to-transparent" />
      <div className="pointer-events-none absolute -top-12 -right-8 h-36 w-36 rounded-full bg-[var(--color-amber-flame)]/10 blur-3xl" />

      <div className="relative space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[0.62rem] font-bold text-muted-foreground uppercase">
            Today&apos;s strategy updates
          </p>
          <span className="text-[0.6rem] font-semibold text-[var(--color-blaze-orange)] uppercase">
            Mentiohunt
          </span>
        </div>

        <div className="space-y-2">
          {FEED.map((item) => (
            <div
              key={item.source}
              className="rounded-xl border border-border bg-background/70 p-3.5"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-blaze-orange)]" />
                <span className="text-[0.6rem] font-bold text-foreground/70">
                  {item.source}
                </span>
                <span className="text-[0.58rem] text-muted-foreground/40">
                  {item.time}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground/80">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const BENEFITS: Benefit[] = [
  {
    eyebrow: "No tool stack needed",
    title: "Replaces the whole function, not just the tools.",
    description:
      "Ahrefs, Instantly, Hunter — each one adds cost without removing the work. You still own prospecting, email writing, follow-ups, and tracking. Mentiohunt replaces the entire workflow up to the first reply: discovery, outreach, and follow-ups. You approve or reject — then take over once someone responds.",
    Illustration: ToolStackIllustration,
  },
  {
    eyebrow: "Transparent pricing",
    title: "Zero agency markup. Ever.",
    description:
      "Agencies charge 2–3× the link value and pocket the difference. Mentiohunt charges for the software — 0% commission, no hidden markup. You see every number: what the site asked, what we evaluated, what you pay. If you've paid an agency retainer and have nothing to show for it, this is built for you.",
    Illustration: AgencyIllustration,
  },
  {
    eyebrow: "Outreach, isolated",
    title: "Your inbox and domain never touch outreach volume.",
    description:
      "Outreach sends from Mentiohunt's warmed sending pool, never your domain or inbox. Bounces and spam complaints stay on our infrastructure, not your reputation. The moment a prospect replies, we forward the thread to your personal email — you take it from there.",
    Illustration: InboxSafetyIllustration,
  },
  {
    eyebrow: "Live, not stale",
    title: "Scraped in real time. Never pulled from an old database.",
    description:
      "Most tools sell you contact records synced months ago — half of them dead by the time you email them. Mentiohunt scrapes your best backlink opportunities live, every run, so traffic, DR, and contact details reflect the site as it is today, not as it was last year.",
    Illustration: LiveScrapingIllustration,
  },
  {
    eyebrow: "Quality filter",
    title: "Only real sites with real traffic.",
    description:
      "PBNs, generic directories, and low-DR farms are filtered before you ever see them. Every site in your queue is checked for real organic traffic, topical relevance, and an editorial track record — not just a DR number. Every opportunity is a genuine editorial placement, not a paid link farm dressed up to look like one.",
    Illustration: RealSitesIllustration,
  },
  {
    eyebrow: "Always improving",
    title: "Your queue gets sharper over time.",
    description:
      "As Mentiohunt learns what earns placements in your niche — which angles work, which site types respond, which fits convert — your opportunity queue improves automatically. Better fit scores, fewer irrelevant prospects, higher reply rates. No configuration required.",
    Illustration: LearningAgentIllustration,
  },
]

// ─── Row ──────────────────────────────────────────────────────────────────────

function BenefitRow({ benefit, flip }: { benefit: Benefit; flip: boolean }) {
  const { Illustration } = benefit
  return (
    <article className="grid gap-8 border-t border-border/70 py-10 first:border-t-0 first:pt-0 last:pb-0 lg:grid-cols-2 lg:items-center lg:gap-20">
      <div className={flip ? "lg:order-last" : ""}>
        <p className="mb-4 text-[0.7rem] font-bold text-[var(--color-blaze-orange)] uppercase">
          {benefit.eyebrow}
        </p>
        <h3 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {benefit.title}
        </h3>
        <p className="mt-3 max-w-lg text-base leading-7 text-muted-foreground">
          {benefit.description}
        </p>
      </div>

      <div className={flip ? "lg:order-first" : ""}>
        <Illustration />
      </div>
    </article>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function WhyMentiohunt() {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-24 -right-32 h-[420px] w-[420px] rounded-full bg-[var(--color-princeton-orange)]/7 blur-[100px]" />
        <div className="absolute bottom-20 -left-32 h-[360px] w-[360px] rounded-full bg-[var(--color-amber-flame)]/6 blur-[90px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
            Why Mentiohunt
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            Everything you need.{" "}
            <span className="text-red-500">Nothing you don&apos;t.</span>
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Agency minimums start at $1,000–5,000/mo. DIY link building takes
            10–15 hrs/week. Mentiohunt handles discovery and outreach through
            the first reply — you just approve what goes live and take over
            once a prospect responds.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-6xl">
          {BENEFITS.map((benefit, i) => (
            <BenefitRow
              key={benefit.title}
              benefit={benefit}
              flip={i % 2 === 1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
