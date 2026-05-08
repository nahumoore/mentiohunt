import Script from "next/script"

const softwareApplicationSchema = {
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
}

export function SoftwareApplicationSchema() {
  return (
    <Script
      id="software-application-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(softwareApplicationSchema),
      }}
    />
  )
}
