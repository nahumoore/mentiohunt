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
  title: "Mentiohunt – Backlink Building & Community Monitoring for Founders",
  description:
    "Build backlinks from your articles and monitor Reddit for posts where your product fits — with outreach-ready contact details, email drafts, and real-time alerts.",
  openGraph: {
    title: "Mentiohunt – Backlink Building & Community Monitoring for Founders",
    description:
      "Build backlinks from your articles and monitor Reddit for posts where your product fits — with outreach-ready contact details, email drafts, and real-time alerts.",
    url: "https://mentiohunt.com",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentiohunt – Backlink Building & Community Monitoring for Founders",
    description:
      "Build backlinks from your articles and monitor Reddit for posts where your product fits — with outreach-ready contact details, email drafts, and real-time alerts.",
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
