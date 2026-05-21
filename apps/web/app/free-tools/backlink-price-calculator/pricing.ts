export type LinkType = "dofollow" | "nofollow"
export type Placement = "homepage" | "body" | "bio" | "sidebar"
export type ContentType = "niche_edit" | "guest_post"
export type Permanence = "permanent" | "rented"

export interface PricingOptions {
  linkType: LinkType
  placement: Placement
  contentType: ContentType
  permanence: Permanence
}

export interface BacklinkMetrics {
  domain: string
  domainRating: number | null
  backlinks: number | null
  referringDomains: number | null
  dofollowBacklinks: number | null
  dofollowReferringDomains: number | null
  traffic: number | null
}

export interface PriceFactor {
  label: string
  multiplier: number | null
  note: string
}

export interface PriceEstimate {
  low: number
  mid: number
  high: number
  factors: PriceFactor[]
}

const DR_TIERS: [number, number][] = [
  [0, 25],
  [10, 45],
  [20, 75],
  [30, 120],
  [40, 190],
  [50, 300],
  [60, 480],
  [70, 800],
  [80, 1400],
  [90, 2600],
  [100, 2600],
]

function drBasePrice(dr: number): number {
  const clamped = Math.max(0, Math.min(100, dr))
  for (let i = 0; i < DR_TIERS.length - 1; i++) {
    const [d0, p0] = DR_TIERS[i]!
    const [d1, p1] = DR_TIERS[i + 1]!
    if (clamped <= d1) {
      const t = (clamped - d0) / (d1 - d0)
      return p0 + t * (p1 - p0)
    }
  }
  return DR_TIERS[DR_TIERS.length - 1]![1]
}

function trafficMultiplier(traffic: number | null): number {
  if (traffic === null) return 1.0
  if (traffic < 500) return 0.7
  if (traffic < 2_000) return 0.85
  if (traffic < 10_000) return 1.0
  if (traffic < 50_000) return 1.25
  if (traffic < 200_000) return 1.5
  return 1.8
}

function roundPrice(price: number): number {
  if (price < 200) return Math.round(price / 5) * 5
  if (price < 1_000) return Math.round(price / 25) * 25
  return Math.round(price / 50) * 50
}

function formatTrafficNote(traffic: number | null, mult: number): string {
  if (traffic === null) return "Traffic unavailable — neutral ×1.0 applied"
  const fmt = traffic >= 1_000
    ? `${(traffic / 1_000).toFixed(0)}k`
    : String(traffic)
  return `~${fmt} monthly visits → ×${mult}`
}

const PLACEMENT_NOTES: Record<Placement, string> = {
  homepage: "Homepage link — rare, premium placement",
  body: "In-article body — contextual, full editorial value",
  bio: "Author bio / byline — off-content, reduced value",
  sidebar: "Sidebar or footer — sitewide, lowest value",
}

export function estimatePrice(
  metrics: BacklinkMetrics,
  opts: PricingOptions
): PriceEstimate {
  const dr = metrics.domainRating ?? 20
  const base = drBasePrice(dr)

  const tMult = trafficMultiplier(metrics.traffic)
  const linkTypeMult = opts.linkType === "dofollow" ? 1.0 : 0.35
  const placementMult =
    opts.placement === "homepage" ? 1.4
    : opts.placement === "body" ? 1.0
    : opts.placement === "bio" ? 0.65
    : 0.4
  const contentMult = opts.contentType === "guest_post" ? 1.25 : 1.0
  const permanenceMult = opts.permanence === "permanent" ? 1.0 : 0.55

  const raw =
    base * tMult * linkTypeMult * placementMult * contentMult * permanenceMult

  const mid = roundPrice(raw)
  const low = roundPrice(raw * 0.82)
  const high = roundPrice(raw * 1.18)

  const factors: PriceFactor[] = [
    {
      label: "Domain Rating",
      multiplier: null,
      note: `DR ${dr} → $${roundPrice(base)} base price`,
    },
    {
      label: "Organic traffic",
      multiplier: tMult,
      note: formatTrafficNote(metrics.traffic, tMult),
    },
    {
      label: "Link type",
      multiplier: linkTypeMult,
      note:
        opts.linkType === "dofollow"
          ? "Dofollow — full SEO equity passed"
          : "Nofollow — no direct link equity",
    },
    {
      label: "Placement",
      multiplier: placementMult,
      note: PLACEMENT_NOTES[opts.placement],
    },
    {
      label: "Content type",
      multiplier: contentMult,
      note:
        opts.contentType === "guest_post"
          ? "New guest post — includes content production cost"
          : "Niche edit / link insertion into existing post",
    },
    {
      label: "Permanence",
      multiplier: permanenceMult,
      note:
        opts.permanence === "permanent"
          ? "Permanent placement"
          : "Rented / yearly — removed when contract ends",
    },
  ]

  return { low, mid, high, factors }
}

export function buildReasoning(
  metrics: BacklinkMetrics,
  opts: PricingOptions
): string {
  const dr = metrics.domainRating ?? 20
  const parts: string[] = []

  if (dr >= 70)
    parts.push(
      `DR ${dr} is high-authority territory — these sites command premium link prices.`
    )
  else if (dr >= 50)
    parts.push(`DR ${dr} puts this in mid-to-high authority. Solid link equity at a reasonable price.`)
  else if (dr >= 30)
    parts.push(`DR ${dr} is mid-authority. Decent link equity at an accessible price range.`)
  else
    parts.push(
      `DR ${dr} is lower-authority. Links here are affordable — verify the referring domain profile before buying.`
    )

  if (
    metrics.dofollowReferringDomains !== null &&
    metrics.referringDomains !== null &&
    metrics.referringDomains > 0
  ) {
    const ratio = metrics.dofollowReferringDomains / metrics.referringDomains
    if (ratio < 0.3)
      parts.push(
        "This site has a mostly nofollow referring-domain profile, which may indicate a lower-quality or manipulated backlink history."
      )
  }

  if (opts.linkType === "nofollow")
    parts.push(
      "Nofollow links pass no direct link equity — typically only worth acquiring for referral traffic or brand exposure."
    )

  if (opts.placement === "sidebar" || opts.placement === "bio")
    parts.push(
      "Off-content placements (bio, sidebar, footer) carry less weight with search engines than contextual in-article links."
    )

  if (opts.placement === "homepage")
    parts.push(
      "Homepage links are rare and command a premium — verify availability and whether the placement will remain relevant."
    )

  if (opts.permanence === "rented")
    parts.push(
      "Rented links lose their value the moment the contract ends, so factor recurring cost into the decision."
    )

  return parts.join(" ")
}
