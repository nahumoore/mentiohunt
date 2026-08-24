import type { Metadata } from "next"
import { MDXRemote } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"

import { Footer, Navbar } from "@/components/landing"
import { RelatedFreeTools } from "@/components/free-tools"
import BlogStylings from "@/components/resources/blog-stylings"
import { FREE_TOOL_NAMES } from "@/consts/free-tools"
import { getPostBySlug } from "@/lib/mdx"

import { BulkEmailVerifier } from "./tool"

export const metadata: Metadata = {
  title: "Bulk Email Verifier - Free Tool",
  description:
    "Paste a list of contact emails and check each for syntax, disposable domains, and role-based addresses before you send outreach to it — free, no login required.",
  alternates: {
    canonical: "/free-tools/bulk-email-verifier",
  },
  openGraph: {
    title: "Bulk Email Verifier - Free Tool",
    description:
      "Paste a list of contact emails and check each for syntax, disposable domains, and role-based addresses before you send outreach to it — free, no login required.",
    url: "https://mentiohunt.com/free-tools/bulk-email-verifier",
    siteName: "Mentiohunt",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Mentiohunt – Backlink outreach on autopilot" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
    title: "Bulk Email Verifier - Free Tool",
    description:
      "Paste a list of contact emails and check each for syntax, disposable domains, and role-based addresses before you send outreach to it — free, no login required.",
  },
}

export default async function BulkEmailVerifierPage() {
  const post = getPostBySlug("bulk-email-verifier", "free-tools")

  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Bulk Email Verifier",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description:
      "Paste a list of contact emails and check each for syntax, disposable domains, and role-based addresses before you send outreach to it.",
    url: "https://mentiohunt.com/free-tools/bulk-email-verifier",
    publisher: {
      "@type": "Organization",
      name: "Mentiohunt",
      url: "https://mentiohunt.com",
    },
    featureList: [
      "Bulk paste of contact email addresses",
      "Syntax validation",
      "Disposable domain detection",
      "Role-based address detection",
      "Per-address status labels",
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
      <BulkEmailVerifier />

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

      <RelatedFreeTools currentSlug={FREE_TOOL_NAMES.bulkEmailVerifier} />

      <Footer />
    </main>
  )
}
