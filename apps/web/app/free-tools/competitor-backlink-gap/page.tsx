import type { Metadata } from "next"

import { Footer, Navbar } from "@/components/landing"
import { CompetitorBacklinkGap } from "./tool"

export const metadata: Metadata = {
  title: "Competitor Backlink Gap Analysis - Free Tool",
  description:
    "Enter your website URL and see which sites link to your competitors but not to you. Find real backlink gap opportunities and turn them into a prioritized outreach list.",
  alternates: {
    canonical: "/free-tools/competitor-backlink-gap",
  },
  openGraph: {
    title: "Competitor Backlink Gap Analysis - Free Tool",
    description:
      "Enter your website URL and see which sites link to your competitors but not to you. Find real backlink gap opportunities and turn them into a prioritized outreach list.",
    url: "https://mentiohunt.com/free-tools/competitor-backlink-gap",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Competitor Backlink Gap Analysis - Free Tool",
    description:
      "Enter your website URL and see which sites link to your competitors but not to you. Find real backlink gap opportunities and turn them into a prioritized outreach list.",
  },
}

export default function CompetitorBacklinkGapPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar overlay />
      <CompetitorBacklinkGap />
      <Footer />
    </main>
  )
}
