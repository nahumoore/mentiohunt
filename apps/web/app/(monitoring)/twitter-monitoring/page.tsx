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
    absolute: "Twitter / X Monitoring for Founders — Mentiohunt",
  },
  description: TWITTER_MONITORING.seo.description,
  keywords: TWITTER_MONITORING.seo.keywords,
  alternates: {
    canonical: "https://mentiohunt.com/twitter-monitoring",
  },
  openGraph: {
    title: "Twitter / X Monitoring for Founders — Mentiohunt",
    description: TWITTER_MONITORING.seo.description,
    url: "https://mentiohunt.com/twitter-monitoring",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Twitter / X Monitoring for Founders — Mentiohunt",
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
        name: "Twitter / X Monitoring for Founders — Mentiohunt",
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
      {
        "@type": "SoftwareApplication",
        name: "Mentiohunt",
        url: "https://mentiohunt.com",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: TWITTER_MONITORING.seo.description,
        offers: {
          "@type": "Offer",
          price: "49",
          priceCurrency: "USD",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: "49",
            priceCurrency: "USD",
            billingDuration: "P1M",
          },
        },
        publisher: {
          "@type": "Organization",
          name: "Mentiohunt",
          url: "https://mentiohunt.com",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://mentiohunt.com/#organization",
        name: "Mentiohunt",
        url: "https://mentiohunt.com",
        logo: "https://mentiohunt.com/logo.png",
        description:
          "Distribution tool for founders and small marketing teams. Monitor X (Twitter) and other communities for posts where your product fits, with fit-scored matches and ready-to-send reply drafts.",
        address: {
          "@type": "PostalAddress",
          addressCountry: "US",
          addressRegion: "DE",
        },
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
