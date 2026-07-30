import Script from "next/script"

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Mentiohunt",
  url: "https://mentiohunt.com",
  logo: "https://mentiohunt.com/icon.png",
  description:
    "Mentiohunt automates backlink prospecting and outreach for B2B SaaS founders — you take over once a prospect replies.",
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
