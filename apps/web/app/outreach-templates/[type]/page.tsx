import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Script from "next/script"

import { Footer } from "@/components/landing/footer"
import { Navbar } from "@/components/landing/navbar"
import {
  OutreachTemplateContentSection,
  OutreachTemplateCtaSection,
  OutreachTemplateDetailHeroSection,
  OutreachTemplateFaqSection,
  OutreachTemplateRelatedSection,
  getOutreachTemplate,
  getOutreachTemplateSlugs,
  getRelatedOutreachTemplates,
} from "@/components/outreach-templates"

type Props = { params: Promise<{ type: string }> }

export function generateStaticParams() {
  return getOutreachTemplateSlugs().map((slug) => ({ type: slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params
  const template = getOutreachTemplate(type)

  if (!template) return {}

  return {
    title: { absolute: template.title },
    description: template.description,
    alternates: {
      canonical: `/outreach-templates/${template.slug}`,
    },
    openGraph: {
      title: template.title,
      description: template.description,
      url: `https://mentiohunt.com/outreach-templates/${template.slug}`,
      siteName: "Mentiohunt",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: template.title,
      description: template.description,
    },
  }
}

export default async function OutreachTemplateDetailPage({ params }: Props) {
  const { type } = await params
  const template = getOutreachTemplate(type)

  if (!template) notFound()

  const relatedTemplates = getRelatedOutreachTemplates(template.slug)

  const faqSchema =
    template.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: template.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }
      : null

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {faqSchema && (
        <Script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <Navbar />

      <main className="flex-1">
        <OutreachTemplateDetailHeroSection template={template} />
        <OutreachTemplateContentSection template={template} />
        <OutreachTemplateFaqSection template={template} />
        <OutreachTemplateRelatedSection templates={relatedTemplates} />
        <OutreachTemplateCtaSection />
      </main>

      <Footer />
    </div>
  )
}
