import type { Metadata } from "next"
import Script from "next/script"
import { notFound } from "next/navigation"

import { BigTestimonial } from "@/components/landing/big-testimonial"
import { Footer } from "@/components/landing/footer"
import { Navbar } from "@/components/landing/navbar"
import { Pricing } from "@/components/landing/pricing"
import {
  FeatureBenefits,
  FeatureComparison,
  FeatureCta,
  FeatureFaq,
  FeatureHero,
  FeatureReasons,
  FeatureWorkflow,
} from "@/components/features"
import { features, getFeatureBySlug } from "@/consts/features"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return features.map((feature) => ({ slug: feature.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const feature = getFeatureBySlug(slug)

  if (!feature) return { robots: { index: false, follow: false } }

  return {
    title: feature.shortTitle,
    description: feature.description,
    alternates: {
      canonical: `https://mentiohunt.com/features/${feature.slug}`,
    },
    openGraph: {
      title: feature.shortTitle,
      description: feature.description,
      url: `https://mentiohunt.com/features/${feature.slug}`,
      siteName: "Mentiohunt",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: feature.shortTitle,
      description: feature.description,
    },
  }
}

export default async function FeaturePage({ params }: Props) {
  const { slug } = await params
  const feature = getFeatureBySlug(slug)

  if (!feature) notFound()

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://mentiohunt.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Features",
        item: "https://mentiohunt.com/features",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: feature.shortTitle,
        item: `https://mentiohunt.com/features/${feature.slug}`,
      },
    ],
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: feature.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: feature.shortTitle,
    description: feature.description,
    url: `https://mentiohunt.com/features/${feature.slug}`,
    dateModified: feature.updatedAt,
    publisher: {
      "@type": "Organization",
      name: "Mentiohunt",
      url: "https://mentiohunt.com",
    },
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Script
        id={`breadcrumb-schema-${feature.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id={`faq-schema-${feature.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id={`webpage-schema-${feature.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />

      <Navbar />

      <main className="flex-1">
        <FeatureHero feature={feature} />
        <BigTestimonial />
        <FeatureBenefits feature={feature} />
        <FeatureWorkflow feature={feature} />
        <FeatureComparison feature={feature} />
        <FeatureReasons feature={feature} />
        <Pricing />
        <FeatureFaq feature={feature} />
        <FeatureCta feature={feature} />
      </main>

      <Footer />
    </div>
  )
}
