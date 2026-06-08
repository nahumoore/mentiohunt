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
import { TWITTER_MONITORING } from "@/consts/community-monitoring"

export const metadata: Metadata = {
  title: {
    absolute: "Twitter Monitoring for Founders — Mentiohunt",
  },
  description: TWITTER_MONITORING.seo.description,
  keywords: TWITTER_MONITORING.seo.keywords,
  alternates: {
    canonical: "https://mentiohunt.com/twitter-monitoring",
  },
  openGraph: {
    title: "Twitter Monitoring for Founders — Mentiohunt",
    description: TWITTER_MONITORING.seo.description,
    url: "https://mentiohunt.com/twitter-monitoring",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Twitter Monitoring for Founders — Mentiohunt",
    description: TWITTER_MONITORING.seo.description,
  },
}

function TwitterMonitoringSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://mentiohunt.com/twitter-monitoring",
        url: "https://mentiohunt.com/twitter-monitoring",
        name: "Twitter Monitoring for Founders — Mentiohunt",
        description: TWITTER_MONITORING.seo.description,
        isPartOf: {
          "@type": "WebSite",
          url: "https://mentiohunt.com",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: TWITTER_MONITORING.faqs.map((faq) => ({
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
      id="twitter-monitoring-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default function TwitterMonitoringPage() {
  return (
    <>
      <TwitterMonitoringSchema />
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <MonitoringHero config={TWITTER_MONITORING} />
        <MonitoringHowItWorks config={TWITTER_MONITORING} />
        <MonitoringWhy config={TWITTER_MONITORING} />
        <MonitoringUseCases config={TWITTER_MONITORING} />
        <Pricing />
        <MonitoringFaq config={TWITTER_MONITORING} />
        <MonitoringCta config={TWITTER_MONITORING} />
        <Footer />
      </main>
    </>
  )
}
