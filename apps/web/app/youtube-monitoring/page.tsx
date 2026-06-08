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
import { YOUTUBE_MONITORING } from "@/consts/community-monitoring"

export const metadata: Metadata = {
  title: {
    absolute: "YouTube Monitoring for Founders — Mentiohunt",
  },
  description: YOUTUBE_MONITORING.seo.description,
  keywords: YOUTUBE_MONITORING.seo.keywords,
  alternates: {
    canonical: "https://mentiohunt.com/youtube-monitoring",
  },
  openGraph: {
    title: "YouTube Monitoring for Founders — Mentiohunt",
    description: YOUTUBE_MONITORING.seo.description,
    url: "https://mentiohunt.com/youtube-monitoring",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Monitoring for Founders — Mentiohunt",
    description: YOUTUBE_MONITORING.seo.description,
  },
}

function YoutubeMonitoringSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://mentiohunt.com/youtube-monitoring",
        url: "https://mentiohunt.com/youtube-monitoring",
        name: "YouTube Monitoring for Founders — Mentiohunt",
        description: YOUTUBE_MONITORING.seo.description,
        isPartOf: {
          "@type": "WebSite",
          url: "https://mentiohunt.com",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: YOUTUBE_MONITORING.faqs.map((faq) => ({
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
      id="youtube-monitoring-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default function YoutubeMonitoringPage() {
  return (
    <>
      <YoutubeMonitoringSchema />
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <MonitoringHero config={YOUTUBE_MONITORING} />
        <MonitoringHowItWorks config={YOUTUBE_MONITORING} />
        <MonitoringWhy config={YOUTUBE_MONITORING} />
        <MonitoringUseCases config={YOUTUBE_MONITORING} />
        <Pricing />
        <MonitoringFaq config={YOUTUBE_MONITORING} />
        <MonitoringCta config={YOUTUBE_MONITORING} />
        <Footer />
      </main>
    </>
  )
}
