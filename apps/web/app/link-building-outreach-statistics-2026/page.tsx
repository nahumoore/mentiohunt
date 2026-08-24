import type { Metadata } from "next"
import Script from "next/script"

import { Footer, Navbar } from "@/components/landing"
import { StatisticsReport } from "@/components/link-building-statistics"
import { pageUrlFor } from "@/components/link-building-statistics/shared/links"
import { getEdition } from "@/content/link-building-statistics"

const edition = getEdition(2026)
const { meta } = edition
const PAGE_URL = pageUrlFor(edition.year)

const TITLE = "Link Building Statistics 2026: Real Outreach Data"
const DESCRIPTION = `Real backlink outreach data from ${meta.totalSent.toLocaleString()} emails sent across ${meta.distinctProducts} products — reply rates by Domain Rating, site fit, response time, and more.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: `/link-building-outreach-statistics-${edition.year}`,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: "Mentiohunt",
    type: "article",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Mentiohunt – Backlink outreach on autopilot" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function LinkBuildingOutreachStatistics2026() {
  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Mentiohunt Link Building & Backlink Outreach Statistics",
    description: DESCRIPTION,
    url: PAGE_URL,
    temporalCoverage: meta.dateRangeLabel,
    dateModified: meta.publishedLabel,
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: {
      "@type": "Organization",
      name: "Mentiohunt",
      url: "https://mentiohunt.com",
    },
    variableMeasured: [
      "Cold outreach reply rate",
      "Reply rate by Domain Rating tier",
      "Reply rate by site relevance score",
      "Time to first reply",
      "Reply classification",
      "Follow-up sequence lift",
    ],
    measurementTechnique:
      "Aggregated directly from Mentiohunt's outreach platform logs (outreach sends, inbound replies, and prospect classification).",
  }

  const overallReplyRate = meta.uniqueRepliedProspects / meta.prospectsContacted

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    datePublished: meta.publishedLabel,
    dateModified: meta.publishedLabel,
    author: { "@type": "Organization", name: "Mentiohunt" },
    publisher: { "@type": "Organization", name: "Mentiohunt" },
    about: "Link building and backlink outreach statistics",
    mainEntityOfPage: `Overall reply rate: ${(overallReplyRate * 100).toFixed(1)}%`,
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Script
        id="dataset-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }}
      />
      <Script
        id="article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Navbar overlay />
      <StatisticsReport edition={edition} />
      <Footer />
    </main>
  )
}
