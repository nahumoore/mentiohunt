// Chart colour tokens, scoped to the statistics page rather than promoted to
// packages/ui/src/styles/globals.css — this is still a design pass with three
// competing variants. If one variant is picked, move these into the design
// system proper.
//
// Every value was checked with the dataviz palette validator:
//   - the sequential ramp is one hue, monotonic in lightness (light → dark in
//     light mode, dim → bright in dark mode), so magnitude reads without a legend
//   - the status trio passes the lightness band, chroma floor, colour-blind
//     separation and contrast checks in BOTH modes, in the order good → info →
//     bad (keeping green and red non-adjacent in stacked bars)
//
// Charts reference these as `var(--lbs-*)` instead of hardcoded hex so dark mode
// needs no JS, and the PNG exporter resolves them via getComputedStyle.

export const CHART_SCOPE = "lbs-charts"

/** Used for on-page SVG text — picks up the site's Inter via next/font. */
export const CHART_FONT =
  "var(--font-ui), Inter, 'Segoe UI', system-ui, sans-serif"

/**
 * Used for exported SVG/PNG text. next/font generates a hashed family name that
 * does not exist inside the isolated SVG rendering context a canvas uses, so the
 * exporter rewrites every font-family to this literal stack.
 */
export const EXPORT_FONT =
  "Inter, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif"

const SEQ_STEPS = 5

/** Maps a bucket index onto the 5-step sequential ramp. */
export function seqVar(index: number, total: number): string {
  if (total <= 1) return "var(--lbs-seq-4)"
  const step = (SEQ_STEPS - 1) / (total - 1)
  const rampIndex = Math.min(SEQ_STEPS - 1, Math.round(index * step))
  return `var(--lbs-seq-${rampIndex + 1})`
}

export const STATUS_VAR = {
  good: "var(--lbs-good)",
  info: "var(--lbs-info)",
  bad: "var(--lbs-bad)",
} as const

export type StatusTone = keyof typeof STATUS_VAR

const CSS = `
.${CHART_SCOPE} {
  --lbs-surface: #ffffff;
  --lbs-track: #f1f1f0;
  --lbs-grid: #e7e7e7;
  --lbs-ink: #1f1f1f;
  --lbs-ink-2: #6f6f6f;
  --lbs-ink-3: #9c9c9c;
  --lbs-accent: #ff5400;
  --lbs-seq-1: #ffc97a;
  --lbs-seq-2: #ffb000;
  --lbs-seq-3: #ff8a00;
  --lbs-seq-4: #f25c00;
  --lbs-seq-5: #b83b00;
  --lbs-good: #059669;
  --lbs-info: #3b82f6;
  --lbs-bad: #e11d48;
}
.dark .${CHART_SCOPE} {
  --lbs-surface: #242424;
  --lbs-track: #333333;
  --lbs-grid: #3a3a3a;
  --lbs-ink: #f5f5f5;
  --lbs-ink-2: #a0a0a0;
  --lbs-ink-3: #787878;
  --lbs-accent: #ff8a2b;
  --lbs-seq-1: #8a4a12;
  --lbs-seq-2: #c06a00;
  --lbs-seq-3: #ff8a00;
  --lbs-seq-4: #ffa92e;
  --lbs-seq-5: #ffc978;
  --lbs-good: #0d9e6e;
  --lbs-info: #4e92ea;
  --lbs-bad: #ee5573;
}
`

export function ChartTokens() {
  return <style>{CSS}</style>
}
