import {
  AIMentionsOpportunities,
  Benefits,
  BigTestimonial,
  BrandMentionSources,
  Faq,
  Footer,
  FounderIntro,
  Hero,
  HowItWorks,
  Navbar,
  Pricing,
  SoftwareApplicationSchema,
  TargetPersonas,
  Testimonials,
} from "@/components/landing"
import type { Metadata } from "next"

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
        <BigTestimonial />
        <BrandMentionSources />
        <AIMentionsOpportunities />
        <HowItWorks />
        <Benefits />
        <TargetPersonas />
        <Pricing />
        <Testimonials />
        <FounderIntro />
        <Faq />
        <Footer />
      </main>
    </>
  )
}
