import { PLANS } from "@/consts/billing"

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Mentiohunt",
  url: "https://mentiohunt.com",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Mentiohunt is an AI link-building agent and automated outreach tool. It finds natural backlink opportunities for submitted articles, qualifies each fit, finds contacts, sends outreach, and follows up until a prospect replies.",
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
