import type { Metadata } from "next"

import { Footer } from "@/components/landing/footer"
import { Navbar } from "@/components/landing/navbar"
import {
  OutreachTemplateCtaSection,
  OutreachTemplatesHeroSection,
  OutreachTemplatesHubFaqSection,
  OutreachTemplatesIndexSection,
  getAllOutreachTemplates,
  type OutreachTemplateDefinition,
} from "@/components/outreach-templates"

export const metadata: Metadata = {
  title: "Outreach Email Templates",
  description:
    "Backlink outreach email templates by scenario — blogger outreach, guest post, backlink request, broken link, and podcast pitch — each with a mock example.",
  alternates: {
    canonical: "/outreach-templates",
  },
  openGraph: {
    title: "Outreach Email Templates — Mentiohunt",
    description:
      "Backlink outreach email templates by scenario — blogger outreach, guest post, backlink request, broken link, and podcast pitch — each with a mock example.",
    url: "https://mentiohunt.com/outreach-templates",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Outreach Email Templates — Mentiohunt",
    description:
      "Backlink outreach email templates by scenario — blogger outreach, guest post, backlink request, broken link, and podcast pitch — each with a mock example.",
  },
}

function matchesQuery(
  template: OutreachTemplateDefinition,
  query: string
): boolean {
  const haystack =
    `${template.title} ${template.description}`.toLowerCase()
  return haystack.includes(query.toLowerCase())
}

type Props = {
  searchParams: Promise<{ q?: string }>
}

export default async function OutreachTemplatesPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim() ?? ""
  const allTemplates = getAllOutreachTemplates()
  const templates = query
    ? allTemplates.filter((template) => matchesQuery(template, query))
    : allTemplates

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        <OutreachTemplatesHeroSection
          query={query}
          resultCount={templates.length}
          totalCount={allTemplates.length}
        />
        <OutreachTemplatesIndexSection templates={templates} query={query} />
        <OutreachTemplateCtaSection />
        <OutreachTemplatesHubFaqSection />
      </main>

      <Footer />
    </div>
  )
}
