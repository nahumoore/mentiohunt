import type { Metadata } from "next"
import {
  Benefits,
  Footer,
  Hero,
  HowItWorks,
  Navbar,
  Pricing,
  TargetPersonas,
  Testimonials,
} from "@/components/landing"

export const metadata: Metadata = {
  title: "Mentiohunt – Backlink Opportunity Queue for Founders",
  description:
    "Turn your site, keywords, and competitors into a daily queue of qualified backlink opportunities — with fit rationale, outreach angles, and contact info when available.",
  openGraph: {
    title: "Mentiohunt – Backlink Opportunity Queue for Founders",
    description:
      "Turn your site, keywords, and competitors into a daily queue of qualified backlink opportunities — with fit rationale, outreach angles, and contact info when available.",
    url: "https://mentiohunt.com",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentiohunt – Backlink Opportunity Queue for Founders",
    description:
      "Turn your site, keywords, and competitors into a daily queue of qualified backlink opportunities — with fit rationale, outreach angles, and contact info when available.",
  },
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Mentiohunt",
            url: "https://mentiohunt.com",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description:
              "Backlink opportunity queue for founders and agencies. Surfaces qualified directories, listicles, and resource pages worth pitching — with fit rationale, outreach angles, and contact info.",
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
          }),
        }}
      />
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <Hero />
        <HowItWorks />
        <TargetPersonas />
        <Benefits />
        <Testimonials />
        <Pricing />
        <Footer />
      </main>
    </>
  )
}
