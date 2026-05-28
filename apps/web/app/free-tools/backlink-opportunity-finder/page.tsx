import type { Metadata } from "next"

import { Footer, Navbar } from "@/components/landing"
import { BacklinkOpportunityFinder } from "./tool"

export const metadata: Metadata = {
  title: "Backlink Opportunity Finder - Free Tool",
  description:
    "Enter your website URL and find relevant websites, blogs, and content hubs where a backlink to your product would be a strong fit. Built for founders who want real outreach targets, not a generic link list.",
  openGraph: {
    title: "Backlink Opportunity Finder - Free Tool",
    description:
      "Enter your website URL and find relevant websites, blogs, and content hubs where a backlink to your product would be a strong fit. Built for founders who want real outreach targets, not a generic link list.",
    url: "https://mentiohunt.com/free-tools/backlink-opportunity-finder",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Backlink Opportunity Finder - Free Tool",
    description:
      "Enter your website URL and find relevant websites, blogs, and content hubs where a backlink to your product would be a strong fit. Built for founders who want real outreach targets, not a generic link list.",
  },
}

export default function BacklinkOpportunityFinderPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar overlay />
      <BacklinkOpportunityFinder />
      <Footer />
    </main>
  )
}
