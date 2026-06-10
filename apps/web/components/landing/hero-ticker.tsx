"use client"

import { IconLink } from "@tabler/icons-react"
import { motion } from "framer-motion"

import { IconBrandQuora } from "@/components/custom-icons/brand-quora"
import { IconBrandRedditNew } from "@/components/custom-icons/brand-reddit-new"

const ease = [0.21, 0.47, 0.32, 0.98] as const

type CommunityItem = {
  kind: "community"
  platform: "reddit" | "quora"
  quote: string
  source: string
  time: string
  score: number
}

type BacklinkItem = {
  kind: "backlink"
  domain: string
  pageTitle: string
  pageType: string
  da: number
  time: string
  score: number
}

type OpportunityItem = CommunityItem | BacklinkItem

const opportunities: OpportunityItem[] = [
  {
    kind: "community",
    platform: "reddit",
    quote: "What's the best tool for founder outreach right now?",
    source: "r/SaaS",
    time: "2m ago",
    score: 92,
  },
  {
    kind: "backlink",
    domain: "growthstack.tools",
    pageTitle: "Best outreach & distribution tools for founders",
    pageType: "Resource page",
    da: 41,
    time: "4m ago",
    score: 94,
  },
  {
    kind: "community",
    platform: "quora",
    quote: "What are the best backlink building tools for small SaaS companies?",
    source: "Quora",
    time: "7m ago",
    score: 87,
  },
  {
    kind: "backlink",
    domain: "alternativeto.net",
    pageTitle: "Alternatives to manual link prospecting",
    pageType: "Alternative page",
    da: 79,
    time: "11m ago",
    score: 91,
  },
  {
    kind: "community",
    platform: "reddit",
    quote: "Anyone using automated link building for their SaaS?",
    source: "r/Entrepreneur",
    time: "14m ago",
    score: 84,
  },
  {
    kind: "backlink",
    domain: "failory.com",
    pageTitle: "Top growth tools for bootstrapped startups in 2025",
    pageType: "Best-of roundup",
    da: 58,
    time: "18m ago",
    score: 88,
  },
  {
    kind: "community",
    platform: "quora",
    quote: "How do you get the first credible mentions for a new B2B tool?",
    source: "Quora",
    time: "22m ago",
    score: 91,
  },
  {
    kind: "backlink",
    domain: "theresanaiforthat.com",
    pageTitle: "AI-powered marketing & distribution tools",
    pageType: "AI directory",
    da: 63,
    time: "26m ago",
    score: 96,
  },
  {
    kind: "community",
    platform: "reddit",
    quote: "Cold email vs community mentions — what actually converts better?",
    source: "r/startups",
    time: "31m ago",
    score: 89,
  },
  {
    kind: "backlink",
    domain: "stackshare.io",
    pageTitle: "Mentiohunt vs. manual link building — comparison",
    pageType: "Comparison page",
    da: 71,
    time: "35m ago",
    score: 85,
  },
]

const platformMeta: Record<
  CommunityItem["platform"],
  { label: string; renderIcon: (cls: string) => React.ReactNode }
> = {
  reddit: {
    label: "Reddit",
    renderIcon: (cls) => <IconBrandRedditNew className={cls} size={20} />,
  },
  quora: {
    label: "Quora",
    renderIcon: (cls) => (
      <IconBrandQuora className={`${cls} rounded-sm`} style={{ width: 20, height: 20 }} />
    ),
  },
}

export function HeroTicker() {
  const doubled = [...opportunities, ...opportunities]

  return (
    <motion.div
      className="container mx-auto mt-8 px-4 pb-20 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.44, ease }}
    >
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent"
          aria-hidden="true"
        />

        <div
          className="flex w-max gap-4 py-2"
          style={{ animation: "hero-ticker 44s linear infinite" }}
        >
          {doubled.map((item, i) => (
            <OpportunityCard key={i} item={item} />
          ))}
        </div>

        <style>{`
          @keyframes hero-ticker {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    </motion.div>
  )
}

function OpportunityCard({ item }: { item: OpportunityItem }) {
  const isCommunity = item.kind === "community"
  const meta = isCommunity ? platformMeta[item.platform] : null

  return (
    <div className="flex h-[158px] w-[300px] shrink-0 flex-col rounded-xl border border-border/70 bg-card px-4 py-3.5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="h-5 w-5 shrink-0">
            {isCommunity ? (
              meta!.renderIcon("h-full w-full")
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded bg-muted">
                <IconLink size={11} className="text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[0.58rem] font-bold text-foreground uppercase">
              {isCommunity ? meta!.label : item.domain}
            </p>
            <p className="truncate text-[0.56rem] text-muted-foreground/50">
              {isCommunity
                ? `${item.source} · ${item.time}`
                : `${item.pageType} · ${item.time}`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="text-base font-black tabular-nums text-[var(--color-blaze-orange)]">
            {item.score}
          </span>
          <span className="text-[0.44rem] font-bold text-muted-foreground/40 uppercase">
            fit
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 items-center py-2">
        <p className="line-clamp-2 text-[0.8rem] leading-5 text-foreground/75">
          {isCommunity ? <>&ldquo;{item.quote}&rdquo;</> : item.pageTitle}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
        <span
          className={`text-[0.56rem] font-bold uppercase ${
            isCommunity
              ? "text-sky-500"
              : "text-[var(--color-blaze-orange)]"
          }`}
        >
          {isCommunity ? "Social mention" : "Backlink opportunity"}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[0.56rem] font-bold ${
            isCommunity
              ? "bg-[var(--color-blaze-orange)]/10 text-[var(--color-blaze-orange)]"
              : "bg-emerald-500/10 text-emerald-600"
          }`}
        >
          {isCommunity ? "Reply drafted" : "Email drafted"}
        </span>
      </div>
    </div>
  )
}
