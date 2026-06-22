import {
  IconArrowLeft,
  IconArrowRight,
  IconChecks,
  IconMailSpark,
  IconMessage2,
  IconTargetArrow,
} from "@tabler/icons-react"
import type { Metadata } from "next"
import Script from "next/script"
import Link from "next/link"
import { notFound } from "next/navigation"

import { BigTestimonial } from "@/components/landing/big-testimonial"
import { Footer } from "@/components/landing/footer"
import { Navbar } from "@/components/landing/navbar"
import { Pricing } from "@/components/landing/pricing"
import { features, getFeatureBySlug } from "@/consts/features"
import { Button } from "@workspace/ui/components/button"

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

  const FeatureIcon = IconTargetArrow
  const alternateFeature = features.find((item) => item.slug !== feature.slug)

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
        <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 right-1/4 h-96 w-96 rounded-full bg-princeton-orange/7 blur-[100px]" />
            <div className="absolute top-1/3 -left-28 h-80 w-80 rounded-full bg-blaze-orange/8 blur-[100px]" />
          </div>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
          />

          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/features"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <IconArrowLeft size={14} stroke={2} />
              Back to features
            </Link>

            <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_0.86fr] lg:items-center lg:gap-16">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-[0.65rem] font-semibold text-[var(--color-princeton-orange)] uppercase">
                  <FeatureIcon size={13} stroke={2.6} />
                  {feature.eyebrow}
                </div>

                <h1 className="mt-6 font-heading text-4xl font-semibold tracking-[-0.06em] text-balance sm:text-6xl lg:text-[72px] lg:leading-[0.92]">
                  {feature.title}
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                  {feature.description}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-full px-7 text-sm font-semibold shadow-lg shadow-primary/25"
                  >
                    <Link href="/signup">
                      {feature.primaryCta}
                      <IconArrowRight size={16} stroke={2.5} />
                    </Link>
                  </Button>
                  {alternateFeature && (
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="h-12 rounded-full border-[var(--color-blaze-orange)]/25 bg-background/70 px-6 text-sm backdrop-blur transition-colors hover:border-[var(--color-princeton-orange)]/40 hover:bg-[var(--color-blaze-orange)]/8"
                    >
                      <Link href={`/features/${alternateFeature.slug}`}>
                        {feature.secondaryCta}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -right-4 -top-4 hidden h-24 w-24 rounded-[2rem] border border-[var(--color-amber-glow)]/35 bg-[var(--color-amber-glow)]/10 md:block" />
                <div className="relative overflow-hidden rounded-[2rem] border border-foreground/10 bg-foreground p-4 text-background shadow-[0_42px_120px_-46px_rgba(255,96,0,0.9)]">
                  <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/90 to-transparent" />
                  <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--color-blaze-orange)]/25 blur-3xl" />

                  <div className="relative rounded-[1.55rem] border border-background/10 bg-background/[0.06] p-5 backdrop-blur">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[0.62rem] font-semibold uppercase text-background/55">
                          Opportunity preview
                        </p>
                        <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.045em]">
                          {feature.heroCardTitle}
                        </h2>
                      </div>
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-amber-flame)] text-foreground shadow-lg shadow-[var(--color-amber-flame)]/20">
                        <FeatureIcon size={24} stroke={2.4} />
                      </div>
                    </div>

                    <p className="mt-5 text-sm leading-6 text-background/70">
                      {feature.heroCardDescription}
                    </p>

                    <div className="mt-6 rounded-[1.35rem] border border-background/10 bg-background/[0.075] p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/90 text-white">
                          <IconMailSpark size={20} stroke={2.4} />
                        </div>
                        <div>
                          <p className="text-[0.62rem] font-semibold uppercase text-background/50">
                            {feature.sampleLabel}
                          </p>
                          <p className="mt-1 font-heading text-base font-semibold tracking-[-0.025em]">
                            {feature.sampleTitle}
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 text-xs leading-6 text-background/62">
                        {feature.sampleBody}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-princeton-orange/7 blur-[100px]" />
          </div>

          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
                How it works
              </span>
              <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
              <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
                A focused workflow for {feature.keyword}.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                The template stays simple: better inputs, clearer scoring, and a
                prepared action instead of another blank spreadsheet.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-7">
                <p className="font-heading text-2xl font-semibold tracking-[-0.045em]">
                  Inputs that improve discovery
                </p>
                <div className="mt-6 space-y-3">
                  {feature.inputs.map((input) => (
                    <div key={input} className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                        <IconChecks size={16} stroke={2.5} />
                      </span>
                      <span className="text-sm leading-6 text-muted-foreground">
                        {input}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                {feature.workflow.map((step, index) => (
                  <div
                    key={step.title}
                    className="rounded-[1.7rem] border border-border bg-card p-5 shadow-sm"
                  >
                    <div className="flex gap-4">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-foreground font-heading text-sm font-semibold text-background">
                        0{index + 1}
                      </span>
                      <div>
                        <h3 className="font-heading text-xl font-semibold tracking-[-0.035em]">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-auto mt-6 max-w-6xl rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-7">
              <p className="font-heading text-2xl font-semibold tracking-[-0.045em]">
                What you get
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {feature.outcomes.map((outcome) => (
                  <div key={outcome} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                      <IconChecks size={16} stroke={2.5} />
                    </span>
                    <span className="text-sm leading-6 text-muted-foreground">
                      {outcome}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 top-20 h-80 w-80 rounded-full bg-princeton-orange/7 blur-[100px]" />
          </div>

          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
                Why founders use it
              </span>
              <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
              <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
                {feature.h2}
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                Mentiohunt gives you enough context to decide what deserves your
                time and what should stay out of the queue.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-6xl gap-5 lg:grid-cols-3">
              {feature.reasons.map((reason) => (
                <div
                  key={reason}
                  className="rounded-[1.7rem] border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                    <IconMessage2 size={22} stroke={2.4} />
                  </div>
                  <p className="mt-5 text-sm leading-7 text-muted-foreground">
                    {reason}
                  </p>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-12 grid max-w-6xl gap-5 lg:grid-cols-2">
              {feature.faq.map((item) => (
                <div
                  key={item.question}
                  className="rounded-[1.7rem] border border-border bg-muted/35 p-6"
                >
                  <h3 className="font-heading text-xl font-semibold tracking-[-0.035em]">
                    {item.question}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>

            {feature.relatedArticle && (
              <div className="mx-auto mt-10 max-w-6xl">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Related reading
                </p>
                <Link
                  href={feature.relatedArticle.href}
                  className="group flex items-center justify-between gap-4 rounded-[1.5rem] border border-border bg-card px-6 py-4 shadow-sm transition-colors hover:border-[var(--color-princeton-orange)]/40 hover:bg-[var(--color-blaze-orange)]/5"
                >
                  <span className="text-sm font-medium leading-6 text-foreground group-hover:text-[var(--color-princeton-orange)]">
                    {feature.relatedArticle.title}
                  </span>
                  <IconArrowRight
                    size={16}
                    stroke={2.5}
                    className="shrink-0 text-muted-foreground group-hover:text-[var(--color-princeton-orange)]"
                  />
                </Link>
              </div>
            )}

            <div className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/20 bg-[linear-gradient(135deg,var(--color-background)_0%,color-mix(in_oklab,var(--color-background)_78%,var(--color-amber-glow)_22%)_100%)] p-8 text-center shadow-[0_32px_100px_-48px_rgba(255,133,0,0.48)]">
              <p className="font-heading text-3xl font-semibold tracking-[-0.05em] text-balance sm:text-4xl">
                Start with one queue. Act on the clearest opportunity first.
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Mentiohunt is built for founders and small teams that need a
                practical distribution workflow, not another analytics-heavy
                dashboard.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-7 h-12 rounded-full px-7 text-sm font-semibold shadow-lg shadow-primary/25"
              >
                <Link href="/signup">Start for free</Link>
              </Button>
            </div>
          </div>
        </section>

        <BigTestimonial />
        <Pricing />
      </main>

      <Footer />
    </div>
  )
}
