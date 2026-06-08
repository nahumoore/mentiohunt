import Script from "next/script"
import type { Metadata } from "next"

import { Footer, Navbar, Pricing } from "@/components/landing"
import {
  MonitoringCta,
  MonitoringFaq,
  MonitoringHero,
  MonitoringHowItWorks,
  MonitoringUseCases,
  MonitoringWhy,
} from "@/components/community-monitoring"
import { LINKEDIN_MONITORING } from "@/consts/community-monitoring"

export const metadata: Metadata = {
  title: {
    absolute: "LinkedIn Monitoring for Founders — Mentiohunt",
  },
  description: LINKEDIN_MONITORING.seo.description,
  keywords: LINKEDIN_MONITORING.seo.keywords,
  alternates: {
    canonical: "https://mentiohunt.com/linkedin-monitoring",
  },
  openGraph: {
    title: "LinkedIn Monitoring for Founders — Mentiohunt",
    description: LINKEDIN_MONITORING.seo.description,
    url: "https://mentiohunt.com/linkedin-monitoring",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedIn Monitoring for Founders — Mentiohunt",
    description: LINKEDIN_MONITORING.seo.description,
  },
}

function LinkedinMonitoringSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://mentiohunt.com/linkedin-monitoring",
        url: "https://mentiohunt.com/linkedin-monitoring",
        name: "LinkedIn Monitoring for Founders — Mentiohunt",
        description: LINKEDIN_MONITORING.seo.description,
        isPartOf: {
          "@type": "WebSite",
          url: "https://mentiohunt.com",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: LINKEDIN_MONITORING.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      },
    ],
  }

  return (
    <Script
      id="linkedin-monitoring-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default function LinkedinMonitoringPage() {
  return (
    <>
      <LinkedinMonitoringSchema />
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <MonitoringHero config={LINKEDIN_MONITORING} />
        <MonitoringHowItWorks config={LINKEDIN_MONITORING} />
        <MonitoringWhy config={LINKEDIN_MONITORING} />
        <MonitoringUseCases config={LINKEDIN_MONITORING} />
        <Pricing />
        <MonitoringFaq config={LINKEDIN_MONITORING} />
        <MonitoringCta config={LINKEDIN_MONITORING} />
        <Footer />
      </main>
    </>
  )
}
