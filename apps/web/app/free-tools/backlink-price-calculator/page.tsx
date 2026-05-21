import type { Metadata } from "next"

import { Footer, Navbar } from "@/components/landing"

import { BacklinkPriceCalculator } from "./tool"

export const metadata: Metadata = {
  title: "Backlink Price Calculator - Free Tool",
  description:
    "Estimate the fair market price of a backlink from any website. Enter a URL to pull live Domain Rating, backlinks, and traffic data from Ahrefs, then adjust link type, placement, and content type to refine your estimate.",
  alternates: {
    canonical: "/free-tools/backlink-price-calculator",
  },
  openGraph: {
    title: "Backlink Price Calculator - Free Tool",
    description:
      "Estimate the fair market price of a backlink from any website. Enter a URL to pull live Domain Rating, backlinks, and traffic data from Ahrefs, then adjust link type, placement, and content type to refine your estimate.",
    url: "https://mentiohunt.com/free-tools/backlink-price-calculator",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Backlink Price Calculator - Free Tool",
    description:
      "Estimate the fair market price of a backlink from any website. Enter a URL to pull live Domain Rating, backlinks, and traffic data from Ahrefs, then adjust link type, placement, and content type to refine your estimate.",
  },
}

export default function BacklinkPriceCalculatorPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar overlay />
      <BacklinkPriceCalculator />
      <Footer />
    </main>
  )
}
