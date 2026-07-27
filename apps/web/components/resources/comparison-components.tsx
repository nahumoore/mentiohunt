import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  IconArrowRight,
  IconArrowUp,
  IconBrandReddit,
  IconBrandX,
  IconCheck,
  IconStar,
  IconTargetArrow,
  IconTrendingUp,
} from "@tabler/icons-react"

/* ── QuickVerdict ─────────────────────────────────────────────────── */
// ifA and ifB: pipe-delimited strings  "item one|item two|item three"

interface QuickVerdictProps {
  toolA: string
  toolB: string
  ifA: string
  ifB: string
}

export function QuickVerdict({ toolA, toolB, ifA, ifB }: QuickVerdictProps) {
  const aItems = ifA.split("|")
  const bItems = ifB.split("|")

  const side = "border-b border-border bg-muted/40 p-6 sm:border-b-0 sm:border-r"

  return (
    <div className="my-8 grid grid-cols-1 overflow-hidden rounded-xl border border-border sm:grid-cols-2">
      <div className={side}>
        <p className="mb-0.5 text-[10px] font-bold uppercase text-muted-foreground">
          Choose
        </p>
        <p className="mb-4 font-semibold text-foreground">{toolA}</p>
        <ul className="space-y-2.5">
          {aItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
              <IconArrowRight className="mt-0.5 size-3.5 shrink-0 opacity-40" stroke={2.5} />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-muted/40 p-6">
        <p className="mb-0.5 text-[10px] font-bold uppercase text-muted-foreground">
          Choose
        </p>
        <p className="mb-4 font-semibold text-foreground">{toolB}</p>
        <ul className="space-y-2.5">
          {bItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
              <IconArrowRight className="mt-0.5 size-3.5 shrink-0 opacity-40" stroke={2.5} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ── ToolStrengths ────────────────────────────────────────────────── */
// items: pipe-delimited string  "item one|item two|item three"

interface ToolStrengthsProps {
  tool: string
  items: string
}

export function ToolStrengths({ tool, items }: ToolStrengthsProps) {
  const list = items.split("|")

  return (
    <div className="my-6 rounded-xl border border-border bg-muted/30 p-5">
      <p className="mb-3 text-[10px] font-bold uppercase text-muted-foreground">
        {tool}
      </p>
      <ul className="space-y-2">
        {list.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
            <IconCheck
              className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
              stroke={2.5}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── WhenToChoose ─────────────────────────────────────────────────── */
// items: pipe-delimited string  "item one|item two|item three"

interface WhenToChooseProps {
  tool: string
  items: string
  primary?: boolean
}

export function WhenToChoose({ tool, items }: WhenToChooseProps) {
  const list = items.split("|")

  return (
    <div className="my-6 rounded-xl border border-border bg-muted/30 p-5">
      <p className="mb-3 text-[10px] font-bold uppercase text-muted-foreground">
        Choose {tool} if:
      </p>
      <ul className="space-y-2.5">
        {list.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
            <IconCheck className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" stroke={2.5} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── PricingNote ──────────────────────────────────────────────────── */
// plans: pipe-delimited "Name:Price|Name:Price"  e.g. "Starter:$149/mo|Growth:$399/mo"

interface PricingNoteProps {
  tool: string
  plans: string
  note?: string
}

export function PricingNote({ tool, plans, note }: PricingNoteProps) {
  const planList = plans.split("|").map((p) => {
    const colonIdx = p.indexOf(":")
    return { name: p.slice(0, colonIdx), price: p.slice(colonIdx + 1) }
  })

  return (
    <div className="my-6 rounded-xl border border-border bg-muted/30 p-5">
      <p className="mb-3 text-[10px] font-bold uppercase text-muted-foreground">
        {tool} — plans
      </p>
      <div className="flex flex-wrap gap-2">
        {planList.map((plan, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-background px-3 py-2"
          >
            <p className="text-[10px] uppercase text-muted-foreground">
              {plan.name}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {plan.price}
            </p>
          </div>
        ))}
      </div>
      {note && <p className="mt-3 text-xs text-muted-foreground">{note}</p>}
    </div>
  )
}

/* ── UserOpinion ──────────────────────────────────────────────────── */
// source: "reddit" | "g2" | "x" | "trustpilot" | "producthunt"
// upvotes: optional number string e.g. "234"

interface UserOpinionProps {
  name: string
  role?: string
  source: string
  quote: string
  upvotes?: string
}

function SourceBadge({ source }: { source: string }) {
  const s = source.toLowerCase()
  if (s === "reddit")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
        <IconBrandReddit size={11} stroke={2} className="text-orange-500" />
        Reddit
      </span>
    )
  if (s === "x" || s === "twitter")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
        <IconBrandX size={11} stroke={2} />X
      </span>
    )
  if (s === "g2")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
        <IconStar size={11} stroke={2} className="text-yellow-500" />
        G2
      </span>
    )
  if (s === "producthunt")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
        <IconTargetArrow size={11} stroke={2} className="text-orange-500" />
        Product Hunt
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
      {source}
    </span>
  )
}

export function UserOpinion({ name, role, source, quote, upvotes }: UserOpinionProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="relative my-6 overflow-hidden rounded-xl border border-border bg-muted/20 px-6 py-5">
      {/* Decorative quote mark */}
      <span className="pointer-events-none absolute -top-3 -left-1 select-none font-heading text-[8rem] leading-none font-bold text-foreground/[0.04]">
        "
      </span>

      {/* Top row: source + upvotes */}
      <div className="relative mb-4 flex items-center justify-between">
        <SourceBadge source={source} />
        {upvotes && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <IconArrowUp size={11} stroke={2} />
            {upvotes}
          </span>
        )}
      </div>

      {/* Quote */}
      <p className="relative text-sm leading-7 text-foreground/85 italic">
        "{quote}"
      </p>

      {/* Author */}
      <div className="relative mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-blaze-orange)]/15 text-[11px] font-bold text-(--color-princeton-orange)">
          {initials}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-foreground">{name}</span>
          {role && (
            <span className="text-[10px] text-muted-foreground">{role}</span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── ScoreCard ────────────────────────────────────────────────────── */
// scores: pipe-delimited "Dimension:scoreA:scoreB|..."
// scores are 1-10

interface ScoreCardProps {
  toolA: string
  toolB: string
  scores: string
}

export function ScoreCard({ toolA, toolB, scores }: ScoreCardProps) {
  const rows = scores.split("|").map((s) => {
    const parts = s.split(":")
    return {
      label: parts[0] ?? "",
      a: Math.min(10, Math.max(0, Number(parts[1]) || 0)),
      b: Math.min(10, Math.max(0, Number(parts[2]) || 0)),
    }
  })

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-border">
      {/* Header */}
      <div className="grid grid-cols-[minmax(100px,160px)_1fr_1fr] border-b border-border bg-muted/40 px-5 py-3 text-[10px] font-bold uppercase">
          <span className="text-muted-foreground">Category</span>
        <span className="px-3 text-muted-foreground">{toolA}</span>
        <span className="px-3 text-muted-foreground">{toolB}</span>
      </div>

      {/* Rows */}
      {rows.map((row, i) => {
        const aWins = row.a > row.b
        const bWins = row.b > row.a
        return (
          <div
            key={i}
            className={cn(
              "grid grid-cols-[minmax(100px,160px)_1fr_1fr] items-center px-5 py-4",
              i < rows.length - 1 && "border-b border-border/60"
            )}
          >
            <span className="text-xs font-medium text-muted-foreground">{row.label}</span>

            {/* Score A */}
            <div className="flex items-center gap-3 px-3">
              <span
                className={cn(
                  "w-8 shrink-0 text-sm font-semibold tabular-nums",
                  aWins ? "text-(--color-princeton-orange)" : "text-muted-foreground"
                )}
              >
                {row.a}/10
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-border">
                <div
                  className={cn(
                    "h-full rounded-full",
                    aWins ? "bg-(--color-princeton-orange)" : "bg-muted-foreground/30"
                  )}
                  style={{ width: `${row.a * 10}%` }}
                />
              </div>
            </div>

            {/* Score B */}
            <div className="flex items-center gap-3 px-3">
              <span
                className={cn(
                  "w-8 shrink-0 text-sm font-semibold tabular-nums",
                  bWins ? "text-(--color-princeton-orange)" : "text-muted-foreground"
                )}
              >
                {row.b}/10
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-border">
                <div
                  className={cn(
                    "h-full rounded-full",
                    bWins ? "bg-(--color-princeton-orange)" : "bg-muted-foreground/30"
                  )}
                  style={{ width: `${row.b * 10}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── PricingComparison ────────────────────────────────────────────── */
// plansA / plansB: pipe-delimited "Name:Price:Note|..."  Note is optional

interface PricingComparisonProps {
  toolA: string
  toolB: string
  plansA: string
  plansB: string
  noteA?: string
  noteB?: string
}

function parsePlans(raw: string) {
  return raw.split("|").map((p) => {
    const parts = p.split(":")
    return {
      name: parts[0] ?? "",
      price: parts[1] ?? "",
      note: parts[2] ?? "",
    }
  })
}

export function PricingComparison({ toolA, toolB, plansA, plansB, noteA, noteB }: PricingComparisonProps) {
  const listA = parsePlans(plansA)
  const listB = parsePlans(plansB)

  return (
    <div className="my-6 grid gap-4 sm:grid-cols-2">
      {/* Tool A */}
      <div className="rounded-xl border border-[var(--color-blaze-orange)]/25 bg-muted/20 p-5">
        <p
          className="mb-3 text-[10px] font-bold uppercase"
          style={{ color: "var(--pumpkin-spice)" }}
        >
          {toolA}
        </p>
        <div className="flex flex-wrap gap-2">
          {listA.map((plan, i) => (
            <div key={i} className="rounded-lg border border-border bg-background px-3 py-2">
              <p className="text-[10px] uppercase text-muted-foreground">{plan.name}</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{plan.price}</p>
              {plan.note && <p className="mt-0.5 text-[10px] text-muted-foreground">{plan.note}</p>}
            </div>
          ))}
        </div>
        {noteA && <p className="mt-3 text-xs text-muted-foreground">{noteA}</p>}
      </div>

      {/* Tool B */}
      <div className="rounded-xl border border-border bg-muted/20 p-5">
        <p className="mb-3 text-[10px] font-bold uppercase text-muted-foreground">
          {toolB}
        </p>
        <div className="flex flex-wrap gap-2">
          {listB.map((plan, i) => (
            <div key={i} className="rounded-lg border border-border bg-background px-3 py-2">
              <p className="text-[10px] uppercase text-muted-foreground">{plan.name}</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{plan.price}</p>
              {plan.note && <p className="mt-0.5 text-[10px] text-muted-foreground">{plan.note}</p>}
            </div>
          ))}
        </div>
        {noteB && <p className="mt-3 text-xs text-muted-foreground">{noteB}</p>}
      </div>
    </div>
  )
}

/* ── StatGrid ─────────────────────────────────────────────────────── */
// stats: pipe-delimited "value:label:source?"  source may be a bare label or a full URL
// e.g. "15–22%:Guest post reply rate:https://reachinbox.ai/blog/guest-posting-outreach/"
// title: optional eyebrow above the grid

interface StatGridProps {
  title?: string
  stats: string
}

function parseSource(source: string): { text: string; href?: string } {
  if (!/^https?:\/\//.test(source)) return { text: source }

  try {
    const hostname = new URL(source).hostname.replace(/^www\./, "")
    return { text: hostname, href: source }
  } catch {
    return { text: source }
  }
}

export function StatGrid({ title, stats }: StatGridProps) {
  const items = stats.split("|").map((s) => {
    const parts = s.split(":")
    return {
      value: parts[0] ?? "",
      label: parts[1] ?? "",
      source: parts.length > 2 ? parts.slice(2).join(":") : "",
    }
  })

  const cols =
    items.length >= 4
      ? "sm:grid-cols-4"
      : items.length === 3
        ? "sm:grid-cols-3"
        : "sm:grid-cols-2"

  return (
    <div className="my-8 overflow-hidden rounded-xl border border-border">
      {title && (
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-5 py-3">
          <IconTrendingUp
            className="size-3.5 shrink-0 text-(--color-princeton-orange)"
            stroke={2.5}
          />
          <p className="text-[10px] font-bold uppercase text-muted-foreground">
            {title}
          </p>
        </div>
      )}
      <div className={cn("grid grid-cols-1 divide-y divide-border sm:divide-x sm:divide-y-0", cols)}>
        {items.map((item, i) => {
          const source = item.source ? parseSource(item.source) : null

          return (
            <div key={i} className="flex flex-col gap-1 p-5">
              <span className="font-heading text-3xl font-semibold tracking-tight text-(--color-princeton-orange) tabular-nums">
                {item.value}
              </span>
              <span className="text-sm leading-snug text-foreground/85">
                {item.label}
              </span>
              {source &&
                (source.href ? (
                  <Link
                    href={source.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-[10px] text-muted-foreground underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-(--color-princeton-orange)"
                  >
                    {source.text}
                  </Link>
                ) : (
                  <span className="mt-1 text-[10px] text-muted-foreground">
                    {source.text}
                  </span>
                ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
