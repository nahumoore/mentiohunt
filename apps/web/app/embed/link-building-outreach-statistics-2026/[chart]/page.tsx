import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getChartSpec } from "@/components/link-building-statistics/shared/chart-specs"
import { EmbedCard } from "@/components/link-building-statistics/shared/embed-card"
import { ALL_CHART_IDS } from "@/content/link-building-statistics/types"
import { getEdition } from "@/content/link-building-statistics"

const edition = getEdition(2026)

export const dynamicParams = false

export function generateStaticParams() {
  return ALL_CHART_IDS.map((chart) => ({ chart }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chart: string }>
}): Promise<Metadata> {
  const { chart } = await params
  const spec = getChartSpec(edition, chart)

  return {
    title: spec ? `${spec.title} — Mentiohunt` : "Chart — Mentiohunt",
    description: spec?.stat,
    // Embeds must never compete with the source page in search results.
    robots: { index: false, follow: true },
  }
}

export default async function ChartEmbed({
  params,
}: {
  params: Promise<{ chart: string }>
}) {
  const { chart } = await params
  const spec = getChartSpec(edition, chart)

  if (!spec) {
    notFound()
  }

  return <EmbedCard edition={edition} spec={spec} />
}
