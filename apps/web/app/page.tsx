import {
  BigTestimonial,
  Comparisons,
  Faq,
  Footer,
  Hero,
  HowItWorks,
  LandingPageTracker,
  Navbar,
  OrganizationSchema,
  Pricing,
  SoftwareApplicationSchema,
  Testimonials,
  TrustedByMarquee,
  WhyMentiohunt,
} from "@/components/landing"
import type { Metadata } from "next"
import { LANDING_FAQS } from "@/consts/faq"

export const metadata: Metadata = {
  title: "Mentiohunt – AI Link-Building Agent & Outreach Software",
  description:
    "AI link-building agent and automated outreach software that finds natural backlink opportunities, contacts the right people, and follows up until they reply.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Mentiohunt – AI Link-Building Agent & Outreach Software",
    description:
      "AI link-building agent and automated outreach software that finds natural backlink opportunities, contacts the right people, and follows up until they reply.",
    url: "https://mentiohunt.com",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentiohunt – AI Link-Building Agent & Outreach Software",
    description:
      "AI link-building agent and automated outreach software that finds natural backlink opportunities, contacts the right people, and follows up until they reply.",
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
        <Navbar overlay />
        <Hero />
        <BigTestimonial />
        <div className="container mx-auto px-4 pb-10 sm:px-6 sm:pb-12 lg:px-8">
          <TrustedByMarquee />
        </div>
        <HowItWorks />
        <WhyMentiohunt />
        <Comparisons />
        <Testimonials />
        <Pricing />
        <Faq />
        <Footer />
      </main>
    </>
  )
}
