import type { Metadata } from "next"

import {
  LinkBuildingForHeroSection,
  LinkBuildingForNicheIndexSection,
  LinkBuildingForPlaybookSection,
  LinkBuildingForRelatedRoutesSection,
} from "@/components/link-building-for"
import { Footer } from "@/components/landing/footer"
import { Navbar } from "@/components/landing/navbar"
import { getAllResources } from "@/lib/mdx"

export const metadata: Metadata = {
  title: "Link Building For Your Industry",
  description:
    "Industry-specific link building playbooks — the sites, tactics, and outreach angles that actually work for lawyers, SaaS, real estate, startups, and ecommerce founders.",
  alternates: {
    canonical: "/link-building-for",
  },
  openGraph: {
    title: "Link Building For Your Industry — Mentiohunt",
    description:
      "Industry-specific link building playbooks — the sites, tactics, and outreach angles that actually work for lawyers, SaaS, real estate, startups, and ecommerce founders.",
    url: "https://mentiohunt.com/link-building-for",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Link Building For Your Industry — Mentiohunt",
    description:
      "Industry-specific link building playbooks — the sites, tactics, and outreach angles that actually work for lawyers, SaaS, real estate, startups, and ecommerce founders.",
  },
}

export default function LinkBuildingForPage() {
  const nicheGuides = getAllResources("link-building-for")

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        <LinkBuildingForHeroSection />
        <LinkBuildingForNicheIndexSection guides={nicheGuides} />
        <LinkBuildingForPlaybookSection />
        <LinkBuildingForRelatedRoutesSection />
      </main>

      <Footer />
    </div>
  )
}
