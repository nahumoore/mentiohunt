import { PLANS } from "@/consts/billing"

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Mentiohunt",
  url: "https://mentiohunt.com",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Mentiohunt automates backlink prospecting and outreach for B2B SaaS founders — you take over once a prospect replies. Turns article URLs into a scored opportunity queue with contact details and outreach drafts.",
  offers: {
    "@type": "Offer",
    price: PLANS[0]!.price,
    priceCurrency: "USD",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: PLANS[0]!.price,
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
    <script
      id="software-application-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(softwareApplicationSchema),
      }}
    />
  )
}
