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
import { QUORA_MONITORING } from "@/consts/community-monitoring"

export const metadata: Metadata = {
  title: {
    absolute: "Quora Monitoring for Founders — Mentiohunt",
  },
  description: QUORA_MONITORING.seo.description,
  keywords: QUORA_MONITORING.seo.keywords,
  alternates: {
    canonical: "https://mentiohunt.com/quora-monitoring",
  },
  openGraph: {
    title: "Quora Monitoring for Founders — Mentiohunt",
    description: QUORA_MONITORING.seo.description,
    url: "https://mentiohunt.com/quora-monitoring",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quora Monitoring for Founders — Mentiohunt",
    description: QUORA_MONITORING.seo.description,
  },
}

function QuoraMonitoringSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://mentiohunt.com/quora-monitoring",
        url: "https://mentiohunt.com/quora-monitoring",
        name: "Quora Monitoring for Founders — Mentiohunt",
        description: QUORA_MONITORING.seo.description,
        isPartOf: {
          "@type": "WebSite",
          url: "https://mentiohunt.com",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: QUORA_MONITORING.faqs.map((faq) => ({
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
        description: QUORA_MONITORING.seo.description,
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
          "Distribution tool for founders and small marketing teams. Monitor Quora and other communities for posts where your product fits, with fit-scored matches and ready-to-send reply drafts.",
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
      id="quora-monitoring-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default function QuoraMonitoringPage() {
  return (
    <>
      <QuoraMonitoringSchema />
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <MonitoringHero config={QUORA_MONITORING} />
        <MonitoringHowItWorks config={QUORA_MONITORING} />
        <MonitoringWhy config={QUORA_MONITORING} />
        <MonitoringUseCases config={QUORA_MONITORING} />
        <Pricing />
        <MonitoringFaq config={QUORA_MONITORING} />
        <MonitoringCta config={QUORA_MONITORING} />
        <Footer />
      </main>
    </>
  )
}
