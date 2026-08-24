import type { Metadata } from "next"
import { notFound } from "next/navigation"

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
      type: "article",
      url: `https://mentiohunt.com/outreach-templates/${template.slug}`,
      siteName: "Mentiohunt",
      publishedTime: template.date,
      modifiedTime: template.dateModified ?? template.date,
      authors: ["Nicolas More"],
      images: template.image ? [template.image] : undefined,
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

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: template.title,
    description: template.description,
    datePublished: template.date,
    dateModified: template.dateModified ?? template.date,
    author: {
      "@type": "Person",
      name: "Nicolas More",
      url: "https://x.com/nicolasmore_",
    },
    publisher: {
      "@type": "Organization",
      name: "Mentiohunt",
      url: "https://mentiohunt.com",
    },
    url: `https://mentiohunt.com/outreach-templates/${template.slug}`,
    ...(template.image
      ? { image: `https://mentiohunt.com${template.image}` }
      : {}),
  }

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
      <script
        id="article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
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
