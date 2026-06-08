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
import { GOOGLE_MONITORING } from "@/consts/community-monitoring"

export const metadata: Metadata = {
  title: {
    absolute: "Google Mentions Monitoring for Founders — Mentiohunt",
  },
  description: GOOGLE_MONITORING.seo.description,
  keywords: GOOGLE_MONITORING.seo.keywords,
  alternates: {
    canonical: "https://mentiohunt.com/google-monitoring",
  },
  openGraph: {
    title: "Google Mentions Monitoring for Founders — Mentiohunt",
    description: GOOGLE_MONITORING.seo.description,
    url: "https://mentiohunt.com/google-monitoring",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Google Mentions Monitoring for Founders — Mentiohunt",
    description: GOOGLE_MONITORING.seo.description,
  },
}

function GoogleMonitoringSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://mentiohunt.com/google-monitoring",
        url: "https://mentiohunt.com/google-monitoring",
        name: "Google Mentions Monitoring for Founders — Mentiohunt",
        description: GOOGLE_MONITORING.seo.description,
        isPartOf: {
          "@type": "WebSite",
          url: "https://mentiohunt.com",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: GOOGLE_MONITORING.faqs.map((faq) => ({
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
      id="google-monitoring-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default function GoogleMonitoringPage() {
  return (
    <>
      <GoogleMonitoringSchema />
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <MonitoringHero config={GOOGLE_MONITORING} />
        <MonitoringHowItWorks config={GOOGLE_MONITORING} />
        <MonitoringWhy config={GOOGLE_MONITORING} />
        <MonitoringUseCases config={GOOGLE_MONITORING} />
        <Pricing />
        <MonitoringFaq config={GOOGLE_MONITORING} />
        <MonitoringCta config={GOOGLE_MONITORING} />
        <Footer />
      </main>
    </>
  )
}
