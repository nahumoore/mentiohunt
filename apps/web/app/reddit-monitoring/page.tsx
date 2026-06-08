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
import { REDDIT_MONITORING } from "@/consts/community-monitoring"

export const metadata: Metadata = {
  title: {
    absolute: "Reddit Monitoring for Founders — Mentiohunt",
  },
  description: REDDIT_MONITORING.seo.description,
  keywords: REDDIT_MONITORING.seo.keywords,
  alternates: {
    canonical: "https://mentiohunt.com/reddit-monitoring",
  },
  openGraph: {
    title: "Reddit Monitoring for Founders — Mentiohunt",
    description: REDDIT_MONITORING.seo.description,
    url: "https://mentiohunt.com/reddit-monitoring",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reddit Monitoring for Founders — Mentiohunt",
    description: REDDIT_MONITORING.seo.description,
  },
}

function RedditMonitoringSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://mentiohunt.com/reddit-monitoring",
        url: "https://mentiohunt.com/reddit-monitoring",
        name: "Reddit Monitoring for Founders — Mentiohunt",
        description: REDDIT_MONITORING.seo.description,
        isPartOf: {
          "@type": "WebSite",
          url: "https://mentiohunt.com",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: REDDIT_MONITORING.faqs.map((faq) => ({
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
      id="reddit-monitoring-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default function RedditMonitoringPage() {
  return (
    <>
      <RedditMonitoringSchema />
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <MonitoringHero config={REDDIT_MONITORING} />
        <MonitoringHowItWorks config={REDDIT_MONITORING} />
        <MonitoringWhy config={REDDIT_MONITORING} />
        <MonitoringUseCases config={REDDIT_MONITORING} />
        <Pricing />
        <MonitoringFaq config={REDDIT_MONITORING} />
        <MonitoringCta config={REDDIT_MONITORING} />
        <Footer />
      </main>
    </>
  )
}
