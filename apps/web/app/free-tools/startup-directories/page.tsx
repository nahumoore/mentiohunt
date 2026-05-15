import type { Metadata } from "next"

import { Footer, Navbar } from "@/components/landing"
import { StartupDirectoriesBrowser } from "./tool"

export const metadata: Metadata = {
  title: "Startup Directory Browser - Free Tool",
  description:
    "Browse a free startup directory table with category, pricing, authority, backlink, and submission signals. Find SaaS directory listing opportunities before running a gap scan.",
  alternates: {
    canonical: "/free-tools/startup-directories",
  },
  openGraph: {
    title: "Startup Directory Browser - Free Tool",
    description:
      "Browse startup directories, compare category and pricing signals, and jump into a directory backlink gap scan when you want to know which listings you are missing.",
    url: "https://mentiohunt.com/free-tools/startup-directories",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Startup Directory Browser - Free Tool",
    description:
      "Browse startup directories, compare category and pricing signals, and jump into a directory backlink gap scan.",
  },
}

export default function StartupDirectoriesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar overlay />
      <StartupDirectoriesBrowser />
      <Footer />
    </main>
  )
}
