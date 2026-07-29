import Script from "next/script"
import { PLANS } from "@/consts/billing"

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Mentiohunt",
  url: "https://mentiohunt.com",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Distribution tool for founders and small marketing teams. Build backlinks from your articles and monitor Reddit for posts where your product fits — with contact details, outreach drafts, and real-time alerts.",
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
    <Script
      id="software-application-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(softwareApplicationSchema),
      }}
    />
  )
}
