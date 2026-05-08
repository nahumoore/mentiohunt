import type { Metadata } from "next"
import {
  Benefits,
  DiscoverySurfaces,
  Footer,
  Hero,
  HowItWorks,
  Navbar,
  Pricing,
  SoftwareApplicationSchema,
  TargetPersonas,
  Testimonials,
} from "@/components/landing"

export const metadata: Metadata = {
  title: "Mentiohunt – Backlink Opportunity Queue for Founders",
  description:
    "Turn your site, keywords, and competitors into a daily queue of qualified backlink opportunities — with fit rationale, outreach angles, and contact info when available.",
  openGraph: {
    title: "Mentiohunt – Backlink Opportunity Queue for Founders",
    description:
      "Turn your site, keywords, and competitors into a daily queue of qualified backlink opportunities — with fit rationale, outreach angles, and contact info when available.",
    url: "https://mentiohunt.com",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentiohunt – Backlink Opportunity Queue for Founders",
    description:
      "Turn your site, keywords, and competitors into a daily queue of qualified backlink opportunities — with fit rationale, outreach angles, and contact info when available.",
  },
}

export default function Page() {
  return (
    <>
      <SoftwareApplicationSchema />
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <Hero />
        <DiscoverySurfaces />
        <Benefits />
        <HowItWorks />
        <TargetPersonas />
        <Testimonials />
        <Pricing />
        <Footer />
      </main>
    </>
  )
}
