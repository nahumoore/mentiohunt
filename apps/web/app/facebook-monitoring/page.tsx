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
import { FACEBOOK_MONITORING } from "@/consts/community-monitoring"

export const metadata: Metadata = {
  title: {
    absolute: "Facebook & Group Monitoring for Founders — Mentiohunt",
  },
  description: FACEBOOK_MONITORING.seo.description,
  keywords: FACEBOOK_MONITORING.seo.keywords,
  alternates: {
    canonical: "https://mentiohunt.com/facebook-monitoring",
  },
  openGraph: {
    title: "Facebook & Group Monitoring for Founders — Mentiohunt",
    description: FACEBOOK_MONITORING.seo.description,
    url: "https://mentiohunt.com/facebook-monitoring",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Facebook & Group Monitoring for Founders — Mentiohunt",
    description: FACEBOOK_MONITORING.seo.description,
  },
}

function FacebookMonitoringSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://mentiohunt.com/facebook-monitoring",
        url: "https://mentiohunt.com/facebook-monitoring",
        name: "Facebook & Group Monitoring for Founders — Mentiohunt",
        description: FACEBOOK_MONITORING.seo.description,
        isPartOf: {
          "@type": "WebSite",
          url: "https://mentiohunt.com",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: FACEBOOK_MONITORING.faqs.map((faq) => ({
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
      id="facebook-monitoring-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default function FacebookMonitoringPage() {
  return (
    <>
      <FacebookMonitoringSchema />
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <MonitoringHero config={FACEBOOK_MONITORING} />
        <MonitoringHowItWorks config={FACEBOOK_MONITORING} />
        <MonitoringWhy config={FACEBOOK_MONITORING} />
        <MonitoringUseCases config={FACEBOOK_MONITORING} />
        <Pricing />
        <MonitoringFaq config={FACEBOOK_MONITORING} />
        <MonitoringCta config={FACEBOOK_MONITORING} />
        <Footer />
      </main>
    </>
  )
}
