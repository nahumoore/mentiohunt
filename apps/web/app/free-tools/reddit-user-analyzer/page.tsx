import type { Metadata } from "next"

import { Footer, Navbar } from "@/components/landing"
import { RedditUserAnalyzer } from "./tool"

export const metadata: Metadata = {
  title: "Reddit User Analyzer - Free Tool",
  description:
    "Enter a Reddit username and get a full breakdown of their activity — top subreddits, karma split, interest profile, and behavior patterns. Free, no login required.",
  alternates: {
    canonical: "/free-tools/reddit-user-analyzer",
  },
  openGraph: {
    title: "Reddit User Analyzer - Free Tool",
    description:
      "Enter a Reddit username and get a full breakdown of their activity — top subreddits, karma split, interest profile, and behavior patterns. Free, no login required.",
    url: "https://mentiohunt.com/free-tools/reddit-user-analyzer",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reddit User Analyzer - Free Tool",
    description:
      "Enter a Reddit username and get a full breakdown of their activity — top subreddits, karma split, interest profile, and behavior patterns. Free, no login required.",
  },
}

export default function RedditUserAnalyzerPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar overlay />
      <RedditUserAnalyzer />
      <Footer />
    </main>
  )
}
