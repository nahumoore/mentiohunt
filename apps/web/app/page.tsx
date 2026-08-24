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
  OrganizationSchema,
  Pricing,
  SoftwareApplicationSchema,
  TargetPersonas,
  Testimonials,
  WhyMentiohunt,
} from "@/components/landing"
import type { Metadata } from "next"
import { LANDING_FAQS } from "@/consts/faq"

export const metadata: Metadata = {
  title: "Mentiohunt – Automated Link Building Tool for Founders",
  description:
    "The automated link building tool that turns article URLs into a backlink opportunity queue — fit scoring, contacts, and outreach drafts ready to send.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Mentiohunt – Automated Link Building Tool for Founders",
    description:
      "The automated link building tool that turns article URLs into a backlink opportunity queue — fit scoring, contacts, and outreach drafts ready to send.",
    url: "https://mentiohunt.com",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentiohunt – Automated Link Building Tool for Founders",
    description:
      "The automated link building tool that turns article URLs into a backlink opportunity queue — fit scoring, contacts, and outreach drafts ready to send.",
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: LANDING_FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
}

export default function Page() {
  return (
    <>
      <LandingPageTracker />
      <SoftwareApplicationSchema />
      <OrganizationSchema />
      <script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <Hero />
        <BrandMentionSources />
        <AIMentionsOpportunities />
        <BigTestimonial />
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
