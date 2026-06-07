import type { Metadata } from "next"

import { Footer, Navbar } from "@/components/landing"
import { DirectoryBacklinkOpportunityFinder } from "./tool"

export const metadata: Metadata = {
  title: "Directory Backlink Opportunity Finder - Free Tool",
  description:
    "Find startup directories where your product could submit for relevant backlink opportunities. Enter your product URL and review directory opportunities to apply for next.",
  alternates: {
    canonical: "/free-tools/directory-backlink-opportunity-finder",
  },
  openGraph: {
    title: "Directory Backlink Opportunity Finder - Free Tool",
    description:
      "Find startup directories where your product could submit for relevant backlink opportunities. Enter your product URL and review directory opportunities to apply for next.",
    url: "https://mentiohunt.com/free-tools/directory-backlink-opportunity-finder",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Directory Backlink Opportunity Finder - Free Tool",
    description:
      "Find startup directories where your product could submit for relevant backlink opportunities. Enter your product URL and review directory opportunities to apply for next.",
  },
}

export default function DirectoryBacklinkOpportunityFinderPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar overlay />
      <DirectoryBacklinkOpportunityFinder />
      <Footer />
    </main>
  )
}
