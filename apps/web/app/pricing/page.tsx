import type { Metadata } from "next"
import Script from "next/script"
import { supabaseServer } from "@workspace/supabase/server"
import { PLANS, type BillingTier } from "@/consts/billing"
import { Navbar, Footer, Testimonials, Faq } from "@/components/landing"
import { PricingClientPage } from "./client-page"

export const metadata: Metadata = {
  title: "Managed Backlink Placement Pricing",
  description:
    "Simple, transparent pricing for managed backlink placement outreach. Start free, upgrade as your queue of vetted opportunities grows — no contracts.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Managed Backlink Placement Pricing – Mentiohunt",
    description:
      "Simple, transparent pricing for managed backlink placement outreach. Start free, upgrade as your queue of vetted opportunities grows — no contracts.",
    url: "https://mentiohunt.com/pricing",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Managed Backlink Placement Pricing – Mentiohunt",
    description:
      "Simple, transparent pricing for managed backlink placement outreach. Start free, upgrade as your queue of vetted opportunities grows — no contracts.",
  },
}

const pricingSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Mentiohunt",
  description:
    "Mentiohunt automates backlink prospecting and outreach for B2B SaaS founders — you take over once a prospect replies.",
  url: "https://mentiohunt.com/pricing",
  brand: { "@type": "Brand", name: "Mentiohunt" },
  offers: PLANS.map((plan) => ({
    "@type": "Offer",
    name: plan.name,
    price: plan.price,
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: "https://mentiohunt.com/pricing",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: plan.price,
      priceCurrency: "USD",
      billingDuration: "P1M",
    },
  })),
}

export default async function PricingPage() {
  let userTier: BillingTier | null = null
  let isLoggedIn = false

  try {
    const supabase = await supabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      isLoggedIn = true
      const { data: profile } = await supabase
        .from("profiles")
        .select("tier")
        .eq("id", user.id)
        .single()

      userTier = profile?.tier ?? null
    }
  } catch {
    // no-op: unauthenticated or env not configured
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Script
        id="pricing-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />
      <Navbar />
      <PricingClientPage userTier={userTier} isLoggedIn={isLoggedIn} />
      <Testimonials />
      <Faq />
      <Footer />
    </main>
  )
}
