import type { ReactNode } from "react"

function WebGraph() {
  const nodes: [number, number][] = [
    [20, 18], [65, 10], [108, 22],
    [8, 52], [48, 48], [88, 42], [115, 58],
    [28, 82], [72, 78],
  ]
  const edges: [number, number][] = [
    [0, 1], [1, 2], [0, 4], [1, 4], [2, 5],
    [3, 4], [4, 5], [5, 6], [4, 7], [5, 8], [7, 8],
  ]
  return (
    <svg viewBox="0 0 130 95" className="h-14 w-auto" fill="none">
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a]![0]}
          y1={nodes[a]![1]}
          x2={nodes[b]![0]}
          y2={nodes[b]![1]}
          stroke="currentColor"
          strokeWidth="1"
          className="text-muted-foreground/30"
        />
      ))}
      {nodes.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={i === 1 || i === 4 ? 4.5 : 3}
          className={
            i === 1 || i === 4
              ? "fill-muted-foreground/70"
              : "fill-muted-foreground/40"
          }
        />
      ))}
    </svg>
  )
}

function AgentPulse() {
  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      <span
        className="absolute h-14 w-14 animate-ping rounded-full bg-primary/20"
        style={{ animationDuration: "2s" }}
      />
      <span className="absolute h-9 w-9 rounded-full bg-primary/20" />
      <span className="relative h-6 w-6 rounded-full bg-primary" />
    </div>
  )
}

function RankedBars() {
  const rows = [
    { label: "Listicle", score: 92, pct: "100%", hi: true },
    { label: "Alt page", score: 87, pct: "78%", hi: false },
    { label: "Directory", score: 78, pct: "62%", hi: false },
  ]
  return (
    <div className="w-full space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${row.hi ? "bg-primary" : "bg-muted-foreground/25"}`}
              style={{ width: row.pct }}
            />
            <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-medium text-foreground/60">
              {row.label}
            </span>
          </div>
          <span
            className={`w-6 shrink-0 text-right text-[11px] font-semibold tabular-nums ${row.hi ? "text-primary" : "text-muted-foreground"}`}
          >
            {row.score}
          </span>
        </div>
      ))}
    </div>
  )
}

function FlowArrow() {
  return (
    <div className="flex shrink-0 items-center justify-center self-center sm:mt-11 sm:self-start">
      <svg
        viewBox="0 0 20 20"
        className="h-4 w-4 rotate-90 text-muted-foreground/40 sm:rotate-0"
        fill="none"
      >
        <path
          d="M4 10h12M12 6l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

function Step({
  number,
  label,
  children,
}: {
  number: string
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-3">
      <div className="flex h-28 w-full items-center justify-center rounded-2xl border border-border bg-background px-3">
        {children}
      </div>
      <div className="text-center">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          {number}
        </p>
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
    </div>
  )
}

export function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className="absolute inset-x-10 top-8 -z-10 h-36 rounded-full bg-primary/10 blur-3xl" />
      <div className="overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.22)] sm:p-8">
        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:gap-3">
          <Step number="01" label="Scan the web">
            <WebGraph />
          </Step>
          <FlowArrow />
          <Step number="02" label="Rank & reason">
            <AgentPulse />
          </Step>
          <FlowArrow />
          <Step number="03" label="Daily queue">
            <RankedBars />
          </Step>
        </div>
      </div>
    </div>
  )
}
