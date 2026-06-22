import {
  AIMentionsOpportunities,
  BigTestimonial,
  BurnedByAgencies,
  Comparisons,
  BrandMentionSources,
  Faq,
  Footer,
  FounderIntro,
  Hero,
  HowItWorks,
  LandingPageTracker,
  Navbar,
  Pricing,
  SoftwareApplicationSchema,
  TargetPersonas,
  Testimonials,
  WhyMentiohunt,
} from "@/components/landing"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mentiohunt – Backlink Placement Autopilot for Founders",
  description:
    "Turn your article URLs into a backlink opportunity queue — with fit scoring, contact details, and outreach drafts ready to send.",
  openGraph: {
    title: "Mentiohunt – Backlink Placement Autopilot for Founders",
    description:
      "Turn your article URLs into a backlink opportunity queue — with fit scoring, contact details, and outreach drafts ready to send.",
    url: "https://mentiohunt.com",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentiohunt – Backlink Placement Autopilot for Founders",
    description:
      "Turn your article URLs into a backlink opportunity queue — with fit scoring, contact details, and outreach drafts ready to send.",
  },
}

export default function Page() {
  return (
    <>
      <LandingPageTracker />
      <SoftwareApplicationSchema />
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <Hero />
        <BigTestimonial />
        <BrandMentionSources />
        <AIMentionsOpportunities />
        <WhyMentiohunt />
        <HowItWorks />
        <Comparisons />
        <BurnedByAgencies />
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
