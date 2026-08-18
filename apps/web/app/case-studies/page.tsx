import type { Metadata } from "next"

import { CaseStudiesHeroSection, CaseStudiesIndexSection } from "@/components/case-studies"
import { Footer } from "@/components/landing/footer"
import { Navbar } from "@/components/landing/navbar"
import { getAllResources } from "@/lib/mdx"

export const metadata: Metadata = {
  title: "Case Studies",
  description:
    "Real backlink results from founders running automated outreach with Mentiohunt — the queue, the reply rate, and the links earned.",
  alternates: {
    canonical: "/case-studies",
  },
  openGraph: {
    title: "Case Studies — Mentiohunt",
    description:
      "Real backlink results from founders running automated outreach with Mentiohunt — the queue, the reply rate, and the links earned.",
    url: "https://mentiohunt.com/case-studies",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Case Studies — Mentiohunt",
    description:
      "Real backlink results from founders running automated outreach with Mentiohunt — the queue, the reply rate, and the links earned.",
  },
}

export default function CaseStudiesPage() {
  const studies = getAllResources("case-studies")

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        <CaseStudiesHeroSection />
        <CaseStudiesIndexSection studies={studies} />
      </main>

      <Footer />
    </div>
  )
}
