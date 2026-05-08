import type { Metadata } from "next"
import { supabaseServer } from "@workspace/supabase/server"
import type { BillingTier } from "@/consts/billing"
import { Navbar, Footer, Testimonials } from "@/components/landing"
import { PricingClientPage } from "./client-page"

export const metadata: Metadata = {
  title: "Pricing – Mentiohunt",
  description:
    "Simple, transparent pricing for backlink building and community monitoring. Start free, upgrade when ready.",
  openGraph: {
    title: "Pricing – Mentiohunt",
    description:
      "Simple, transparent pricing for backlink building and community monitoring. Start free, upgrade when ready.",
    url: "https://mentiohunt.com/pricing",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing – Mentiohunt",
    description:
      "Simple, transparent pricing for backlink building and community monitoring. Start free, upgrade when ready.",
  },
}

export default async function PricingPage() {
  let userTier: BillingTier | null = null

  try {
    const supabase = await supabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
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
      <Navbar />
      <PricingClientPage userTier={userTier} />
      <Testimonials />
      <Footer />
    </main>
  )
}
