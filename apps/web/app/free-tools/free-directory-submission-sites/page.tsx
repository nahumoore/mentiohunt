import type { Metadata } from "next"
import { MDXRemote } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"

import { Footer, Navbar } from "@/components/landing"
import { RelatedFreeTools } from "@/components/free-tools"
import BlogStylings from "@/components/resources/blog-stylings"
import { FREE_TOOL_NAMES } from "@/consts/free-tools"
import { getPostBySlug } from "@/lib/mdx"

import { DirectoryBacklinkOpportunityFinder } from "./tool"

export const metadata: Metadata = {
  title: "Free Directory Submission Sites for B2B SaaS - Free Tool",
  description:
    "Scan your product URL against 100+ free directory submission sites and see which ones you're missing. No sign-up. Built for B2B SaaS founders.",
  alternates: {
    canonical: "/free-tools/free-directory-submission-sites",
  },
  openGraph: {
    title: "Free Directory Submission Sites for B2B SaaS - Free Tool",
    description:
      "Scan your product URL against 100+ free directory submission sites and see which ones you're missing. No sign-up. Built for B2B SaaS founders.",
    url: "https://mentiohunt.com/free-tools/free-directory-submission-sites",
    siteName: "Mentiohunt",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Mentiohunt – Backlink outreach on autopilot" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
    title: "Free Directory Submission Sites for B2B SaaS - Free Tool",
    description:
      "Scan your product URL against 100+ free directory submission sites and see which ones you're missing. No sign-up. Built for B2B SaaS founders.",
  },
}

export default async function FreeDirectorySubmissionSitesPage() {
  const post = getPostBySlug(
    "free-directory-submission-sites",
    "free-tools"
  )

  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Free Directory Submission Sites",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description:
      "Scan your product URL against 100+ free directory submission sites and get a prioritized shortlist of the ones you're not listed on yet.",
    url: "https://mentiohunt.com/free-tools/free-directory-submission-sites",
    publisher: {
      "@type": "Organization",
      name: "Mentiohunt",
      url: "https://mentiohunt.com",
    },
    featureList: [
      "Product URL analysis",
      "Checks against 100+ free directory submission sites",
      "Directory category fit matching",
      "Free and paid submission filtering",
      "Prioritized top-10 next-action queue",
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
      <script
        id="tool-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      {faqSchema && (
        <script
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

      <RelatedFreeTools currentSlug={FREE_TOOL_NAMES.directoryBacklinkOpportunityFinder} />

      <Footer />
    </main>
  )
}
