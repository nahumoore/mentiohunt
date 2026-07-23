import type { Metadata } from "next"
import { MDXRemote } from "next-mdx-remote/rsc"
import Script from "next/script"
import remarkGfm from "remark-gfm"

import { Footer, Navbar } from "@/components/landing"
import { RelatedFreeTools } from "@/components/free-tools"
import BlogStylings from "@/components/resources/blog-stylings"
import { FREE_TOOL_NAMES } from "@/consts/free-tools"
import { getPostBySlug } from "@/lib/mdx"

import { BacklinkOutreachEmailGenerator } from "./tool"

export const metadata: Metadata = {
  title: "Backlink Outreach Email Generator - Free Tool",
  description:
    "Generate four ready-to-send backlink outreach emails — guest post, broken link, resource page, and unlinked mention — each with a follow-up and plain-language guidance on when to use it.",
  alternates: {
    canonical: "/free-tools/backlink-outreach-email-generator",
  },
  openGraph: {
    title: "Backlink Outreach Email Generator - Free Tool",
    description:
      "Generate four ready-to-send backlink outreach emails — guest post, broken link, resource page, and unlinked mention — each with a follow-up and plain-language guidance on when to use it.",
    url: "https://mentiohunt.com/free-tools/backlink-outreach-email-generator",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Backlink Outreach Email Generator - Free Tool",
    description:
      "Generate four ready-to-send backlink outreach emails — guest post, broken link, resource page, and unlinked mention — each with a follow-up and plain-language guidance on when to use it.",
  },
}

export default async function BacklinkOutreachEmailGeneratorPage() {
  const post = getPostBySlug(
    "backlink-outreach-email-generator",
    "free-tools"
  )

  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Backlink Outreach Email Generator",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description:
      "Generate four ready-to-send backlink outreach emails — guest post, broken link, resource page, and unlinked mention — each with a follow-up and guidance on when to use it.",
    url: "https://mentiohunt.com/free-tools/backlink-outreach-email-generator",
    publisher: {
      "@type": "Organization",
      name: "Mentiohunt",
      url: "https://mentiohunt.com",
    },
    featureList: [
      "Guest post pitch email generation",
      "Broken link outreach email generation",
      "Resource page addition request generation",
      "Unlinked mention outreach email generation",
      "Follow-up email for each angle",
      "One-click copy per email and follow-up",
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
      <BacklinkOutreachEmailGenerator />

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

      <RelatedFreeTools currentSlug={FREE_TOOL_NAMES.backlinkOutreachEmailGenerator} />

      <Footer />
    </main>
  )
}
