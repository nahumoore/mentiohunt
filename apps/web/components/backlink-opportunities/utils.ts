import { TYPE_CONFIG } from "@/app/dashboard/link-building/opportunities/_data"
import type { ProspectDetail } from "@/stores/prospect-store"

export type ProspectProduct = {
  productName: string
  websiteUrl: string
}

export const DOMAIN_RATING_COLOR_SCHEMES = {
  neutral: {
    badgeClass:
      "border-border/70 bg-background text-muted-foreground dark:border-border/60 dark:bg-muted/30",
    metricClass:
      "border-border/70 bg-card text-foreground dark:border-border/60 dark:bg-muted/20",
    panelClass:
      "border-border/70 bg-linear-to-br from-card via-background to-muted/50 text-foreground",
    accent: "var(--color-muted-foreground)",
    track: "var(--color-border)",
    center: "color-mix(in oklab, var(--color-card) 92%, white)",
    border: "color-mix(in oklab, var(--color-border) 80%, white)",
  },
  low: {
    badgeClass:
      "border-red-500/20 bg-red-500/10 text-red-700 dark:border-red-500/25 dark:bg-red-500/12 dark:text-red-300",
    metricClass:
      "border-red-500/16 bg-red-500/6 text-red-950 dark:border-red-500/18 dark:bg-red-500/10 dark:text-red-100",
    panelClass:
      "border-red-500/20 bg-linear-to-br from-red-500/16 via-red-500/8 to-card text-red-950 dark:text-red-50",
    accent: "#dc2626",
    track: "#fca5a5",
    center:
      "linear-gradient(180deg, rgba(254,242,242,0.98) 0%, rgba(254,226,226,0.92) 100%)",
    border: "rgba(239,68,68,0.24)",
  },
  medium: {
    badgeClass:
      "border-princeton-orange/25 bg-princeton-orange/12 text-blaze-orange dark:border-princeton-orange/30 dark:bg-princeton-orange/14 dark:text-orange-200",
    metricClass:
      "border-princeton-orange/18 bg-princeton-orange/7 text-orange-950 dark:border-princeton-orange/20 dark:bg-princeton-orange/12 dark:text-orange-50",
    panelClass:
      "border-princeton-orange/25 bg-linear-to-br from-princeton-orange/18 via-princeton-orange/8 to-card text-orange-950 dark:text-orange-50",
    accent: "var(--color-princeton-orange)",
    track: "#fdba74",
    center:
      "linear-gradient(180deg, rgba(255,247,237,0.98) 0%, rgba(255,237,213,0.92) 100%)",
    border: "rgba(249,115,22,0.22)",
  },
  high: {
    badgeClass:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/12 dark:text-emerald-300",
    metricClass:
      "border-emerald-500/16 bg-emerald-500/6 text-emerald-950 dark:border-emerald-500/18 dark:bg-emerald-500/10 dark:text-emerald-50",
    panelClass:
      "border-emerald-500/20 bg-linear-to-br from-emerald-500/16 via-emerald-500/8 to-card text-emerald-950 dark:text-emerald-50",
    accent: "#16a34a",
    track: "#86efac",
    center:
      "linear-gradient(180deg, rgba(240,253,244,0.98) 0%, rgba(220,252,231,0.92) 100%)",
    border: "rgba(34,197,94,0.24)",
  },
} as const

export type DomainRatingBand = keyof typeof DOMAIN_RATING_COLOR_SCHEMES

export function getTargetLabel(targetUrl: string) {
  try {
    const url = new URL(targetUrl)
    return `${url.hostname.replace(/^www\./, "")}${url.pathname === "/" ? "" : url.pathname}`
  } catch {
    return targetUrl
  }
}

export function getDomainRatingBand(value: number | null): DomainRatingBand {
  if (value === null) return "neutral"
  if (value >= 70) return "high"
  if (value >= 40) return "medium"
  return "low"
}

export function getDomainRatingColorScheme(value: number | null) {
  return DOMAIN_RATING_COLOR_SCHEMES[getDomainRatingBand(value)]
}

export function getDomainRatingBandLabel(value: number | null) {
  if (value === null) return "No score yet"
  if (value >= 70) return "High authority"
  if (value >= 40) return "Moderate authority"
  return "Low authority"
}

export function getHostname(rawUrl: string) {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "")
  } catch {
    return (
      rawUrl
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0] ?? rawUrl
    )
  }
}

export function getSerpUrl(prospect: ProspectDetail, product: ProspectProduct) {
  const productHost = getHostname(product.websiteUrl)
  const query = [`site:${prospect.domain}`, `"${product.productName}"`]

  if (productHost) {
    query.push(`"${productHost}"`)
  }

  return `https://www.google.com/search?q=${encodeURIComponent(query.join(" "))}`
}

export function getProspectReason(prospect: ProspectDetail) {
  if (prospect.notes?.trim()) return prospect.notes

  return TYPE_CONFIG[prospect.tier].description
}
