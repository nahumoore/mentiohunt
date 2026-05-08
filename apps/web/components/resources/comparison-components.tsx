import { cn } from "@/lib/utils"
import { IconArrowRight, IconCheck } from "@tabler/icons-react"

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

  return (
    <div className="my-8 grid grid-cols-1 overflow-hidden rounded-xl border border-border sm:grid-cols-2">
      <div className="border-b border-border bg-muted/40 p-6 sm:border-b-0 sm:border-r">
        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Choose
        </p>
        <p className="mb-4 font-semibold text-foreground">{toolA}</p>
        <ul className="space-y-2.5">
          {aItems.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"
            >
              <IconArrowRight
                className="mt-0.5 size-3.5 shrink-0 opacity-40"
                stroke={2.5}
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div
        className="p-6"
        style={{
          background:
            "color-mix(in oklab, var(--background) 92%, var(--pumpkin-spice) 8%)",
        }}
      >
        <p
          className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: "var(--pumpkin-spice)" }}
        >
          Choose
        </p>
        <p className="mb-4 font-semibold text-foreground">{toolB}</p>
        <ul className="space-y-2.5">
          {bItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
              <IconCheck
                className="mt-0.5 size-3.5 shrink-0"
                stroke={2.5}
                style={{ color: "var(--pumpkin-spice)" }}
              />
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
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
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

export function WhenToChoose({ tool, items, primary }: WhenToChooseProps) {
  const list = items.split("|")

  return (
    <div
      className={cn(
        "my-6 rounded-xl border p-5",
        primary ? "border-border" : "border-border bg-muted/30"
      )}
      style={
        primary
          ? {
              background:
                "color-mix(in oklab, var(--background) 92%, var(--pumpkin-spice) 8%)",
              borderLeftWidth: "3px",
              borderLeftColor: "var(--pumpkin-spice)",
            }
          : undefined
      }
    >
      <p
        className={cn(
          "mb-3 text-[10px] font-bold uppercase tracking-[0.18em]",
          !primary && "text-muted-foreground"
        )}
        style={primary ? { color: "var(--pumpkin-spice)" } : undefined}
      >
        Choose {tool} if:
      </p>
      <ul className="space-y-2.5">
        {list.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
            <IconCheck
              className={cn(
                "mt-0.5 size-3.5 shrink-0",
                !primary && "text-muted-foreground"
              )}
              stroke={2.5}
              style={primary ? { color: "var(--pumpkin-spice)" } : undefined}
            />
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
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {tool} — plans
      </p>
      <div className="flex flex-wrap gap-2">
        {planList.map((plan, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-background px-3 py-2"
          >
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
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
