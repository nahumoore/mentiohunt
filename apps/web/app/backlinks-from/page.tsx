import type { Metadata } from "next"

import {
  BacklinksFromHeroSection,
  BacklinksFromPlatformIndexSection,
  BacklinksFromPlaybookSection,
  BacklinksFromRelatedRoutesSection,
} from "@/components/backlinks-from"
import { Footer } from "@/components/landing/footer"
import { Navbar } from "@/components/landing/navbar"
import { getAllResources } from "@/lib/mdx"

export const metadata: Metadata = {
  title: "Backlinks From Platforms",
  description:
    "Founder-friendly guides for getting backlinks from Reddit, Medium, Quora, news websites, and other platforms where attention already exists.",
  alternates: {
    canonical: "/backlinks-from",
  },
  openGraph: {
    title: "Backlinks From Platforms — Mentiohunt",
    description:
      "Founder-friendly guides for getting backlinks from Reddit, Medium, Quora, news websites, and other platforms where attention already exists.",
    url: "https://mentiohunt.com/backlinks-from",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Backlinks From Platforms — Mentiohunt",
    description:
      "Founder-friendly guides for getting backlinks from Reddit, Medium, Quora, news websites, and other platforms where attention already exists.",
  },
}

export default function BacklinksFromPage() {
  const platformGuides = getAllResources("backlinks-from")

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        <BacklinksFromHeroSection />
        <BacklinksFromPlatformIndexSection guides={platformGuides} />
        <BacklinksFromPlaybookSection />
        <BacklinksFromRelatedRoutesSection />
      </main>

      <Footer />
    </div>
  )
}
