import {
  IconArrowRight,
  IconBellRinging,
  IconBolt,
  IconChecks,
  IconMailSpark,
  IconTargetArrow,
} from "@tabler/icons-react"
import type { Metadata } from "next"
import Script from "next/script"
import Link from "next/link"

import { Footer } from "@/components/landing/footer"
import { Navbar } from "@/components/landing/navbar"
import { features } from "@/consts/features"
import { Button } from "@workspace/ui/components/button"

export const metadata: Metadata = {
  title: "Features",
  description:
    "Mentiohunt gives founders two practical queues: backlink opportunities worth reviewing and community threads worth answering before momentum disappears.",
  alternates: {
    canonical: "https://mentiohunt.com/features",
  },
  openGraph: {
    title: "Features — Mentiohunt",
    description:
      "Mentiohunt gives founders two practical queues: backlink opportunities worth reviewing and community threads worth answering before momentum disappears.",
    url: "https://mentiohunt.com/features",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Features — Mentiohunt",
    description:
      "Mentiohunt gives founders two practical queues: backlink opportunities worth reviewing and community threads worth answering before momentum disappears.",
  },
}

const featureIcons = [IconTargetArrow, IconBellRinging]

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Mentiohunt Features",
  url: "https://mentiohunt.com/features",
  itemListElement: features.map((feature, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: feature.shortTitle,
    url: `https://mentiohunt.com/features/${feature.slug}`,
    description: feature.description,
  })),
}

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Script
        id="item-list-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-28 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-princeton-orange/7 blur-[100px]" />
            <div className="absolute top-28 -right-28 h-80 w-80 rounded-full bg-blaze-orange/8 blur-[100px]" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-amber-glow/8 blur-[100px]" />
          </div>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)`,
              backgroundSize: "44px 44px",
            }}
          />

          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
                Product features
              </span>
              <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
              <h1 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.055em] text-balance sm:text-6xl lg:text-[76px] lg:leading-[0.9]">
                Backlink building and community monitoring for founders.
              </h1>
              <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                Mentiohunt gives founders two practical queues: backlink
                opportunities worth reviewing and community threads worth
                answering before momentum disappears.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-6xl gap-5 lg:grid-cols-2">
              {features.map((feature, index) => {
                const Icon = featureIcons[index % featureIcons.length]!

                return (
                  <Link
                    key={feature.slug}
                    href={`/features/${feature.slug}`}
                    className="group relative flex min-h-[34rem] flex-col overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-blaze-orange)]/35 hover:shadow-[0_28px_90px_-46px_rgba(255,96,0,0.72)] sm:p-7"
                  >
                    <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/70 to-transparent" />
                    <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--color-princeton-orange)]/10 blur-3xl transition-opacity group-hover:opacity-80" />
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex size-12 items-center justify-center rounded-[1.25rem] bg-[var(--color-blaze-orange)] text-white shadow-lg shadow-[var(--color-blaze-orange)]/20">
                        <Icon size={24} stroke={2.4} />
                      </div>
                      <span className="rounded-full border border-[var(--color-blaze-orange)]/20 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-[0.62rem] font-semibold text-[var(--color-princeton-orange)] uppercase">
                        {feature.category}
                      </span>
                    </div>

                    <div className="mt-8">
                      <p className="text-[0.68rem] font-bold text-muted-foreground/60 uppercase">
                        {feature.keyword}
                      </p>
                      <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.05em] text-balance sm:text-4xl">
                        {feature.title}
                      </h2>
                      <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                        {feature.description}
                      </p>
                    </div>

                    <div className="mt-8 rounded-[1.5rem] border border-border/80 bg-muted/35 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-background text-[var(--color-princeton-orange)]">
                          <IconMailSpark size={21} stroke={2.4} />
                        </div>
                        <div>
                          <p className="font-heading text-base font-semibold tracking-[-0.025em]">
                            {feature.sampleTitle}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {feature.sampleLabel}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-5 pt-8">
                      <div>
                        <p className="font-heading text-3xl font-semibold tracking-[-0.045em] text-[var(--color-princeton-orange)]">
                          {feature.metric}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {feature.metricLabel}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-all group-hover:gap-2">
                        View feature
                        <IconArrowRight size={15} stroke={2.6} />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-princeton-orange/7 blur-[100px]" />
          </div>
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
                One operating loop
              </span>
              <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
              <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
                Built for founders asking, what should I do next?
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                The product stays intentionally practical: feed it context,
                review the queue, act on the highest-fit opportunity.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-6xl gap-4 md:grid-cols-3">
              {[
                "Import product, content, competitors, and keywords.",
                "Review opportunities with plain-language fit rationale.",
                "Send outreach or reply while the opportunity is still useful.",
              ].map((step, index) => (
                <div
                  key={step}
                  className="rounded-[1.7rem] border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                    {index === 0 ? (
                      <IconBolt size={21} stroke={2.4} />
                    ) : (
                      <IconChecks size={21} stroke={2.4} />
                    )}
                  </div>
                  <p className="mt-5 font-heading text-xl font-semibold tracking-[-0.035em]">
                    {step}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 flex justify-center">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full px-7 text-sm font-semibold shadow-lg shadow-primary/25"
              >
                <Link href="/signup">Start for free</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
