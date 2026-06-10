import type { Metadata } from "next"
import { MDXRemote } from "next-mdx-remote/rsc"
import Script from "next/script"
import remarkGfm from "remark-gfm"

import { Footer, Navbar } from "@/components/landing"
import BlogStylings from "@/components/resources/blog-stylings"
import { getPostBySlug } from "@/lib/mdx"

import { DirectoryBacklinkOpportunityFinder } from "./tool"

export const metadata: Metadata = {
  title: "Directory Backlink Opportunity Finder - Free Tool",
  description:
    "Find startup directories where your product could submit for relevant backlink opportunities. Enter your product URL and review directory opportunities to apply for next.",
  alternates: {
    canonical: "/free-tools/directory-backlink-opportunity-finder",
  },
  openGraph: {
    title: "Directory Backlink Opportunity Finder - Free Tool",
    description:
      "Find startup directories where your product could submit for relevant backlink opportunities. Enter your product URL and review directory opportunities to apply for next.",
    url: "https://mentiohunt.com/free-tools/directory-backlink-opportunity-finder",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Directory Backlink Opportunity Finder - Free Tool",
    description:
      "Find startup directories where your product could submit for relevant backlink opportunities. Enter your product URL and review directory opportunities to apply for next.",
  },
}

export default async function DirectoryBacklinkOpportunityFinderPage() {
  const post = getPostBySlug(
    "directory-backlink-opportunity-finder",
    "free-tools"
  )

  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Directory Backlink Opportunity Finder",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description:
      "Find startup directories where your product could submit for relevant backlink opportunities. Enter your product URL and get a prioritized submission queue.",
    url: "https://mentiohunt.com/free-tools/directory-backlink-opportunity-finder",
    publisher: {
      "@type": "Organization",
      name: "Mentiohunt",
      url: "https://mentiohunt.com",
    },
    featureList: [
      "Product URL analysis",
      "Directory category fit matching",
      "Free and paid submission filtering",
      "Prioritized next-action queue",
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
      <DirectoryBacklinkOpportunityFinder />

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

      <Footer />
    </main>
  )
}
