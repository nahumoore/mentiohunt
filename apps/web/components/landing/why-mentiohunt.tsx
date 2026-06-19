import { IconCheck, IconX } from "@tabler/icons-react"
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
        <p className="mb-3 text-[0.62rem] font-bold uppercase text-muted-foreground">
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
            <span className="flex-1 text-sm font-medium text-foreground/70">{tool.name}</span>
            <span className="text-sm font-semibold text-muted-foreground/60">{tool.price}</span>
          </div>
        ))}

        <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3.5 py-2.5">
          <div className="flex h-4 w-4 shrink-0 items-center justify-center">
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-muted-foreground/50">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.25" />
              <path d="M8 4.5v3.75l2.5 1.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="flex-1 text-sm font-medium text-foreground/70">Your time</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/40">~10h/mo</span>
            <span className="text-sm font-semibold text-muted-foreground/60">≈$500/mo</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-3.5 py-2">
          <span className="text-xs text-muted-foreground/50">Real total</span>
          <span className="text-sm font-bold text-muted-foreground/50">~$725/mo</span>
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
          <span className="flex-1 text-sm font-semibold text-foreground">Mentiohunt</span>
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
        <p className="mb-3 text-[0.62rem] font-bold uppercase text-muted-foreground">
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
              Hi, we&apos;d like to feature a client on your blog. What&apos;s your placement rate?
            </p>
          </div>
        </div>

        {/* Site → Agency */}
        <div className="flex items-start justify-end gap-2.5">
          <div className="max-w-[80%] rounded-2xl rounded-tr-sm border border-border bg-background/70 px-3.5 py-2.5 text-right">
            <p className="text-[0.6rem] font-bold text-emerald-500/80">Site Owner</p>
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
          <span className="text-[0.58rem] text-muted-foreground/40">agency reports back</span>
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
        <p className="text-[0.62rem] font-bold uppercase text-muted-foreground">Filtered out</p>
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
          <span className="text-[0.6rem] text-muted-foreground/40">passed through</span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        <p className="text-[0.62rem] font-bold uppercase text-[var(--color-blaze-orange)]">
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
                  <span className="text-[0.6rem] text-muted-foreground/40">·</span>
                  <span className="text-[0.6rem] font-semibold text-muted-foreground">{site.traffic} traffic</span>
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
    source: "Reddit",
    domain: "reddit.com",
    time: "2h ago",
    text: "Anchor text diversity thread — 3 new patterns extracted and applied",
  },
  {
    source: "X",
    domain: "x.com",
    time: "4h ago",
    text: "Outreach template going viral — reply rate benchmark updated to 34%",
  },
  {
    source: "LinkedIn",
    domain: "linkedin.com",
    time: "6h ago",
    text: "Agency founder reveals negotiation framework — added to your agent",
  },
]

function LearningAgentIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-[0_18px_60px_-32px_rgba(0,0,0,0.45)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-glow)]/70 to-transparent" />
      <div className="pointer-events-none absolute -top-12 -right-8 h-36 w-36 rounded-full bg-[var(--color-amber-flame)]/10 blur-3xl" />

      <div className="relative space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[0.62rem] font-bold uppercase text-muted-foreground">
            Today&apos;s strategy updates
          </p>
          <div className="flex items-center gap-1.5">
            {FEED.map((item) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={item.domain}
                src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=32`}
                alt=""
                width={14}
                height={14}
                className="h-3.5 w-3.5 rounded-sm opacity-60"
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {FEED.map((item) => (
            <div
              key={item.source}
              className="rounded-xl border border-border bg-background/70 p-3.5"
            >
              <div className="mb-1.5 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=32`}
                  alt=""
                  width={14}
                  height={14}
                  className="h-3.5 w-3.5 shrink-0 rounded-sm"
                />
                <span className="text-[0.6rem] font-bold text-foreground/70">{item.source}</span>
                <span className="text-[0.58rem] text-muted-foreground/40">{item.time}</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground/80">{item.text}</p>
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
    eyebrow: "One price",
    title: "Replace your whole tool stack.",
    description:
      "Ahrefs, Instantly, Hunter — combined you're paying $300+/mo for tools that still leave the hard work to you. Mentiohunt does all of it for $49/mo.",
    Illustration: ToolStackIllustration,
  },
  {
    eyebrow: "Transparent pricing",
    title: "Zero agency markup. Ever.",
    description:
      "Agencies charge 2–3× the link value and pocket the difference. Mentiohunt charges for the software — 0% commission, no hidden markup. You see every number: what the site asked, what we evaluated, what you pay.",
    Illustration: AgencyIllustration,
  },
  {
    eyebrow: "Quality filter",
    title: "Only real sites with real traffic.",
    description:
      "PBNs, generic directories, and low-DR farms are filtered before you ever see them. Every opportunity is a genuine editorial placement.",
    Illustration: RealSitesIllustration,
  },
  {
    eyebrow: "Always learning",
    title: "An agent that gets smarter daily.",
    description:
      "Monitors Reddit, X, and LinkedIn every day for new backlink strategies and negotiation tactics — and applies them to your project automatically.",
    Illustration: LearningAgentIllustration,
  },
]

// ─── Row ──────────────────────────────────────────────────────────────────────

function BenefitRow({ benefit, flip }: { benefit: Benefit; flip: boolean }) {
  const { Illustration } = benefit
  return (
    <article className="grid gap-8 border-t border-border/70 py-10 first:border-t-0 first:pt-0 last:pb-0 lg:grid-cols-2 lg:items-center lg:gap-20">
      <div className={flip ? "lg:order-last" : ""}>
        <p className="mb-4 text-[0.7rem] font-bold uppercase text-[var(--color-blaze-orange)]">
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
        <div className="absolute -left-32 bottom-20 h-[360px] w-[360px] rounded-full bg-[var(--color-amber-flame)]/6 blur-[90px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-(--color-blaze-orange)">
            Why Mentiohunt
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            Everything you need.{" "}
            <span className="text-muted-foreground/40">Nothing you don&apos;t.</span>
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Skip the agency fees, the tool subscriptions, and the guesswork. One system, one price.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-6xl">
          {BENEFITS.map((benefit, i) => (
            <BenefitRow key={benefit.title} benefit={benefit} flip={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  )
}
