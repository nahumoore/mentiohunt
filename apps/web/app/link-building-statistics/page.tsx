import type { Metadata } from "next"
import Script from "next/script"

import { Footer, Navbar } from "@/components/landing"
import { LinkBuildingStatisticsPage } from "@/components/link-building-statistics"

import { DATASET_META, OVERALL_REPLY_RATE } from "./_data"

const TITLE = "Link Building Statistics: Real Outreach Data (2026)"
const DESCRIPTION = `Real backlink outreach statistics from ${DATASET_META.totalSent.toLocaleString()} sends across ${DATASET_META.distinctProducts} products — reply rates by Domain Rating, site fit, response time, and more.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/link-building-statistics",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://mentiohunt.com/link-building-statistics",
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

export default function LinkBuildingStatistics() {
  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Mentiohunt Link Building & Backlink Outreach Statistics",
    description: DESCRIPTION,
    url: "https://mentiohunt.com/link-building-statistics",
    temporalCoverage: DATASET_META.dateRangeLabel,
    dateModified: DATASET_META.lastUpdatedLabel,
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

  const overallReplyRateSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    url: "https://mentiohunt.com/link-building-statistics",
    datePublished: "2026-08-19",
    dateModified: DATASET_META.lastUpdatedLabel,
    author: { "@type": "Organization", name: "Mentiohunt" },
    publisher: { "@type": "Organization", name: "Mentiohunt" },
    about: "Link building and backlink outreach statistics",
    mainEntityOfPage: `Overall reply rate: ${(OVERALL_REPLY_RATE * 100).toFixed(1)}%`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(overallReplyRateSchema) }}
      />
      <Navbar overlay />
      <LinkBuildingStatisticsPage />
      <Footer />
    </main>
  )
}
