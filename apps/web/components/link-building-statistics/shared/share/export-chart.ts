// Turns any on-page chart into a standalone, self-explanatory image.
//
// Every chart on this page is a single self-contained <svg> — labels, values and
// axes are SVG text, not HTML around the SVG — which is what makes this possible
// without a rendering library. The exporter clones that node, wraps it in a
// branded card (title, subtitle, source line, and the page URL), and rasterises
// it via canvas.
//
// Two details matter for correctness:
//   1. Charts colour themselves with `var(--lbs-*)` tokens that live on an
//      ancestor. A detached SVG has no ancestor, so the resolved values are
//      copied onto the exported root as inline custom properties. That also means
//      the export automatically matches the reader's light/dark theme.
//   2. next/font generates a hashed family name that does not exist inside the
//      isolated SVG document a canvas rasterises, so font-family is rewritten to
//      a literal system stack.

import { EXPORT_FONT } from "../chart-tokens"

const TOKEN_NAMES = [
  "--lbs-surface",
  "--lbs-track",
  "--lbs-grid",
  "--lbs-ink",
  "--lbs-ink-2",
  "--lbs-ink-3",
  "--lbs-accent",
  "--lbs-seq-1",
  "--lbs-seq-2",
  "--lbs-seq-3",
  "--lbs-seq-4",
  "--lbs-seq-5",
  "--lbs-good",
  "--lbs-info",
  "--lbs-bad",
] as const

const CARD_W = 1200
const PAD = 64
const CONTENT_W = CARD_W - PAD * 2

export interface ChartExportMeta {
  /** Chart headline, e.g. "Reply rate by Domain Rating tier". */
  title: string
  /** One line of context under the title. Optional. */
  subtitle?: string
  /** Sample-size / date-range line shown bottom right. */
  sourceLine: string
  /** Canonical URL printed on the card — the reason a screenshot still credits us. */
  url: string
  /** Used for the downloaded filename. */
  slug: string
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Greedy word wrap using an average-glyph-width estimate — good enough for a card. */
function wrapText(text: string, fontSize: number, maxWidth: number): string[] {
  const maxChars = Math.max(12, Math.floor(maxWidth / (fontSize * 0.52)))
  const lines: string[] = []
  let current = ""

  for (const word of text.split(/\s+/)) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines
}

function readTokens(node: Element): Record<string, string> {
  const computed = window.getComputedStyle(node)
  const tokens: Record<string, string> = {}
  for (const name of TOKEN_NAMES) {
    tokens[name] = computed.getPropertyValue(name).trim() || "#000000"
  }
  return tokens
}

const COLOUR_ATTRS = ["fill", "stroke", "stop-color"] as const

/**
 * Replaces `var(--lbs-*)` in colour attributes with the value the page resolved
 * them to. Presentation attributes referencing custom properties are not reliably
 * resolved once the SVG is detached and rasterised, so the export bakes them in.
 */
function inlineTokenColours(root: Element, tokens: Record<string, string>) {
  const elements = [root, ...Array.from(root.querySelectorAll("*"))]

  for (const element of elements) {
    for (const attribute of COLOUR_ATTRS) {
      const value = element.getAttribute(attribute)
      if (!value || !value.includes("var(")) continue

      const resolved = value.replace(
        /var\((--[a-z0-9-]+)\)/gi,
        (match, name: string) => tokens[name] ?? match
      )
      element.setAttribute(attribute, resolved)
    }
  }
}

/**
 * Clones the chart, strips the invisible hover hit-targets, and gives it explicit
 * pixel dimensions so it can be nested inside the card.
 */
function prepareChartClone(
  svg: SVGSVGElement,
  width: number,
  tokens: Record<string, string>
) {
  const viewBox = (svg.getAttribute("viewBox") ?? "0 0 700 300")
    .split(/\s+/)
    .map(Number)
  const vbWidth = viewBox[2] || 700
  const vbHeight = viewBox[3] || 300
  const height = (width / vbWidth) * vbHeight

  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.querySelectorAll('[fill="transparent"]').forEach((el) => el.remove())
  clone.removeAttribute("style")
  clone.setAttribute("width", String(width))
  clone.setAttribute("height", String(height))
  clone.setAttribute("font-family", EXPORT_FONT)
  inlineTokenColours(clone, tokens)

  return { clone, height }
}

/** Builds the full branded card as an SVG source string. */
export function buildChartCardSvg(
  svg: SVGSVGElement,
  meta: ChartExportMeta
): { svg: string; width: number; height: number } {
  const tokens = readTokens(svg)
  const { clone, height: chartH } = prepareChartClone(svg, CONTENT_W, tokens)

  const titleLines = wrapText(meta.title, 34, CONTENT_W)
  const subtitleLines = meta.subtitle
    ? wrapText(meta.subtitle, 17, CONTENT_W).slice(0, 2)
    : []

  let y = 78
  const eyebrowY = y
  y += 40
  const titleTop = y
  y += titleLines.length * 42
  const subtitleTop = y + 4
  y += subtitleLines.length * 26 + (subtitleLines.length ? 10 : 0)
  const chartTop = y + 18
  y = chartTop + chartH
  const ruleY = y + 34
  const footerBaseline = ruleY + 32
  const cardH = Math.round(footerBaseline + 34)

  const chartMarkup = new XMLSerializer().serializeToString(clone)

  const inlineTokens = TOKEN_NAMES.map((name) => `${name}:${tokens[name]}`).join(
    ";"
  )

  const body = `
  <rect x="0" y="0" width="${CARD_W}" height="${cardH}" fill="${tokens["--lbs-surface"]}"/>
  <rect x="0" y="0" width="${CARD_W}" height="6" fill="${tokens["--lbs-accent"]}"/>
  <text x="${PAD}" y="${eyebrowY}" font-size="13" font-weight="700" letter-spacing="2.4" fill="${tokens["--lbs-accent"]}">LINK BUILDING STATISTICS</text>
  ${titleLines
    .map(
      (line, i) =>
        `<text x="${PAD}" y="${titleTop + i * 42}" font-size="34" font-weight="700" fill="${tokens["--lbs-ink"]}">${escapeXml(line)}</text>`
    )
    .join("\n  ")}
  ${subtitleLines
    .map(
      (line, i) =>
        `<text x="${PAD}" y="${subtitleTop + i * 26}" font-size="17" fill="${tokens["--lbs-ink-2"]}">${escapeXml(line)}</text>`
    )
    .join("\n  ")}
  <g transform="translate(${PAD}, ${chartTop})">${chartMarkup}</g>
  <line x1="${PAD}" y1="${ruleY}" x2="${CARD_W - PAD}" y2="${ruleY}" stroke="${tokens["--lbs-grid"]}" stroke-width="1"/>
  <text x="${PAD}" y="${footerBaseline}" font-size="17" font-weight="700" fill="${tokens["--lbs-ink"]}">Mentiohunt<tspan dx="10" font-size="15" font-weight="400" fill="${tokens["--lbs-ink-2"]}">${escapeXml(meta.url)}</tspan></text>
  <text x="${CARD_W - PAD}" y="${footerBaseline}" text-anchor="end" font-size="14" fill="${tokens["--lbs-ink-3"]}">${escapeXml(meta.sourceLine)}</text>`

  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${cardH}" viewBox="0 0 ${CARD_W} ${cardH}" font-family="${EXPORT_FONT}" style="${inlineTokens}">${body}\n</svg>`

  return { svg: source, width: CARD_W, height: cardH }
}

async function rasterise(source: string, width: number, height: number, scale: number) {
  const image = new Image()
  image.decoding = "sync"
  const loaded = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error("Chart image failed to render"))
  })
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`
  await loaded

  const canvas = document.createElement("canvas")
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas is unavailable")
  context.scale(scale, scale)
  context.drawImage(image, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  )
  if (!blob) throw new Error("PNG encoding failed")
  return blob
}

export async function chartToPngBlob(
  svg: SVGSVGElement,
  meta: ChartExportMeta,
  scale = 2
) {
  const { svg: source, width, height } = buildChartCardSvg(svg, meta)
  return rasterise(source, width, height, scale)
}

export async function downloadChartPng(
  svg: SVGSVGElement,
  meta: ChartExportMeta
) {
  const blob = await chartToPngBlob(svg, meta)
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = href
  anchor.download = `mentiohunt-${meta.slug}.png`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(href), 1000)
}

export async function downloadChartSvg(
  svg: SVGSVGElement,
  meta: ChartExportMeta
) {
  const { svg: source } = buildChartCardSvg(svg, meta)
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" })
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = href
  anchor.download = `mentiohunt-${meta.slug}.svg`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(href), 1000)
}

/** Puts the rendered chart on the clipboard so it can be pasted straight into Slack, docs or a tweet. */
export async function copyChartPng(svg: SVGSVGElement, meta: ChartExportMeta) {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
    throw new Error("Image clipboard is unsupported in this browser")
  }
  const blob = await chartToPngBlob(svg, meta)
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
}
