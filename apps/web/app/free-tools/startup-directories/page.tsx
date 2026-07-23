import type { Metadata } from "next"
import { MDXRemote } from "next-mdx-remote/rsc"
import Script from "next/script"
import remarkGfm from "remark-gfm"
import type { Tables } from "@workspace/supabase/database-types"

import { Footer, Navbar } from "@/components/landing"
import { RelatedFreeTools } from "@/components/free-tools"
import BlogStylings from "@/components/resources/blog-stylings"
import { FREE_TOOL_NAMES } from "@/consts/free-tools"
import { getPostBySlug } from "@/lib/mdx"
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
    "Browse a startup directory table with category, pricing, authority, and submission signals. Find SaaS directory listing opportunities before running a gap scan.",
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
  const [directories, post] = await Promise.all([
    getDirectories(),
    Promise.resolve(getPostBySlug("startup-directories", "free-tools")),
  ])

  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Startup Directory Browser",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description:
      "Browse a curated table of startup and SaaS directories with Domain Rating, referring domains, category, and submission pricing data.",
    url: "https://mentiohunt.com/free-tools/startup-directories",
    publisher: {
      "@type": "Organization",
      name: "Mentiohunt",
      url: "https://mentiohunt.com",
    },
    featureList: [
      "Sortable by Domain Rating and referring domains",
      "Category and pricing filters",
      "Free and paid submission indicators",
      "Verified submission URLs",
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
      <StartupDirectoriesBrowser directories={directories} />

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

      <RelatedFreeTools currentSlug={FREE_TOOL_NAMES.startupDirectories} />

      <Footer />
    </main>
  )
}
