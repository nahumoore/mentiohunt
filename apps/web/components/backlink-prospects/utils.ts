import type { ProspectDetail } from "@/stores/prospect-store"
import { TYPE_CONFIG } from "@/app/dashboard/link-building/prospects/_data"

export type ProspectProduct = {
  productName: string
  websiteUrl: string
}

export function getTargetLabel(targetUrl: string) {
  try {
    const url = new URL(targetUrl)
    return `${url.hostname.replace(/^www\./, "")}${url.pathname === "/" ? "" : url.pathname}`
  } catch {
    return targetUrl
  }
}

export function getHostname(rawUrl: string) {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "")
  } catch {
    return (
      rawUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ??
      rawUrl
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
