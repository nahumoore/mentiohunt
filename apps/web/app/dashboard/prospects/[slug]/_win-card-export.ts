// Turns the win card into a standalone, postable image — same approach as the
// link building statistics charts (see components/link-building-statistics/
// shared/share/export-chart.ts): build an SVG string with literal brand
// colours and a system font stack, then rasterise it via canvas. The win card
// has no live SVG node to clone (it's plain HTML), so this builds the SVG
// from scratch instead of cloning one.

const CARD_W = 1200
const CARD_H = 630

// next/font's hashed family name doesn't exist inside the isolated SVG
// document a canvas rasterises, so text uses a literal stack instead of
// var(--font-sans).
const EXPORT_FONT = "Inter, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif"

const COLOR = {
  background: "#ffffff",
  border: "#e7e7e7",
  foreground: "#1f1f1f",
  muted: "#6f6f6f",
  primary: "#ff5a1f",
  success: "#2dbe60",
}

export interface WonCardMeta {
  domain: string
  domainRating: number | null
  ordinal: number
  totalWonCount: number
  totalDrEarned: number
  dateLabel: string | null
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function buildWonCardSvg(meta: WonCardMeta): string {
  const isFirst = meta.ordinal <= 1
  const eyebrow = isFirst ? "YOUR FIRST BACKLINK" : "BACKLINK WON"
  const metaParts = [
    meta.domainRating !== null ? `DR ${meta.domainRating}` : null,
    meta.dateLabel,
  ].filter((part): part is string => Boolean(part))

  const cx = CARD_W / 2

  const body = `
  <rect x="0.5" y="0.5" width="${CARD_W - 1}" height="${CARD_H - 1}" rx="28" fill="${COLOR.background}" stroke="${COLOR.border}"/>
  <text x="${cx}" y="220" text-anchor="middle" font-size="20" font-weight="700" letter-spacing="3" fill="${COLOR.success}">${escapeXml(eyebrow)}</text>
  <text x="${cx}" y="360" text-anchor="middle" font-size="176" font-weight="700" letter-spacing="-8" fill="${COLOR.primary}">#${meta.ordinal}</text>
  <text x="${cx}" y="430" text-anchor="middle" font-size="42" font-weight="600" letter-spacing="-1" fill="${COLOR.foreground}">${escapeXml(meta.domain)}</text>
  ${
    metaParts.length
      ? `<text x="${cx}" y="466" text-anchor="middle" font-size="22" fill="${COLOR.muted}">${escapeXml(metaParts.join(" · "))}</text>`
      : ""
  }
  ${
    !isFirst
      ? `<line x1="${cx - 110}" y1="500" x2="${cx + 110}" y2="500" stroke="${COLOR.border}" stroke-width="1"/>
  <text x="${cx}" y="536" text-anchor="middle" font-size="20" fill="${COLOR.muted}">${escapeXml(`${meta.totalDrEarned} DR earned across ${meta.totalWonCount} links`)}</text>`
      : ""
  }
  <text x="${CARD_W - 40}" y="${CARD_H - 32}" text-anchor="end" font-size="16" font-weight="600" fill="${COLOR.muted}">mentiohunt.com</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}" font-family="${EXPORT_FONT}">${body}\n</svg>`
}

async function rasterise(source: string, scale: number) {
  const image = new Image()
  image.decoding = "sync"
  const loaded = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error("Card image failed to render"))
  })
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`
  await loaded

  const canvas = document.createElement("canvas")
  canvas.width = Math.round(CARD_W * scale)
  canvas.height = Math.round(CARD_H * scale)
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas is unavailable")
  context.scale(scale, scale)
  context.drawImage(image, 0, 0, CARD_W, CARD_H)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  )
  if (!blob) throw new Error("PNG encoding failed")
  return blob
}

export async function wonCardToPngBlob(meta: WonCardMeta, scale = 2) {
  return rasterise(buildWonCardSvg(meta), scale)
}

export async function downloadWonCardPng(meta: WonCardMeta) {
  const blob = await wonCardToPngBlob(meta)
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = href
  anchor.download = `mentiohunt-backlink-won-${meta.domain}.png`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(href), 1000)
}

/** Puts the rendered card on the clipboard so it can be pasted straight into Slack, docs or a tweet. */
export async function copyWonCardPng(meta: WonCardMeta) {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
    throw new Error("Image clipboard is unsupported in this browser")
  }
  const blob = await wonCardToPngBlob(meta)
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
}
