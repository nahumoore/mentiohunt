import Script from "next/script"

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Mentiohunt",
  url: "https://mentiohunt.com",
  logo: "https://mentiohunt.com/icon.png",
  description:
    "Managed backlink placement autopilot for founder-led B2B SaaS teams.",
  sameAs: ["https://x.com/nicolasmore_"],
}

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Mentiohunt",
  url: "https://mentiohunt.com",
}

export function OrganizationSchema() {
  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  )
}
