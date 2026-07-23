import type { Metadata } from "next"
import { MDXRemote } from "next-mdx-remote/rsc"
import Script from "next/script"
import remarkGfm from "remark-gfm"

import { Footer, Navbar } from "@/components/landing"
import { RelatedFreeTools } from "@/components/free-tools"
import BlogStylings from "@/components/resources/blog-stylings"
import { FREE_TOOL_NAMES } from "@/consts/free-tools"
import { getPostBySlug } from "@/lib/mdx"

import { BacklinkOpportunityFinder } from "./tool"

export const metadata: Metadata = {
  title: "Backlink Opportunity Finder - Free Tool",
  description:
    "Find websites, blogs, and content hubs where a backlink to your product fits. For founders who want real outreach targets, not a generic link list.",
  alternates: {
    canonical: "/free-tools/backlink-opportunity-finder",
  },
  openGraph: {
    title: "Backlink Opportunity Finder - Free Tool",
    description:
      "Find websites, blogs, and content hubs where a backlink to your product fits. For founders who want real outreach targets, not a generic link list.",
    url: "https://mentiohunt.com/free-tools/backlink-opportunity-finder",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Backlink Opportunity Finder - Free Tool",
    description:
      "Find websites, blogs, and content hubs where a backlink to your product fits. For founders who want real outreach targets, not a generic link list.",
  },
}

export default async function BacklinkOpportunityFinderPage() {
  const post = getPostBySlug("backlink-opportunity-finder", "free-tools")

  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Backlink Opportunity Finder",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description:
      "Enter your website URL and find relevant websites, blogs, and content hubs where a backlink to your product would be a strong fit.",
    url: "https://mentiohunt.com/free-tools/backlink-opportunity-finder",
    publisher: {
      "@type": "Organization",
      name: "Mentiohunt",
      url: "https://mentiohunt.com",
    },
    featureList: [
      "Niche-relevant site discovery",
      "Resource page opportunities",
      "Link roundup opportunities",
      "Plain-language fit rationale per result",
    ],
  }

  const faqSchema =
    post?.meta.faqs && post.meta.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.meta.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }
      : null

  const components = BlogStylings()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Script
        id="tool-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      {faqSchema && (
        <Script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <Navbar overlay />
      <BacklinkOpportunityFinder />

      {post && (
        <section className="border-t border-border/60 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="container mx-auto max-w-3xl">
            <article className="prose-headings:font-heading prose-headings:tracking-tight text-foreground">
              <MDXRemote
                source={post.content}
                components={components}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm],
                    rehypePlugins: [],
                  },
                }}
              />
            </article>

            {post.meta.faqs && post.meta.faqs.length > 0 && (
              <div className="mt-16">
                <h2 className="font-heading text-3xl font-semibold tracking-tight">
                  Frequently asked questions
                </h2>
                <div className="mt-8 space-y-6">
                  {post.meta.faqs.map((faq) => (
                    <div
                      key={faq.question}
                      className="rounded-2xl border border-border bg-card p-6"
                    >
                      <h3 className="font-heading text-base font-semibold tracking-tight">
                        {faq.question}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <RelatedFreeTools currentSlug={FREE_TOOL_NAMES.backlinkOpportunityFinder} />

      <Footer />
    </main>
  )
}
