import { IconArrowRight, IconBrandX } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

export function FounderIntro() {
  return (
    <section
      id="about"
      className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-20 left-1/4 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-princeton-orange/7 blur-[110px]" />
        <div className="absolute right-0 bottom-0 h-[28rem] w-[28rem] translate-x-1/4 rounded-full bg-amber-flame/6 blur-[100px]" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
            From the founder
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            Backlinks compounded. Running outreach was the job I didn't want.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Backlinks became my best growth channel — but prospecting, emailing,
            and following up was a full-time job on its own.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-6xl">
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1fr] lg:gap-14">
            {/* Left: photo + proof screenshots */}
            <div className="mx-auto w-full max-w-md lg:mx-0">
              {/* Compact founder photo with gradient fade */}
              <div className="relative mx-auto w-36 sm:w-44">
                <div className="overflow-hidden rounded-[1.5rem]">
                  <Image
                    src="/founder.webp"
                    alt="Nicolas More, founder of Mentiohunt"
                    width={400}
                    height={400}
                    className="aspect-square w-full object-cover object-top"
                  />
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-[1.5rem] bg-gradient-to-b from-transparent to-background" />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-blaze-orange)]/20 bg-background/90 px-3 py-1.5 shadow-md backdrop-blur-sm">
                    <p className="font-heading text-xs font-semibold tracking-[-0.01em]">
                      Nicolas More
                    </p>
                    <span className="text-border">·</span>
                    <Link
                      href="https://x.com/nicolasmore_"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[0.65rem] text-[var(--color-princeton-orange)] hover:underline"
                    >
                      <IconBrandX size={9} stroke={2.5} />
                      @nicolasmore_
                    </Link>
                  </div>
                </div>
              </div>

              {/* Stacked proof screenshots */}
              <div className="relative mt-10 pb-24">
                {/* Email reply — main top card */}
                <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-white shadow-[0_24px_64px_-20px_rgba(0,0,0,0.18)]">
                  <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-1.5 bg-background/80 px-3 py-2 backdrop-blur-sm">
                    <div className="size-2 rounded-full bg-red-400" />
                    <div className="size-2 rounded-full bg-yellow-400" />
                    <div className="size-2 rounded-full bg-green-400" />
                    <span className="ml-2 text-[0.6rem] text-muted-foreground/70">
                      Placement reply
                    </span>
                  </div>
                  <Image
                    src="/landing/mentiohunt-works-proof.webp"
                    alt="Editor reply agreeing to feature Mentiohunt in their article"
                    width={520}
                    height={400}
                    className="w-full pt-6"
                  />
                </div>

                {/* GSC — rotated card peeking bottom-right */}
                <div className="absolute bottom-0 left-[8%] right-[-6%] rotate-[5deg] overflow-hidden rounded-2xl border border-border/70 bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.22)]">
                  <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-1.5 bg-background/80 px-3 py-2 backdrop-blur-sm">
                    <div className="size-2 rounded-full bg-red-400" />
                    <div className="size-2 rounded-full bg-yellow-400" />
                    <div className="size-2 rounded-full bg-green-400" />
                    <span className="ml-2 text-[0.6rem] text-muted-foreground/70">
                      Google Search Console
                    </span>
                  </div>
                  <Image
                    src="/landing/gsc-proof.webp"
                    alt="Google Search Console — 222K impressions, growing organic traffic"
                    width={920}
                    height={356}
                    className="w-full pt-6"
                  />
                </div>
              </div>
            </div>

            {/* Right: narrative */}
            <div className="space-y-6 lg:pt-2">
              <blockquote className="border-l-2 border-[var(--color-blaze-orange)] pl-5 font-heading text-xl leading-snug font-medium tracking-[-0.02em] text-balance sm:text-2xl">
                &ldquo;Built a few backlinks and Google started sending traffic
                without me having to show up every day.&rdquo;
              </blockquote>

              <div className="space-y-4 text-base leading-7 text-muted-foreground">
                <p>
                  I started by creating content for one of my products and
                  building backlinks manually. Google started sending consistent
                  traffic — compounding every month without me having to be
                  there.
                </p>
                <p>
                  But doing the outreach side was a real job. Prospecting sites,
                  writing emails, following up, tracking replies. That bottleneck
                  meant most founders either hire an agency or skip link building
                  entirely.
                </p>
                <p>
                  Neither felt right. Agencies are expensive and opaque. I
                  didn&apos;t want to manage another vendor or run campaigns
                  myself.
                </p>
                <p>
                  So I built Mentiohunt to handle that part. Give it your site,
                  it finds opportunities, explains why they fit, and runs the
                  outreach. You just approve or reject — nothing else required.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full px-7 text-sm font-semibold shadow-lg shadow-primary/25"
                >
                  <Link href="/signup">
                    Get your first backlink opportunities
                    <IconArrowRight size={16} stroke={2.5} />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="h-12 rounded-full px-5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Link href="/about">Read the full story</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
