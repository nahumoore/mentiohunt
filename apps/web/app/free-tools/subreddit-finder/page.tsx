import type { Metadata } from "next"

import { Footer, Navbar } from "@/components/landing"
import { SubredditFinder } from "./tool"

export const metadata: Metadata = {
  title: "Subreddit Finder Tool - Free Tool",
  description:
    "Enter your website URL and find the most relevant subreddits for your product. Get a ranked list of Reddit communities with fit rationale so you know exactly where to show up.",
  alternates: {
    canonical: "/free-tools/subreddit-finder",
  },
  openGraph: {
    title: "Subreddit Finder Tool - Free Tool",
    description:
      "Enter your website URL and find the most relevant subreddits for your product. Get a ranked list of Reddit communities with fit rationale so you know exactly where to show up.",
    url: "https://mentiohunt.com/free-tools/subreddit-finder",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Subreddit Finder Tool - Free Tool",
    description:
      "Enter your website URL and find the most relevant subreddits for your product. Get a ranked list of Reddit communities with fit rationale so you know exactly where to show up.",
  },
}

export default function SubredditFinderPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar overlay />
      <SubredditFinder />
      <Footer />
    </main>
  )
}
