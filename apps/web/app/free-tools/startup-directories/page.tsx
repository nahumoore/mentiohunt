import type { Metadata } from "next"
import type { Tables } from "@workspace/supabase/database-types"

import { Footer, Navbar } from "@/components/landing"
import { StartupDirectoriesBrowser } from "./tool"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

async function getDirectories(): Promise<Tables<"directories">[]> {
  const res = await fetch(`${APP_URL}/api/free-tool/directories`, {
    next: { revalidate: 3600 },
  })

  if (!res.ok) return []

  return res.json()
}

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

export default async function StartupDirectoriesPage() {
  const directories = await getDirectories()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar overlay />
      <StartupDirectoriesBrowser directories={directories} />
      <Footer />
    </main>
  )
}
