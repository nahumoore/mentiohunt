import type { Metadata } from "next"
import type { Tables } from "@workspace/supabase/database-types"

import { Footer, Navbar } from "@/components/landing"
import { supabaseServer } from "@/lib/supabase/server"
import { StartupDirectoriesBrowser } from "./tool"

async function getDirectories(): Promise<Tables<"directories">[]> {
  const supabase = await supabaseServer()

  const { data } = await supabase
    .from("directories")
    .select(
      "id, name, domain, submit_url, category, is_free, is_active, submit_url_ok, submit_url_verified_at, check_method, slug_pattern, domain_rating, backlinks, referring_domains, dofollow_backlinks, dofollow_referring_domains, seo_metrics_updated_at, created_at"
    )
    .eq("is_active", true)
    .order("domain_rating", { ascending: false, nullsFirst: false })

  return data ?? []
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
